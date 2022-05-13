/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', './ns_underscore.js', 'N/format', './xlsx.full.min.js'], function (currentRecord, underscore, format, XLSX) {
    function pageInit(context) {
        debugger;
        document.openDetail = openDetail;
        document.calculdatedData = {};
    }

    function getURL() {
        var url = location.href;
        var rec = currentRecord.get();
        var PAGE = JSON.parse(rec.getValue('custpage_page'));

        PAGE.FILTERS.forEach(function (i) {
            if (i.type != 'LONGTEXT' && i.type != 'DATE') {
                var v = rec.getValue(i.id);
                if (v && v != '') {
                    url += '&' + i.id + '=' + encodeURIComponent(rec.getValue(i.id));
                }
            }
        })


        return url;
    }


    function draw(result) {
        debugger;
        var rec = currentRecord.get();
        var PAGE = JSON.parse(rec.getValue('custpage_page'));
        rec.setValue('custpage_debug_info', result);
        var resultData = JSON.parse(result);

        var summary = createSummary([], resultData);
        console.log("Summary", summary);
        var arr = calcARRNNR(summary);
        console.log("arr", arr);
        document.calculdatedData.arr = arr;
        PAGE.SUBTABS.forEach(function (tab) {
            var newHtml = '';

            if (tab.template == 'rowdata') {

                newHtml = result;

            } else
            if (tab.template != '') {
                try {
                    var template = '';
                    jQuery.ajax({
                        type: "GET",
                        url: tab.template,
                        async: false,
                        success: function (response) {
                            template = response;
                        }
                    });
                    var templateToMerge = underscore.template(template);

                    newHtml = templateToMerge({
                        resultData: resultData,
                        isLost: ((tab.id == 'custpage_lost') ? true : false),
                        template: tab.template,
                        onlyLine: false,
                        format: format,
                        summary: summary,
                        arr: arr,
                        funct: {
                            createSummary: createSummary,
                            calcARRNNR: calcARRNNR
                        }

                    });
                } catch (E) {
                    newHtml = 'Errore' + E
                }
            }
            document.getElementById(tab.id + '_html_val').innerHTML = '';

            jQuery('#' + tab.id + '_html_val').append(newHtml)
        });

    }

    function loadData() {
        debugger;
        var rec = currentRecord.get();


        var html = '<style>#loader {  position: absolute;  left: 50%;  top: 50%;  z-index: 3;  width: 150px;  height: 150px; ' +
            ' margin: -75px 0 0 -75px;  border: 16px solid #f3f3f3;  border-radius: 50%;  border-top: 16px solid #3498db; width: 120px;  height: 120px;' +
            ' -webkit-animation: spin 2s linear infinite;  animation: spin 2s linear infinite;} @-webkit-keyframes spin {  0% { -webkit-transform: rotate(0deg); } ' +
            ' 100% { -webkit-transform:rotate(360deg); }} @keyframes spin {0% { transform: rotate(0deg); }  100% { transform: rotate(360deg); }} ' +
            '#cover{   position:fixed;   top:0; left:0;   background:rgba(256,256,256,0.9);   z-index:1;   width:100%;   height:100%;   display:none; }' +
            '</style><div id="loader"></div>\n';

        if (jQuery("#loader").length == 0) {
            jQuery('body').append(html);
        }
        jQuery("#loader").show();

        var urlToCall = getURL() + '&result=json';

        var data = rec.getValue('custpage_air_arr_month');
        urlToCall += '&data=' + encodeURIComponent(data.getFullYear() + '.' + (1 + data.getMonth()));
        var detail = rec.getValue('custpage_air_arr_detail');
        urlToCall += '&detail=' + encodeURIComponent(detail);
        var customer = rec.getValue('custpage_air_customer');
        if (customer && customer != '') {
            urlToCall += '&customer=' + encodeURIComponent(customer);
        }
        var classe = rec.getValue('custpage_air_arr_class');
        if (classe && classe != '') {
            urlToCall += '&class=' + encodeURIComponent(classe);

        }
        var subsidiary = rec.getValue('custpage_air_subsidiary');
        if (subsidiary && subsidiary != '') {
            urlToCall += '&subsidiary=' + encodeURIComponent(subsidiary);
        }
        var productline = rec.getValue('custpage_air_productline');
        if (productline && productline != '') {
            urlToCall += '&productline=' + encodeURIComponent(productline);
        }
        console.log("urlToCall", urlToCall)
        jQuery.get(urlToCall).then(function (result) {

            draw(result);

            jQuery("#loader").hide();
        })
    }

    function openDetail(entity) {
        debugger;

        if (entity.attributes.sales_order_internal_id) {
            window.open("/app/accounting/transactions/salesord.nl?id=" + entity.attributes.sales_order_internal_id.value);
        } else if (entity.attributes.entity_internal_id) {
            window.open("/app/common/entity/custjob.nl?id=" + entity.attributes.entity_internal_id.value);
        } else if (entity.attributes.item_internal_id) {
            window.open("/app/common/item/item.nl?id=" + entity.attributes.item_internal_id.value)
        }
    }

    function createSummary(columns, resultData) {
        var ret = {};
        var colKey = [];
        for (var i = 0; i < columns.length; i++) {
            colKey.push(resultData.colkey[columns[i]])
        }

        ret.colkey = colKey,
            ret.colvalue = resultData.colvalue;
        ret.rowdata = [];



        var map = {};
        var iO = resultData.colkey.length;
        resultData.rowdata.forEach(function (e) {
            var kVals = [];
            var key = '#';
            if (columns.length > 0) {
                kVals = columns.map(function (i) {
                    return e[i]
                });
                key = kVals.join('#');
            }


            var curVal = map[key];
            if (curVal == null) {
                curVal = kVals.concat(resultData.colvalue.map(function (a) {
                    return 0
                }));
                map[key] = curVal;
            }
            for (var i = 0; i < ret.colvalue.length; i++) {
                curVal[i + columns.length] += e[i + iO];
            }

        });

        for (k in map) {
            ret.rowdata.push(map[k]);
        }


        return ret;
    }

    function calcARRNNR(resultData) {

        var newRowDate = [];
        var l = resultData.colkey.length;
        for (var i = 0; i < resultData.rowdata.length; i++) {

            var key = resultData.rowdata[i].slice(0, resultData.colkey.length);
            //
            // var totalR = resultData.rowdata[i].slice(l, l + 13);
            // var newR = resultData.rowdata[i].slice(l + 13, l + 13 + 12);
            // var lostR = resultData.rowdata[i].slice(l + 25, l + 25 + 12);
            console.log("keyresultData", resultData)
            var totalR = resultData.rowdata[i].slice(l + 1, l + 15);
            var newR = resultData.rowdata[i].slice(l + 16, l + 16 + 14);
            var lostR = resultData.rowdata[i].slice(l + 31, l + 31 + 14);
            console.log("totalR", totalR)
            console.log("newR", newR)
            console.log("lostR", lostR)
            for (var i = 0; i < 14; i++) { //#endregion
                var mrr = totalR[i];
                var numeratoreNRR = mrr - newR[i];
                var pastArr = ((i == 0) ? resultData.rowdata[i][0] : totalR[i - 1]) * 12;
                var arr = mrr * 12;
                var newMonth = newR[i] * 12;
                var nrr = Math.round(10000 * ((pastArr == 0) ? 0 : (arr - newMonth) / pastArr)) / 100;

                var other = arr - pastArr - newR[i] * 12 - lostR[i] * 12;

                //var nrr = (numeratoreNRR==0)?0:(totalR[i ] != 0) ? (100 * numeratoreNRR / totalR[i]) : null;

                var a = {
                    label: resultData.colvalue[i + 1],
                    key: key,
                    arr: arr,
                    marr: mrr,
                    nu: numeratoreNRR,
                    nrr: nrr,
                    newR: newR[i],
                    l: lostR[i],
                    pastArr: pastArr,
                    other: other
                };
                newRowDate.push(a);
            }
        }

        return {
            colkey: resultData.colkey,
            rowData: newRowDate

        }

    }

    function getSummaryMrrSheetAoa() {
        var aoa = [];
        var header = ["Month", "MRR", "NRR", "ARR"];
        aoa.push(header);
        for (var r in document.calculdatedData.arr.rowData) {
            aoa.push([document.calculdatedData.arr.rowData[r].label, document.calculdatedData.arr.rowData[r].marr, document.calculdatedData.arr.rowData[r].nrr, document.calculdatedData.arr.rowData[r].arr]);
        }
        return aoa;
    }

    function getSummaryTopCustomersSheetAoa() {
        var aoa = [];
        var header = ["Top Customers", "Saas", "Maintenance"];
        aoa.push(header);
        for (var r in document.calculdatedData.top10) {
            aoa.push([document.calculdatedData.top10[r].name, document.calculdatedData.top10[r].Saas, document.calculdatedData.top10[r].Maintenance]);
        }
        return aoa;
    }

    function getSummaryNewCustomersSheetAoa() {
        var aoa = [];
        var header = ["New Customers", "Saas", "Maintenance"];
        aoa.push(header);
        for (var r in document.calculdatedData.top10new) {
            aoa.push([document.calculdatedData.top10new[r].name, document.calculdatedData.top10new[r].Saas, document.calculdatedData.top10new[r].Maintenance]);
        }
        return aoa;
    }

    function getSummaryProductLinesSheetAoa() {
        var aoa = [];
        var header = ["Product Lines", "Saas", "Maintenance"];
        aoa.push(header);
        for (var r in document.calculdatedData.productLines) {
            aoa.push([r, document.calculdatedData.productLines[r].Saas, document.calculdatedData.productLines[r].Maintenance]);
        }
        return aoa;
    }

    function getDetailSheetAoa(debug_info) {
        var aoa = [];
        var header = debug_info.colkey;
        var cols = debug_info.colvalue.splice(1, 14)
        cols.splice(14, 1)
        header = header.concat(cols);
        aoa.push(header);
        for (var r in debug_info.rowdata) {
            var filteredData = debug_info.rowdata[r];
            filteredData = filteredData.splice(0, 9 + 15);
            filteredData.splice(9, 1)
            aoa.push(filteredData);
        }
        return aoa;
    }

    function getUnbilledData() {
        var rec = currentRecord.get();
        var debug_info = JSON.parse(rec.getValue('custpage_debug_info'))
        var aoa = [];
        var header = debug_info.colkey;
        var cols = debug_info.colvalue.splice(1, 14)
        cols.splice(14, 1)
        header = header.concat(cols);
        aoa.push(header);
        for (var r in debug_info.rowdataUnbilled) {
            var filteredData = debug_info.rowdataUnbilled[r];
            filteredData = filteredData.splice(0, 9 + 15);
            filteredData.splice(9, 1)
            aoa.push(filteredData);
        }
        return aoa;
    }

    function getPendingData() {
        var rec = currentRecord.get();
        var debug_info = JSON.parse(rec.getValue('custpage_debug_info'))
        var aoa = [];
        var header = debug_info.colkey;
        var cols = debug_info.colvalue.splice(1, 14)
        cols.splice(14, 1)
        header = header.concat(cols);
        aoa.push(header);
        for (var r in debug_info.rowdataPending) {
            var filteredData = debug_info.rowdataPending[r];
            filteredData = filteredData.splice(0, 9 + 15);
            filteredData.splice(9, 1)
            aoa.push(filteredData);
        }
        return aoa;
    }

    function getLostSheetAoa() {
        var rec = currentRecord.get();
        var debug_info = JSON.parse(rec.getValue('custpage_debug_info'))
        var aoa = [];
        var header = debug_info.colkey;
        var cols = debug_info.colvalue;
        header = header.concat(cols.splice(31));
        aoa.push(header);
        for (var r in debug_info.rowdata) {
            var filteredData = debug_info.rowdata[r];
            aoa.push(filteredData.splice(0, 8).concat(filteredData.splice(39 - 8)));
        }
        return aoa;
    }

    function exportExcel() {
        var rec = currentRecord.get();
        var debug_info = rec.getValue('custpage_debug_info');
        if (!debug_info) return;
        debug_info = JSON.parse(debug_info)
        var detailData = getDetailSheetAoa(debug_info);
        var detailUnbilledData = getUnbilledData();
        var detailPendingData = getPendingData();
        var lostData = getLostSheetAoa();
        var mrrData = getSummaryMrrSheetAoa();
        var top10Data = getSummaryTopCustomersSheetAoa();
        var topNewData = getSummaryNewCustomersSheetAoa();
        var productLinesData = getSummaryProductLinesSheetAoa();

        /* make the worksheet */
        var detailWS = XLSX.utils.aoa_to_sheet(detailData);
        var lostWS = XLSX.utils.aoa_to_sheet(lostData);
        var mrrWS = XLSX.utils.aoa_to_sheet(mrrData);
        var top10WS = XLSX.utils.aoa_to_sheet(top10Data);
        var topNewWS = XLSX.utils.aoa_to_sheet(topNewData);
        var productLinesWS = XLSX.utils.aoa_to_sheet(productLinesData);
        var unbilledWs = XLSX.utils.aoa_to_sheet(detailUnbilledData);
        var pendingWS= XLSX.utils.aoa_to_sheet(detailPendingData);

        /* add to workbook */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, mrrWS, "MRR");
        XLSX.utils.book_append_sheet(wb, top10WS, "Top 10 Customers");
        XLSX.utils.book_append_sheet(wb, topNewWS, "Top 10 New Customers");
        XLSX.utils.book_append_sheet(wb, productLinesWS, "Product Lines");
        XLSX.utils.book_append_sheet(wb, detailWS, "Detail");
        XLSX.utils.book_append_sheet(wb, unbilledWs, "Unbilled");
        XLSX.utils.book_append_sheet(wb, pendingWS, "Pending Approval");

        XLSX.utils.book_append_sheet(wb, lostWS, "Lost");
        /* generate an XLSX file */
        XLSX.writeFile(wb, "ARR.xlsx");
    }

    return {
        pageInit: pageInit,
        loadData: loadData,
        exportExcel: exportExcel,
        openDetail: openDetail,
        createSummary: createSummary,
        calcARRNNR: calcARRNNR
    }
});