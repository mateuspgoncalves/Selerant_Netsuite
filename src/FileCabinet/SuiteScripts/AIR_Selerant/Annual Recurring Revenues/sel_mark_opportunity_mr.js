/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/record', 'N/search'], function (record, search) {

    function getInputData() {
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["createdfrom.type", "anyof", "Opprtnty", "Estimate"],
                    "AND",
                    ["type", "anyof", "SalesOrd", "Estimate"],
                    "AND",
                    ["mainline", "is", "F"]
                ],
            columns:
                [search.createColumn({
                    name: "createdfrom",
                    sort: search.Sort.ASC,
                    label: "Created From"
                }),
                    'item', search.createColumn({
                        name: "recordtype",
                        join: "createdFrom",
                        label: "Record Type"
                    })

                ]
        });
        var searchPageRun = transactionSearchObj.runPaged({
            pageSize: 1000
        });

        // let options = {m:{},y:{},q:{}}

        var records = [];
        var curId = -1;
        var curValue = null;

        searchPageRun.pageRanges.forEach(function (pageRange) {
            var searchPage = searchPageRun.fetch({
                index: pageRange.index
            });
            log.debug('fetch page');
            searchPage.data.forEach(function (result) {
                var id = result.getValue(result.columns[0]);
                if (id != curId) {
                    if (curValue) {
                        records.push(curValue);

                    }
                    curValue = {
                        id: id,
                        recordtype: result.getValue(result.columns[2]),
                        items: []
                    }

                    if (curValue.recordtype == '') {
                        curValue.recordtype = 'opportunity'
                    }
                    curId = id;
                }
                curValue.items.push(result.getValue(result.columns[1]));


            });
        });
        if (curValue) {
            records.push(curValue);

        }

        log.debug('Loaded', records);
        return records;

    }

    function map(context) {
        log.debug('Values', context.value);

        var d = JSON.parse(context.value);

        var r = record.load({ type: d.recordtype, id: d.id })

        var updated = 0;
        for (var i = 0; i < r.getLineCount('item'); i++) {

            var item = r.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

            if (d.items.indexOf(item) >= 0 && !r.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sel_op_est_promoted_confirmed', line: i })) {
                r.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sel_op_est_promoted_confirmed', line: i, value: true });
                updated++;
            }

        }

        if (updated ) {
            log.debug('updated on ' + d.id + " " + d.recordtype, updated)
            r.setValue('custbody_sel_op_est_promoted_confirmed',true);
            r.save();
        }
    }

    function reduce(context) {

    }

    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
