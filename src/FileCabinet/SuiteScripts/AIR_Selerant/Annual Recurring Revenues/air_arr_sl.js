/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/translation', 'N/file', 'N/format'], function (search, serverWidget, translation, file, format) {


    var MONTHS = 13;

    function formatDate(date) {
        return ((date.getDate() < 10) ? "0" : "") + date.getDate() + '/' + ((date.getMonth() < 9) ? "0" : "") + +(1 + date.getMonth()) + '/' + date.getFullYear();
    }


    //1 - 8
    function calculateNRR(fromIndex, rows, startColumns) {
        var sum = [];
        for (var i = 0; i < MONTHS + 2; i++) {
            sum.push(0)
        }

        for (var iR = fromIndex; iR < rows.length; iR++) {
            var r = rows[iR];
            for (var i = 0; i < MONTHS + 2; i++) {
                sum[i] += r[i + startColumns];
            }
        }
        for (var iR = fromIndex; iR < rows.length; iR++) {
            var r = rows[iR];

            var NRR = [];
            var NEGATIVERR = [];

            for (var i = 0; i < MONTHS + 2; i++) {

                var neg = 0;
                var nrr = 0;
                // Se il mese si azzera
                if (sum[i] == 0) {
                    if ((i + startColumns - 1) > 7) neg = -r[i + startColumns - 1];
                }
                // se il mese prima è 0
                if (sum[i - 1] == 0) {
                    nrr = r[i + startColumns];
                }
                NRR.push(nrr)
                NEGATIVERR.push(neg);

            }

            NRR.forEach(function (e) {
                r.push(e)
            });
            NEGATIVERR.forEach(function (e) {
                r.push(e)
            });

        }




    }


    function calculateFormula(
        onMonth,
        column

    ) {
        columnMap = {
            'amount': 'else {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ))',
            'fxamount': 'else {fxamount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate})))',
            'quantity': 'else {quantityuom} ',
            'unbilled': 'when {status} like \'Closed%\' then 0 when {status} like \'Billed%\' then 0 else {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) * ({quantity}-{quantitybilled}) / {quantity} ',
            'unbilled2': 'when {status} like \'Closed%\' then 0 when {status} like \'Pending Approval%\' then 0 when {status} like \'Billed%\' then 0 else {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) * ({quantity}-{quantitybilled}) / {quantity} ',
            'pending':  'when {status} like \'Pending Appro%\' then {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) else 0 '
        }

        var str =
            "case when MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) < 0 OR {revrecenddate} < LAST_DAY(TO_DATE('" + onMonth +
            "', 'dd/mm/yyyy')) OR trunc({revrecstartdate},'MM') > TO_DATE('" + onMonth + "', 'dd/mm/yyyy') OR MONTHS_BETWEEN({revrecenddate}, TO_DATE('" +
            onMonth + "', 'dd/mm/yyyy')) < 0 OR 0=ROUND(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate})) then 0  " +
            columnMap[column] +
            "  end";
        return str;
    }

    function getData(fParam) {

        var ret = {};
        var curDate = new Date();

        if (fParam.data) {
            var s = fParam.data.split('.');
            curDate = new Date(s[0], s[1] - 1, 1);
        }

        var detail = fParam.detail;
        if (!detail) {
            detail = 'G';
        }

        var refDate = new Date(curDate.getFullYear(), curDate.getMonth(), 1);

        var gstartDate = new Date(refDate.getFullYear(), refDate.getMonth() - MONTHS, 1);
        var startDateRef = new Date(refDate.getFullYear(), refDate.getMonth() - MONTHS, 1);
        var gendDate = new Date(refDate.getFullYear(), refDate.getMonth() + 2, 0);
        log.audit('startDate', gstartDate);
        log.audit('gendDate', gendDate);
        var colKeyToAdd = ['Customer', 'H Customer', 'Item', 'H Item InternalId', 'Order', 'H InternalId','Status'];
        var colValueToAdd = ['', '', '', '', '', '',''];

        var iAdd = 0;
        var ret = {
            detail: fParam.detail,
            customer: fParam.customer,
            class: !!fParam.class ? fParam.class.split(",") : fParam.class,
            subsidiary: fParam.subsidiary,
            productline: fParam.productline,
            data: fParam.data,
            colkey: [],
            colvalue: [],
            rowdata: [],
        };

        var filters = [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["item.custitem_sel_type_item", "anyof", 3, 6], //MANTEINANCE and  SAS
            "AND",
            ["status","noneof","SalesOrd:C"],  // Dovremmo forse escludere gli ordini cancellati, no ???
            "AND", 
            ["memorized","is","F"], 
            "AND",
            ["revrecstartdate", "onorbefore", format.format({
                type: format.Type.DATE,
                value: gendDate
            })],
            "AND",
            ["revrecenddate", "onorafter", format.format({
                type: format.Type.DATE,
                value: gstartDate
            })],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["taxline", "is", "F"]
        ];



        if (fParam.customer && fParam.customer != '') {
            log.debug('TMP Customer', fParam.customer);
            filters.push('and', ['name', 'anyof', fParam.customer]);
        }

        if (ret.class && ret.class.length > 0) {
            filters.push('and', ['class', 'anyof', ret.class]);
        }

        if (fParam.subsidiary && fParam.subsidiary != '') {

            filters.push('and', ['subsidiary', 'anyof', fParam.subsidiary]);
        }
        if (fParam.productline && fParam.productline != '') {
            filters.push('and', ["item.custitem_product_line", 'anyof', fParam.productline]);
        }


        var filters2 = [];

        var columns2 = [];

        filters.forEach(function (a) {
            filters2.push(a)
        });




        var columns = [
            search.createColumn({
                name: "formulatext",
                formula: "nvl({customermain.custentity_sel_group_name},{customermain.companyname})",
                label: "Group",
                summary: "GROUP",
                sort: search.Sort.ASC,

            }),
            search.createColumn({
                name: "custitem_sel_type_item",
                join: "item",
                label: "Revenue",
                summary: "GROUP"
            })
        ];


        if (detail.match('C')) {
            columns.push(
                search.createColumn({
                    name: "companyname",
                    join: "customerMain",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: 'Customer'
                }),
                search.createColumn({
                    name: "internalid",
                    join: "customerMain",
                    summary: "GROUP",
                    label: 'H Entity internal id'
                }));
            iAdd += 2;

            //customerColId = columns.length;
        }
        if (detail.match('I')) {
            log.debug("detail.additem");
            columns.push(
                itemColumn = search.createColumn({
                    name: "item",
                    summary: "GROUP",
                    label: 'Item'
                }),
                search.createColumn({
                    name: "internalid",
                    join: "item",
                    label: "H Item internal id",
                    summary: "GROUP"
                })
            );
            iAdd += 2;
        }
        var tranIdColumn = null;
        if (detail.match('O')) {
            log.debug("detail.document");
            columns.push(
                tranIdColumn = search.createColumn({
                    name: "tranid",
                    summary: "GROUP",
                    label: 'Document'
                })
            );
            columns.push(
                tranIdColumn = search.createColumn({
                    name: "internalid",
                    summary: "GROUP",
                    label: 'H Sales Order Internal Id'
                })
            );
            columns.push(
                tranIdColumn = search.createColumn({
                    name: "status",
                    summary: "min",
                    label: 'Status'
                })
            );
            iAdd += 3;
        }

        colKeyToAdd = colKeyToAdd.splice(iAdd);
        colValueToAdd = colValueToAdd.splice(iAdd);
        log.debug('colValueToAdd', colValueToAdd);

        ret.colkey = columns.map(function (c) {
            return c.label;
        });


        log.debug('colkey', ret.colkey);

        ret.colkeyQ = ret.colkey;
        ret.colkey = ret.colkey.concat(colKeyToAdd);

        log.debug('colkey with add', ret.colkey);


        var columnsUnbilled = [];


        for (var i = -MONTHS; i < 2; i++) {

            var gstartDate = new Date(refDate.getFullYear(), refDate.getMonth() + i, 1);


            var fgstartDate = formatDate(gstartDate);

            var fgendDate = formatDate(new Date(refDate.getFullYear(), refDate.getMonth() + i + 1, 0));

            log.emergency("calc dates ", fgstartDate + " -- " + fgendDate);

            columns.push(
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'amount'),
                    label: (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                })
            );

            columnsUnbilled.push(
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'unbilled2'),
                    label: 'UB' + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                })
            );
            columnsUnbilled.push(
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'pending'),
                    label: 'PG' + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                })
            );
            
        }

        ret.colvalue = columns.slice(ret.colkeyQ.length).map(function (c) {
            return c.label;
        });
        log.emergency(" ret.colvalue  ", ret.colvalue);

        columns.slice(ret.colkeyQ.length).forEach(function (c) {
            ret.colvalue.push('NRR ' + c.label);
        });
        log.debug(" ret.colvalue NRR ", ret.colvalue);
        columns.slice(ret.colkeyQ.length).forEach(function (c) {
            ret.colvalue.push('LOST ' + c.label);
        });
        log.debug(" ret.colvalue LOST ", ret.colvalue);


        columns2.push(
            search.createColumn({
                name: "formulatext",
                formula: "nvl({customermain.custentity_sel_group_name},{customermain.companyname})",
                label: "Group",
                summary: "GROUP",
                sort: search.Sort.ASC,

            }))
        columns2.push(search.createColumn({
            name: "internalid",
            join: "customerMain",
            summary: "GROUP",
            label: 'H Entity internal id',
            sort: search.Sort.ASC,
        }));

        var customerColId = columns2.length - 1;

        columns2.push(search.createColumn({
            name: "internalid",
            join: "item",
            label: "H Item internal id",
            summary: "GROUP",
            sort: search.Sort.ASC
        }));


        var itemColId2 = columns2.length;

        for (var i = -MONTHS + 1; i < 2; i++) {
            var gstartDate = new Date(refDate.getFullYear(), refDate.getMonth() + i, 1);
            var gOldDate = new Date(refDate.getFullYear(), refDate.getMonth() + i - 1, 1);
            var fgstartDate = formatDate(gstartDate);
            var fgOldDate = formatDate(gOldDate);

            columns2.push(
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'fxamount'),
                    //"case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecstartdate},'MM') = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {fxamount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) else 0 end",
                    label: "FXAMT NEW " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'amount'),
                    //"case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecstartdate},'MM') = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) else 0 end",
                    label: "AM NEW " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'quantity'),
                    //"case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecstartdate},'MM') = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {quantityuom} else 0 end",
                    label: "QTA NEW " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgOldDate, 'fxamount'),
                    //"case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecenddate}+1,'MM') = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {fxamount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) else 0 end",
                    label: "FXAMT OLD " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: calculateFormula(fgOldDate, 'amount'),
                    //"case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecenddate}+1,'MM') = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {amount} / ROUND((MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) )) else 0 end",
                    label: "AM OLD " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: calculateFormula(fgOldDate, 'quantity'),
                    // "case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecenddate}+1,'MM')  = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {quantityuom} else 0 end",
                    label: "QTA OLD " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),



                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'unbilled'),
                    // "case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecenddate}+1,'MM')  = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {quantityuom} else 0 end",
                    label: "Unbilled " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                }),

                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: calculateFormula(fgstartDate, 'pending'),
                    // "case when round(MONTHS_BETWEEN({revrecenddate}, {revrecstartdate}) ) != 0 and TRUNC( {revrecenddate}+1,'MM')  = TO_DATE('" + fgstartDate + "', 'dd/mm/yyyy') then {quantityuom} else 0 end",
                    label: "pending approval " + (1 + gstartDate.getMonth()) + '/' + gstartDate.getFullYear()
                })

               
            );
        }




        // if (detail.match('I')) {
        //     log.debug("detail.additem product line");
        //     columns.push(
        //         search.createColumn({
        //             name:"custitem_product_line",
        //             join: "item",
        //             summary: "GROUP",
        //             label: 'Product line'
        //         })
        //     );
        // }



        var transactionSearchObj = search.create({
            type: "transaction",
            filters: filters,
            columns: columns
        });


        columnsUnbilled.forEach(function (e){columns.push(e)});
        

        transactionSearchObj.title = '[DIEGO] TEST ARR 4';
        try {
            transactionSearchObj.save();
        } catch (E) { }

        var rowdata = [];
        var rowdataUnbilled = [];
        var rowdataPending = [];
        var pRun = transactionSearchObj.runPaged({
            pageSize: 1000
        });


        var grp = "";
        var startGrp = 0;

        var itemNames = [];
        var customerNames = [];
        pRun.pageRanges.forEach(function (pageRange) {
            var searchPage = pRun.fetch({
                index: pageRange.index
            });
            searchPage.data.forEach(function (result) {

                var row = [];
                var rowUnbilled = [];
                var rowPending = [];

                for (var i = 0; i < ret.colkeyQ.length; i++) {
                    var t = result.getText(result.columns[i]);
                    if (t == null || t == '') {
                        t = result.getValue(result.columns[i]);
                    }
                    row.push(t);
                    rowUnbilled.push(t);
                    rowPending.push(t);

                }

                if (detail.match('I')) {
                    itemNames.push(row[4]);
                }
                customerNames.push(row[0]);
                colValueToAdd.forEach(function (e) {
                    row.push(e);
                    rowUnbilled.push(e);
                    rowPending.push(e);
                });

                // for (var i = ret.colkeyQ.length; i < result.columns.length; i++) { // no, fino a curCol
                var l = result.columns.length - columnsUnbilled.length;
                for (var i = ret.colkeyQ.length; i < l; i++) {
                    var t = result.getValue(result.columns[i]);
                    row.push(parseFloat(t));
                }


                if (grp != row[0]) {
                    log.debug('calculateNRR', {
                        grp: grp,
                        new: row[0],
                        startGrp: startGrp
                    });
                    calculateNRR(startGrp, rowdata, ret.colkey.length);
                    startGrp = rowdata.length;
                    grp = row[0];

                }

                rowdata.push(row);


                var takeUB = false;
                var takeP = false;
                for (var i = l; i < result.columns.length; i++) {
                    var t = result.getValue(result.columns[i]);
                    var n = parseFloat(t);
                    rowUnbilled.push(n);
                    if (n) {
                        takeUB = true;
                    }
                    i++
                    var t = result.getValue(result.columns[i]);
                    var n = parseFloat(t);
                    rowPending.push(n);
                    
                    if (n) {
                        takeP = true;
                    }
                }
                if (takeUB) {
                    rowdataUnbilled.push(rowUnbilled);
                }
                if (takeP) {
                    rowdataPending.push(rowPending);
                }



            });
        });


        if (customerNames.length > 0) {
            customerNames = customerNames.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            });
            var newCustomersMap = getNewCustomers(customerNames, format.format({
                type: format.Type.DATE,
                value: startDateRef
            }));
            log.emergency("newCustomersMap", newCustomersMap);
            ret.newCustomers = newCustomersMap;
        }

        if (itemNames.length > 0) {
            itemNames = itemNames.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            });
            var productLineMap = getProductLines(itemNames);
            log.emergency("productLineMap", productLineMap);
            ret.productLineMap = productLineMap;
        }
        log.debug('calculateNRR.end', {
            startGrp: startGrp
        });
        calculateNRR(startGrp, rowdata, ret.colkey.length);


        var transactionSearchObj = search.create({
            type: "transaction",
            filters: filters2,
            columns: columns2
        });


        transactionSearchObj.title = '[DIEGO] TEST ARR 4 - 2';
        try {
            transactionSearchObj.save();
        } catch (E) {}


        var rowdata2 = [];
        var pRun = transactionSearchObj.runPaged({
            pageSize: 1000
        });


        var grp = "";
        var startGrp = 0;

        var itemNames = [];
        var customerNames = [];
        pRun.pageRanges.forEach(function (pageRange) {
            var searchPage = pRun.fetch({
                index: pageRange.index
            });
            searchPage.data.forEach(function (result) {


                var row2 = [];
                for (var i = 0; i < itemColId2; i++) {
                    var t = result.getText(result.columns[i]);
                    if (t == null || t == '') {
                        t = result.getValue(result.columns[i]);
                    }

                    row2.push(t);
                }



                for (var i = itemColId2; i < result.columns.length; i++) { // no, fino a curCol
                    //for (var i = ret.colkeyQ.length; i < curCol; i++) {
                    var t = result.getValue(result.columns[i]);
                    row2.push(parseFloat(t));
                }


                rowdata2.push(row2);


            });
        });





        overview = calculateOverview(rowdata2, itemColId2, customerColId-1 , 14);

        // log.audit(" rowdata ", rowdata);
        // log.audit(" rowdata2 ", rowdata2);
        // log.debug("overview", overview);

        ret.rowdata = rowdata;
        ret.rowdataUnbilled = rowdataUnbilled;
        ret.rowdataPending = rowdataPending;
        // ret.rowdata2 = rowdata2;
        ret.overview = overview.result;
        ret.overviewitems = overview.resultLines;
        ret.overviewcustomer = overview.customerData;
        return ret;

    }


    function calculateOverview(rowdata, startLen, customerColId, periods) {
        var result = [];
        var resultLines = [];

        var customerData = {};

        for (var iRow = 0; iRow < rowdata.length; iRow++) {
            var customer = rowdata[iRow][customerColId],

                vData = customerData[customer];

            if (!vData) {
                vData = [];
                for (var i = 0; i < periods; i++) {
                    vData.push(0, 0);
                }
                customerData[customer] = vData;
            }
            for (var i = 0; i < periods; i++) {
                vData[i * 2] += rowdata[iRow][startLen + i * 8 + 1] // NEW
                vData[i * 2 + 1] += rowdata[iRow][startLen + i *8 + 4] // OLD
            }
        }

        log.debug('customerData', customerData);
        for (var i = 0; i < periods; i++) {

            var outGlobal = {
                upsell: 0,
                downsell: 0,
                price: 0,
                fx: 0,
                crosssell: 0,
                difference: 0,
                churn: 0,
                new: 0,
                arr: 0,
                arrbop: 0,
                boh: 0,
                lines: 0,
                linesarr: 0,
                unbilled:0,
                pending:0,
                compares :[],
                

            };

            for (var iRow = 0; iRow < rowdata.length; iRow++) {

                var out = {
                    upsell: 0,
                    downsell: 0,
                    price: 0,
                    fx: 0,
                    crosssell: 0,
                    difference: 0,
                    churn: 0,
                    new: 0,
                    boh: 0
                };


                var param = {
                    customer: rowdata[iRow][customerColId],
                    item: rowdata[iRow][customerColId + 1],
                    fxnew: rowdata[iRow][startLen + i * 8],
                    anew: rowdata[iRow][startLen + i * 8 + 1],
                    qnew: rowdata[iRow][startLen + i * 8 + 2],
                    fxold: rowdata[iRow][startLen + i * 8 + 3],
                    aold: rowdata[iRow][startLen + i * 8 + 4],
                    qold: rowdata[iRow][startLen + i * 8 + 5],
                    unbilled: rowdata[iRow][startLen + i * 8 + 6],
                    pending: rowdata[iRow][startLen + i * 8 + 7],
                };


                var differnce = param.anew - param.aold;

                if (differnce) {

                    out.difference = differnce;

                    var anewtot = customerData[param.customer][i * 2];
                    var aoldtot = customerData[param.customer][i * 2 + 1];

                    if (aoldtot == 0 && anewtot != 0) {
                        out.new += differnce;
                    } else if (anewtot == 0 && aoldtot != 0) {
                        out.churn += differnce;
                    } else
                    if (param.qold == param.qnew) {
                        if (param.fxold == param.fxnew) {
                            out.fx += differnce;
                        } else {
                            out.price += differnce;
                        }
                    } else
                    if (param.qold > 0 && param.qold > param.qnew) {
                        out.downsell += differnce;
                    } else if (param.qold > 0 && param.qnew > param.qold) {
                        out.upsell += differnce;
                    } else if (param.qold == 0) {
                        // Attenzione che devo escludere il caso di new.
                        // è un cross sell se ci sono altre vendite in corso su quel cliente. 
                        var altreVenditeCliente = rowdata.filter(function (e) {
                            return e[customerColId] == param.customer && e[customerColId + 1] != param.item
                        })
                        var altreVenditeChiuse = altreVenditeCliente.filter(function (e) {
                            return e[startLen + i * 6 + 5] > 0
                        })

                        if (altreVenditeChiuse.length > 0) {
                            out.crosssell += differnce;
                        } else
                        if (param.qold > param.qnew) {
                            out.downsell += differnce;
                        } else {
                            out.upsell += differnce;
                        }
                    } else {
                        out.boh += differnce;
                    }


                    if (differnce != (out.crosssell + out.downsell + out.upsell + out.price + out.fx + out.churn + out.new)) {
                        out.boh += differnce - (out.crosssell + out.downsell + out.upsell + out.price + out.fx + out.churn + out.new);
                    }







                    outGlobal.crosssell += out.crosssell * 12;
                    outGlobal.downsell += out.downsell * 12;
                    outGlobal.upsell += out.upsell * 12;
                    outGlobal.price += out.price * 12;
                    outGlobal.fx += out.fx * 12;
                    outGlobal.difference += differnce * 12;
                    outGlobal.churn += out.churn * 12
                    outGlobal.new += out.new * 12
                    outGlobal.boh += out.boh * 12
                   
                    outGlobal.lines++;
                 //   outGlobal.compares.push(out);
                }
                outGlobal.arr += param.anew * 12
                outGlobal.arrbop += param.aold * 12
                outGlobal.unbilled += param.unbilled * 12
                outGlobal.pending += param.pending * 12
                outGlobal.linesarr++;



            }

            result.push(outGlobal);
        }
        return {
            resultLines: resultLines,
            result: result,
            customerData: customerData
        };

    }

    function getProductLines(itemNames) {
        var filters = [];

        for (var i = 0; i < itemNames.length; i++) {
            filters.push(["name", "is", itemNames[i]]);
            if ((i + 1) != itemNames.length) {
                filters.push("OR");
            }
        }
        var itemSearchObj = search.create({
            type: "item",
            filters: filters,
            columns: [
                search.createColumn({
                    name: "itemid",
                    sort: search.Sort.ASC
                }),
                "custitem_product_line"
            ]
        });
        var map = {};
        itemSearchObj.run().each(function (result) {
            map[result.getValue("itemid")] = result.getText("custitem_product_line");
            return true;
        });
        return map;
    }

    function getNewCustomers(customerNames, startDate) {

        var customerFilter = [];
        for (var i = 0; i < customerNames.length; i++) {
            customerFilter.push(["customermain.entityid", "is", customerNames[i]], "OR", ["formulatext: {customermain.custentity_sel_group_name}", "is", customerNames[i]]);
            if ((i + 1) != customerNames.length) {
                customerFilter.push("OR");
            }
        }
        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters: [
                ["type", "anyof", "SalesOrd"],
                "AND",
                ["item.custitem_sel_type_item", "anyof", "3", "6"],
                "AND",
                ["revrecstartdate", "onorbefore", startDate],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                customerFilter
            ],
            columns: [
                search.createColumn({
                    name: "formulatext",
                    summary: "GROUP",
                    formula: "nvl({customermain.custentity_sel_group_name},{customermain.companyname})",
                    sort: search.Sort.ASC
                }),
                search.createColumn({
                    name: "custitem_sel_type_item",
                    join: "item",
                    summary: "GROUP"
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: "{amount}"
                })
            ]
        });
        // salesorderSearchObj.title = '[FELIPE] TEST ARR OLDERS THEN '+startDate;
        //
        // try {
        //     salesorderSearchObj.save();
        // } catch (E) { }



        var searchResultCount = salesorderSearchObj.runPaged().count;

        var mapWithOldCustomers = {};
        salesorderSearchObj.run().each(function (result) {
            if (!mapWithOldCustomers[result.getValue(result.columns[0])]) {
                mapWithOldCustomers[result.getValue(result.columns[0])] = {};
            }
            if (!mapWithOldCustomers[result.getValue(result.columns[0])][result.getText(result.columns[1])]) {
                mapWithOldCustomers[result.getValue(result.columns[0])][result.getText(result.columns[1])] = result.getValue(result.columns[2]);
            }
            return true;
        });
        log.audit("salesorderSearchObj OLDERS result count " + searchResultCount, mapWithOldCustomers);
        log.audit("salesorderSearchObj OLDERS customerNames ", customerNames);

        var newCustomers = [];
        for (var i = 0; i < customerNames.length; i++) {
            if (!mapWithOldCustomers[customerNames[i]]) {
                newCustomers.push(customerNames[i]);
            }
        }
        return newCustomers;
    }

    function writeForm(PAGE, context) {
        var form = serverWidget.createForm({
            title: translation.get({
                collection: PAGE.collection,
                key: PAGE.TITLE
            })()
        });





        form.clientScriptModulePath = './air_arr_cl.js';



        var pField = form.addField({
            id: 'custpage_page',
            label: 'page',
            type: 'longtext',
        });
        pField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        pField.defaultValue = JSON.stringify(PAGE);


        var hField = form.addField({
            id: 'custpage_htmlinject',
            label: 'page',
            type: 'inlinehtml',
        });
        hField.defaultValue = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';


        for (i = 0; i < PAGE.FILTERS.length; i++) {
            if (PAGE.FILTERS[i].labelkey) {
                PAGE.FILTERS[i].label = translation.get({
                    collection: PAGE.collection,
                    key: PAGE.FILTERS[i].labelkey
                })();
            }
            var fieldCrSubs = form.addField(
                PAGE.FILTERS[i]
            );
            if (PAGE.FILTERS[i].displayType) {
                fieldCrSubs.updateDisplayType({
                    displayType: PAGE.FILTERS[i].displayType
                });
            }
            if (!!PAGE.FILTERS[i].mandatory) fieldCrSubs.isMandatory = true;
            if (PAGE.FILTERS[i].defaultValue) {
                fieldCrSubs.defaultValue = PAGE.FILTERS[i].defaultValue;
                // } else {
                //     fieldCrSubs.defaultValue = pageParameters[PAGE.FILTERS[i].id];
            }
            if (PAGE.FILTERS[i].values) {
                if (!PAGE.FILTERS[i].mandatory) {
                    fieldCrSubs.addSelectOption({
                        value: "",
                        text: ""
                    });
                }
                for (var k in PAGE.FILTERS[i].values) {
                    fieldCrSubs.addSelectOption({
                        value: k,
                        text: PAGE.FILTERS[i].values[k]
                    });
                }
            }
        }

        if (PAGE.SUBTABS) {
            for (i = 0; i < PAGE.SUBTABS.length; i++) {
                var tab = PAGE.SUBTABS[i];
                if (tab.labelkey) {
                    tab.label = translation.get({
                        collection: PAGE.collection,
                        key: tab.labelkey
                    })();
                }
                form.addSubtab(
                    tab
                );


                var htmlField = form.addField({
                    id: tab.id + '_html',
                    label: tab.label,
                    type: 'inlinehtml',
                    container: tab.id
                })
                htmlField.defaultValue = '.';
            }
        }

        form.addButton({
            id: 'custpage_load',
            label: 'Load',
            functionName: 'loadData'
        });
        form.addButton({
            id: 'custpage_exportxlsx',
            label: 'Export XLSX',
            functionName: 'exportExcel'
        });


        context.response.writePage(form);
    }

    function getClasses() {
        var classificationSearchObj = search.create({
            type: "classification",
            filters: [
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC
                })
            ]
        });
        var classes = {
            "@NONE@": "-None-"
        };
        classificationSearchObj.run().each(function (result) {
            classes[String(result.id)] = result.getValue({
                name: "name"
            });
            return true;
        });
        return classes;
    }

    function onRequest(context) {
        var params = context.request.parameters;

        if (params.result == 'json') {
            var data = getData(params);

            context.response.write({
                output: JSON.stringify(data)
            });
        } else {
            var classes = getClasses();

            var PAGE = {
                collection: "custcollection_air_sel_strings",
                TITLE: "ARRFORMTITLE",
                FILTERS: [{
                        id: "custpage_air_arr_month",
                        type: serverWidget.FieldType.DATE,
                        labelkey: 'MONTH',
                        mandatory: true,
                        defaultValue: new Date()
                    }, {
                        id: "custpage_air_arr_detail",
                        type: 'SELECT',
                        labelkey: 'CUSTOMERGROUP',
                        mandatory: true,
                        values: {
                            'G': 'Group',
                            'C': 'Customer',
                            'CI': 'Item',
                            'CIO': 'Order'
                        }
                    }, {
                        id: "custpage_air_customer",
                        type: 'SELECT',
                        labelkey: 'CUSTOMER',
                        mandatory: false,
                        source: 'customer',
                    }, {
                        id: "custpage_air_subsidiary",
                        type: 'SELECT',
                        labelkey: 'SUBSIDIARY',
                        mandatory: false,
                        source: 'subsidiary'
                    },
                    {
                        id: "custpage_air_arr_class",
                        type: 'MULTISELECT',
                        labelkey: 'CLASS',
                        mandatory: false,
                        values: classes
                    },
                    {
                        id: "custpage_air_productline",
                        type: 'SELECT',
                        labelkey: 'PRODUCTLINE',
                        mandatory: false,
                        source: 'customrecord_product_line'
                    },
                    {
                        id: "custpage_debug_info",
                        type: 'LONGTEXT',
                        label: 'Debug Info',
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    },

                ],

                SUBTABS: [{
                        id: 'custpage_graph',
                        labelkey: 'FC_GRAPH',
                        template: file.load('./arr_graph.html').url
                    },
                    {
                        id: 'custpage_summary',
                        labelkey: 'FC_SUMMARY',
                        template: file.load('./arr_summary.html').url
                    },

                    {
                        id: 'custpage_month',
                        labelkey: 'REV_MONTH',
                        template: file.load('./arr_month_profit.html').url
                    },
                    {
                        id: 'custpage_month_unbilled',
                        labelkey: 'UNBILLED_MONTH',
                        template: file.load('./arr_month_unbilled.html').url
                    },
                    {
                        id: 'custpage_month_pending',
                        labelkey: 'PENDING_MONTH',
                        template: file.load('./arr_month_pending.html').url
                    },
                    /*
                    {
                        id: 'custpage_detail',
                        labelkey: 'FC_DETAIL',
                        template: file.load('./arr_detail.html').url
                    },
                    */
                    {
                        id: 'custpage_lost',
                        label: 'Lost',
                        template: file.load('./arr_detail.html').url
                    },
                    {
                        id: 'custpage_output',
                        label: 'ACV Bridge Overview',
                        template: file.load('./arr_output_tab.html').url
                    },


                    // {
                    //     id: 'custpage_detail2',
                    //     labelkey: 'FC_DETAIL',
                    //     template: file.load('./arr_rowdata2.html').url
                    // },

                ]
            };


            writeForm(PAGE, context);

        }
    }

    return {
        onRequest: onRequest
    };
});