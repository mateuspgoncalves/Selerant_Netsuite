/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], function(search, record, log) {
    /**
     * @param {record} record
     * @param {search} search
     * @param {log} log
     */
    function getInputData() {

        var risultati = [];

        //carico la ricerca [SEL] Timesheet no [SEL] Project
        var customerpaymentSearchObj = search.load({
            id: 'customsearch2146'
        });

        // Run paged con 10 risultati per pagina
        var myPagedData = customerpaymentSearchObj.runPaged({
            "pageSize": 30
        });

        // Iterate over each page
        myPagedData.pageRanges.forEach(function(pageRange) {
            // Fetch the results on the current page
            var myPage = myPagedData.fetch({
                index: pageRange.index
            });

            var itemsToUpdatePage = [];

            // Iterate over the list of results on the current page
            myPage.data.forEach(function(result) {
                itemsToUpdatePage.push({
                    id: result.id,
                    recordType: result.recordType
                })
            });

            risultati.push({
                timebills: itemsToUpdatePage,
            });
        });

        // log.debug("Risultati ", risultati.length + " " + JSON.stringify(risultati));

        return risultati;
    }

    function map(context) {

        //log.debug('Map ', context.value);
        var curData = JSON.parse(context.value);

        var timebills = curData.timebills;

        for (var i = 0; i < timebills.length; i++) {
            //log.debug('Load ' + timebills[i].recordType + ' [' + i + '] = ' + timebills[i].id);

            try {
                var a = record.load({
                    type: timebills[i].recordType,
                    id: timebills[i].id,
                    isDynamic: true
                });

                a.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

            } catch (E) {
                log.debug('Ignoro ' + timebills[i].recordType + ' [' + i + '] = ' + timebills[i].id, E);
            }
        }
    }

    return {
        getInputData: getInputData,
        map: map
    }
});