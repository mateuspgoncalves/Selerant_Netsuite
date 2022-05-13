/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/translation', 'N/file'], function (search, serverWidget, translation, file) {

    /*


    
{custbody_swe_contract_start_date},
{custbody_swe_contract_end_date},

{revrecstartdate},
{revrecenddate}

{startdate}{enddate}

*/

    const START_DATE = '(coalesce({custbody_swe_contract_start_date},{revrecstartdate},{startdate}))';
    const END_DATE = '(coalesce({custbody_swe_contract_end_date},{revrecenddate},{enddate}))';

    function formatDate(date) {
        return ((date.getDate() < 10) ? "0" : "") + date.getDate() + '/' + ((date.getMonth() < 9) ? "0" : "") + + (1 + date.getMonth()) + '/' + date.getFullYear();
    }

    function getData(fParam) {

        var ret = {
            colkey: [],
            colvalue: [],
            rowdata: []
        }

        var filters = [
            ["mainline", "is", "F"],
            "AND",
            ["type", "anyof", "Opprtnty", "SalesOrd", "Estimate"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["item.type", "noneof", "Description"],
            "AND",
            ["closed", "is", "F"],
            "AND",
            ["cogs", "is", "F"],
            "AND",
            ["amount", "notequalto", "0.00"],
            "AND",
            ["formulanumeric: {quantity}-{quantitybilled}", "greaterthan", "0"]
        ];

        if (fParam.customer && fParam.customer != '') {

            filters.push('and', ['name', 'anyof', fParam.customer]);
        }


        var columns = [
            search.createColumn({
                name: "createdfrom",
                label: "HCreatedFrom"
            }),
            search.createColumn({
                name: "internalid",
                label: "hInternalId"
            }),
            search.createColumn({
                name: "type",
                label: "Type"
            }),
      
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {job.internalid} is not NULL THEN ({job.entityid} || ' ' || {job.jobname}) ELSE{number} END",
                label: "Rif."
            }),
            search.createColumn({
                name: "formulatext",
                formula: "{customermain.companyname}",
                label: "Customer"
            }),
            search.createColumn({
                name: "classnohierarchy",
                label: "Area"
            }),
            search.createColumn({
                name: "subsidiarynohierarchy",
                label: "Subs"
            }),
            // search.createColumn({
            //     name: "incomeaccount",
            //     join: "item",
            //     label: "Revenue"
            // }),
            search.createColumn({
                name: "custitem_sel_type_item",
                join: "item",
                label: "Revenue"
            }),
            search.createColumn({
                name: "custentity_cust_industry",
                join: "customerMain",
                label: "Market"
            }),
            search.createColumn({
                name: "custentity_customer_account_manager",
                join: "customerMain",
                label: "Account"
            }),
            search.createColumn({
                name: "formulatext",
                formula: "CASE WHEN {type} in('Estimate', 'Opportunity') THEN'Prospect' ELSE 'Current' END",
                label: "Type"
            }),
            search.createColumn({
                name: "formulapercent",
                formula: "{custcol_sel_success_probability}",
                label: "percent"
            }),

        ];

        ret.colkey = columns.map(function (c) {
            return c.label
        });
        var year = fParam.year;
        if (!year) {
            year = new Date().getFullYear();

        }
        for (var i = 1; i <= 12; i++) {
            var month = ((i < 10) ? "0" : "") + i;

            var gstartDate = new Date(year,  i-1, 1);


            var fgstartDate = formatDate(gstartDate);

            var fgendDate = formatDate(new Date(year, i , 0));


            columns.push(


                search.createColumn({
                    name: "formulacurrency",
                    

                    formula: "case when "+  END_DATE +
                        " <TO_DATE('"+ fgstartDate +"', 'dd/mm/yyyy') OR " + START_DATE 
                        +" > TO_DATE('"+ fgendDate +"', 'dd/mm/yyyy')  " +
                        " then 0 else {amount} / "+
                        " ROUND((MONTHS_BETWEEN(" + END_DATE + ", " + START_DATE + ") )) end",
                   
                    //formula: "CASE WHEN TO_CHAR(" + START_DATE + ",'MM')<='" + month + "' AND TO_CHAR(" + START_DATE + ",'YYYY')=(" + year + ")THEN ({amount}/(ROUND(MONTHS_BETWEEN(" + END_DATE + "," + START_DATE + "),0))) ELSE 0 END",
                    label: month + "- Potential Next Year"
                })

            );
        }
        for (var i = 1; i <= 12; i++) {
            var month = ((i < 10) ? "0" : "") + i;
            var gstartDate = new Date(year,  i-1, 1);


            var fgstartDate = formatDate(gstartDate);

            var fgendDate = formatDate(new Date(year, i + 1, 0));
            columns.push(


                search.createColumn({
                    name: "formulacurrency",
                    //formula: "CASE WHEN TO_CHAR(" + START_DATE + ",'MM')<='" + month + "' AND TO_CHAR(" + START_DATE + ",'YYYY')=(" + year + ")THEN ({amount}/(ROUND(MONTHS_BETWEEN(" + END_DATE + "," + START_DATE + "),0))) * DECODE({recordtype},'salesorder', 1,{probability}/100) ELSE 0 END",
                    formula: "case when "+  END_DATE +
                    " <TO_DATE('"+ fgstartDate +"', 'dd/mm/yyyy') OR " + START_DATE 
                    +" > TO_DATE('"+ fgendDate +"', 'dd/mm/yyyy')  " +
                    " then 0 else {amount} / "+
                    " ROUND((MONTHS_BETWEEN(" + END_DATE + ", " + START_DATE + ") ))  * DECODE({recordtype},'salesorder', 1,{probability}/100) end",
                    //                    formula: "CASE WHEN TO_CHAR({custcol_sel_succ_pot_start_date},'MM')<='" + month + "' AND TO_CHAR({custcol_sel_succ_pot_start_date},'YYYY')=(" + year + ")THEN ({amount}/(ROUND(MONTHS_BETWEEN({custcol_sel_succ_pot_end_date},{custcol_sel_succ_pot_start_date}),0)))*{custcol_sel_success_probability} ELSE 0 END",
                    label: month + "- Fcst Next Year"
                })

            );
        }
        columns.push(
            search.createColumn({
                name: "formulacurrency",
                formula: "CASE WHEN (TO_CHAR(" + START_DATE + ",'YYYY')=(" + year + "+1)) THEN ({amount}/(ROUND(MONTHS_BETWEEN(" + END_DATE + "," + START_DATE + "),0)))*(13-(TO_CHAR(" + START_DATE + ",'MM'))) ELSE 0 END",
                label: "Potential 12 Months"
            }),
            search.createColumn({
                name: "formulacurrency",
                formula: "CASE WHEN (TO_CHAR(" + START_DATE + ",'YYYY')=(" + year + "+1)) THEN ({amount}/(ROUND(MONTHS_BETWEEN(" + END_DATE + "," + START_DATE + "),0)))*(13-(TO_CHAR(" + START_DATE + ",'MM')))*{custcol_sel_success_probability} ELSE 0 END",
                label: "Fcst 12 Months"
            })
        );

        ret.colvalue = columns.slice(ret.colkey.length).map(function (c) {
            return c.label;
        });

        var transactionSearchObj = search.create({
            type: "transaction",
            filters: filters,
            columns: columns
        });


        transactionSearchObj.title = '[Diego] Testing FC';

        try {
            transactionSearchObj.save();
        } catch (E) { }

        var rowdata = [];
        var pRun = transactionSearchObj.runPaged({
            pageSize: 1000
        });


        var createdFrom = {};
        pRun.pageRanges.forEach(function (pageRange) {
            var searchPage = pRun.fetch({
                index: pageRange.index
            });
            searchPage.data.forEach(function (result) {

                var createdFormCurrent = result.getValue('createdfrom');
                if (createdFormCurrent && createdFormCurrent != '') {
                    createdFrom[createdFormCurrent] = createdFormCurrent
                }
                var row = result.columns.map(function (c) {
                    var t = result.getText(c);
                    if (t == null || t == '') {
                        t = result.getValue(c);
                    }
                    return t;
                });

                var n = 0;
                for (var i = ret.colkey.length; i < row.length; i++) {
                    n += row[i] = parseFloat(row[i]);

                }
                if (n) {
                    rowdata.push(row);
                }

            });
        });

        var rowDataFiltered = rowdata.filter(function (e) {
            return !createdFrom[e[0]];

        })
        log.debug('createdFrom', createdFrom)
        log.debug('rowDataFiltered.length', rowDataFiltered.length);

        ret.rowdata = rowDataFiltered;
        return ret;

    }



    function writeForm(PAGE, context) {
        var form = serverWidget.createForm({
            title: translation.get({
                collection: PAGE.collection,
                key: PAGE.TITLE
            })()
        });





        form.clientScriptModulePath = './air_forecast_cl.js';



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
                })()
            }
            const fieldCrSubs = form.addField(
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
            } else {
                fieldCrSubs.defaultValue = pageParameters[PAGE.FILTERS[i].id];
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
                    })()
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
        })


        context.response.writePage(form);
    }


    function onRequest(context) {
        var params = context.request.parameters;

        if (params.result == 'json') {
            var data = getData(params);

            context.response.write({
                output: JSON.stringify(data)
            })
        } else {

            var PAGE = {
                collection: "custcollection_air_sel_strings",
                htmltemplate: './air_annual_recurring_revenues_view.html',
                TITLE: "FCTITLE",
                FILTERS: [{
                    id: "custpage_air_fc_year",
                    type: serverWidget.FieldType.INTEGER,
                    labelkey: 'YEAR',
                    mandatory: true,
                    defaultValue: (new Date().getFullYear() + 1) | 0
                }],
                SUBTABS: [{
                    id: 'custpage_graph',
                    labelkey: 'FC_GRAPH',
                    template: file.load('./forecast_graph.html').url
                },
                {
                    id: 'custpage_summary',
                    labelkey: 'FC_SUMMARY',
                    template: file.load('./forecast_summary.html').url
                },
                {
                    id: 'custpage_detail',
                    labelkey: 'FC_DETAIL',
                    template: file.load('./forecast_detail.html').url
                }
                ]
            }


            writeForm(PAGE, context);

        }
    }

    return {
        onRequest: onRequest
    }
});