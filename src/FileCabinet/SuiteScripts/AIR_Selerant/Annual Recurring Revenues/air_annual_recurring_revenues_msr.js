/**
 * @NApiVersion 2.x
 */
define([
        'N/search', 'N/translation', 'N/file', 'N/format',
        './ns_underscore'
    ],

    function (
        search, translation, file, format,
        _
    ) {

        /**
         *  Returns a list of taxperiod
         * @typedef {Object} AccountingPeriod
         * @property {Number} AccountingPeriod.i - internal id of taxperiod record
         * @property {String} AccountingPeriod.n - name of the taxperiod record
         * @property {String} AccountingPeriod.sd - start date of the taxperiod record
         * @property {String} AccountingPeriod.ed - end date of the taxperiod record
         * @property {Boolean} AccountingPeriod.q - is quarter definition
         * @property {Boolean} AccountingPeriod.y - is year definition
         * @return {Array.<AccountingPeriod>} accounting period list
         */
        function getAccountingPeriods() {
            log.debug('getAccountingPeriods')
            let periodSearchObj = search.create({
                type: "accountingperiod",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["closed", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC
                    }),
                    "isquarter",
                    "isyear",
                    "startdate",
                    "enddate",
                    "periodname"
                ]
            });
            let searchPageRun = periodSearchObj.runPaged({
                pageSize: 1000
            });
            let values = [];
            // let options = {m:{},y:{},q:{}}
            searchPageRun.pageRanges.forEach(function (pageRange) {
                let searchPage = searchPageRun.fetch({
                    index: pageRange.index
                });
                searchPage.data.forEach(function (result) {
                    // options[String(result.id)] = result.getValue({name:"periodname"});
                    values.push({
                        i: result.id, //id
                        n: result.getValue({
                            name: "periodname"
                        }),
                        sd: result.getValue({
                            name: "startdate"
                        }),
                        ed: result.getValue({
                            name: "enddate"
                        }),
                        q: result.getValue({
                            name: "isquarter"
                        }),
                        y: result.getValue({
                            name: "isyear"
                        })
                    });
                });
            });
            return {
                values
            };
        }

        function renderReport(pageParameters, PAGE) {
            try {
                log.debug("1")
                var periodsRange = [];
                var detail = pageParameters["custpage_air_arr_detail"];
                if (pageParameters["custpage_air_arr_periodtype"] == 1) //month
                {
                    var periods = getAccountingPeriods();
                    var monthPeriods = periods.values.filter(function (p) {
                        return !p.q && !p.y
                    });
                    var periodIndex = monthPeriods.findIndex(p => {
                        return p.i == pageParameters["custpage_air_arr_period"]
                    });
                    periodsRange = monthPeriods.slice(periodIndex - 1, periodIndex + 5);
                }

                log.debug("periodsRange", periodsRange)
                log.debug("detail", detail);
                var columns = [
                    search.createColumn({
                        name: "companyname",
                        join: "customerMain",
                        summary: "GROUP",
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "customerMain",
                        summary: "GROUP"
                    })
                ];

                var itemColumn = null;
                if (detail.match('I')) {
                    log.debug("detail.additem");
                    columns.push(
                        itemColumn = search.createColumn({
                            name: "item",
                            summary: "GROUP"
                        })
                    );
                }
                var tranIdColumn = null;
                if (detail.match('O')) {
                    log.debug("detail.document");
                    columns.push(
                        tranIdColumn = search.createColumn({
                            name: "tranid",
                            summary: "GROUP"
                        })
                    );
                }

                var periodFirst = columns.length;
                for (var i = 0; i < periodsRange.length; i++) {
                    columns.push(
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "case when (({custcol_swe_contract_end_date} - {custcol_swe_contract_start_date}) +1 ) = 0 then null else {amount}  /  (({custcol_swe_contract_end_date} - {custcol_swe_contract_start_date}) +1 )  * greatest(0,((least({custcol_swe_contract_end_date},to_date('" + periodsRange[i].ed + "','dd/mm/yyyy') ) - greatest({custcol_swe_contract_start_date},to_date('" + periodsRange[i].sd + "','dd/mm/yyyy')) +1))) end "
                        })
                    );
                }


                var filters = [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["custcol_swe_contract_start_date", "onorbefore", periodsRange[periodsRange.length - 1].ed],
                    "AND",
                    ["custcol_swe_contract_end_date", "onorafter", periodsRange[0].sd],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"]
                ];
                var customer = pageParameters["custpage_air_arr_customer"];

                log.debug('Filter by customer', customer);
                if (customer && customer != '') {

                    filters.push('and', ['name', 'anyof', customer]);
                }

                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters: filters,
                    columns: columns
                });

                salesorderSearchObj.title  = '[FMA] Importo contratti periodo';
                try {
                salesorderSearchObj.save();
                } catch (E){}

                var searchPageRun = salesorderSearchObj.runPaged({
                    pageSize: 1000
                });
                log.debug("searchPageRun", searchPageRun)

                var resultData = []
                searchPageRun.pageRanges.forEach(function (pageRange) {
                    var searchPage = searchPageRun.fetch({
                        index: pageRange.index
                    });
                    searchPage.data.forEach(function (result) {
                        resultData.push({
                            // entityid: result.getValue(columns[0]),
                            entity: result.getValue(columns[0]),
                            entityid: result.getValue(columns[1]),
                            itemid: itemColumn ? result.getValue(itemColumn) : "",
                            item: itemColumn ? result.getText(itemColumn) : "",
                            tranid: tranIdColumn ? result.getValue(tranIdColumn) : "",
                            periods: getPeriodColumns(result, columns, periodFirst),

                        });
                    });
                });
                log.debug("searchPageRun", searchPageRun)

                var template = file.load({
                    id: PAGE.htmltemplate
                }).getContents();
                log.debug("template", template)

                var templateToMerge = _.template(template);
                log.debug("templateToMerge", templateToMerge)

                var renderedReport = templateToMerge({
                    data: {
                        entityLabel: translation.get({
                            collection: PAGE.collection,
                            key: 'ENTITY'
                        })(),
                        itemLabel: translation.get({
                            collection: PAGE.collection,
                            key: 'ITEM'
                        })(),
                        soLabel: 'tranid',
                        values: resultData,
                        periods: periodsRange,
                        detail: detail,
                        format: format,
                        onlyLines: (pageParameters.result && pageParameters.result.match('detail'))
                    }
                });
                //log.debug("renderedReport",renderedReport)

                return renderedReport;

            } catch (e) {
                log.error("setHtmlReport", e + JSON.stringify(e));
            }
            return 'null'
        }

        function getPeriodColumns(result, columns, periodFirst) {
            var periodValues = [];

            for (var i = periodFirst; i < columns.length; i++) {
                periodValues.push(
                    result.getValue(columns[i])
                )
            }
            return periodValues;
        }

        return {
            getAccountingPeriods: getAccountingPeriods,

            renderReport: renderReport
        }

    });