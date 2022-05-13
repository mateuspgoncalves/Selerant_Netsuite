/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 define(['N/currentRecord', './ns_underscore.js', 'N/format'], function (currentRecord, underscore, format) {

    function pageInit(context) {
        debugger;
        document.openDetail = openDetail;
    }

    function saveRecord(context) {

    }

    function validateField(context) {

    }

    function fieldChanged(context) {

    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    function validateLine(context) {

    }

    function sublistChanged(context) {

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
        var resultData = JSON.parse(result);

        var summary = createSummary([], resultData);
        var arr = calcARRNNR(resultData);


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
                            template: tab.template,
                            onlyLine: false,
                            format: format,
                            summary: summary,
                            arr: arr,
                            funct: { createSummary: createSummary, calcARRNNR: calcARRNNR }

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



        jQuery.get(urlToCall).then(function (result) {

            draw(result);

            jQuery("#loader").hide();
        })
    }




    function openDetail(entity) {
        debugger;

        var customer = entity.parentElement.attributes.entityid.value;
        var data = entity.parentElement.attributes.data.value;
        var internalid = entity.parentElement.attributes.internalid;
        var template = entity.parentElement.parentElement.parentElement.attributes.template.value;

        if (internalid) {
            window.open("/app/accounting/transactions/salesord.nl?id=" + internalid.value);
        } else {


            if (jQuery("#loader").length == 0) {
                jQuery('body').append(html);
            }
            jQuery("#loader").show();

            var urlToCall = getURL() + '&result=json';


            urlToCall += '&data=' + data;
            urlToCall += '&detail=CIO';
            urlToCall += '&customer=' + customer;



            jQuery.get(urlToCall).then(function (result) {


                jQuery.ajax({
                    type: "GET",
                    url: template,
                    async: false,
                    success: function (response) {
                        template = response;
                    }
                });
                var templateToMerge = underscore.template(template);

                newHtml = templateToMerge({
                    resultData: JSON.parse(result),
                    template: template,
                    onlyLine: true,
                    format: format,
                    funct: { createSummary: createSummary, calcARRNNR: calcARRNNR }
                });


                var row = entity.parentElement;
                row.style.display = 'none';
                row.insertAdjacentHTML('afterend', newHtml);

                jQuery("#loader").hide();
            })


            entity.onclick = null;
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
                kVals = columns.map(function(i) {return e[i]});
                key = kVals.join('#');
            }


            var curVal = map[key];
            if (curVal == null) {
                curVal = kVals.concat(resultData.colvalue.map(function(a) {return 0}));
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

    function calcARRNNR(
        resultData
    ) {

        var newRowDate = [];
        var l = resultData.colkey.length;
        for (var i = 0; i < resultData.rowdata; i++) {

            var key = resultData.rowdata[i].slice(0, resultData.colkey.length);

            var totalR = resultData.rowdata[i].slice(l, l + 13);
            var newR = resultData.rowdata[i].slice(l + 13, l + 13 + 12);
            var lostR = resultData.rowdata[i].slice(l + 25, l + 25 + 12);


            for (var i = 0; i < 12; i++) {//#endregion
                var mrr = totalR[i + 1];
                var numeratoreNRR = mrr - newR[i];
                var nrr = (totalR[i + 1] != 0) ? (100 * numeratoreNRR / totalR[i + 1]) : null;
                var arr = mrr * 12;

                var a = { label: resultData.colvalue[i + 1], key: key, arr: arr, marr: mrr, nu: numeratoreNRR, nrr: nrr, l: lostR[i] };
                newRowDate.push(a);
            }
        }

        return {
            colkey: resultData.colkey,
            rowdata: newRowDate

        }

    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged,
        loadData: loadData,
        openDetail: openDetail,
       createSummary: createSummary, calcARRNNR: calcARRNNR
    }
});