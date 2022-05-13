/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', './ns_underscore.js', 'N/format'], function (currentRecord, underscore, format) {

    function pageInit(context) {

    }

    function saveRecord(context) {

    }

    function validateField(context) {

    }

    function fieldChanged(context) {
        if (context.fieldId = 'custpage_air_fc_year') {
            loadData();
        }

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
        var summary = createSummary([],resultData);

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
                            format: format,
                            summary: summary,
                            funct: { createSummary: createSummary }
                        });
                    } catch (E) {
                        newHtml = 'Errore' + E
                    }
                }
            document.getElementById(tab.id + '_html_val').innerHTML = '';

            jQuery('#' + tab.id + '_html_val').append(newHtml)
        });

    }

    function createSummary(columns, resultData) {
        var ret = {};
        var colKey = [];
        for (var i = 0; i < columns.length; i++) {
            colKey.push(resultData.colkey[2+columns[i]])
        }

        ret.colkey = colKey,
            ret.colvalue = resultData.colvalue
        ret.rowdata = [];



        var map = {};
        var iO = resultData.colkey.length;
        resultData.rowdata.forEach(function (e) {
            var kVals = [];
            var key = '#';
            if (columns.length > 0) {
                kVals = columns.map(function (i) { return e[i] });
                key = kVals.join('#');
            }


            var curVal = map[key];
            if (curVal == null) {
                curVal = kVals.concat(resultData.colvalue.map(function (a) { return 0 }));
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

        var year = rec.getValue('custpage_air_fc_year');
        urlToCall += '&year=' + year;

        jQuery.get(urlToCall).then(function (result) {

            draw(result);

            jQuery("#loader").hide();
        })
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
        loadData: loadData
    }
});