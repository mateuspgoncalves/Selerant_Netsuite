/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope  SameAccount
 * author:  fe.almeida@reply.com
 * Date: 19/10/21
 * Version: 1.0
 * Project: selerant
 */

define([
        'N/currentRecord', 'N/format'
    ],

    /**

     */
    function (
        currentRecord, format
    ) {
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            if (scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_air_arr_periodtype'
                }) > 0) {
                setPeriods(scriptContext);
            }
            if (!!scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_air_arr_from_date'
                }) && !!scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_air_arr_to_date'
                })) {
                setPeriodByDates(scriptContext);
            }
            debugger;
            document.openDetail = openDetail;
        }
        /**
         * Function to be executed when field is changed.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var eventRouter = {
                "custpage_air_arr_periodtype": setPeriods,
                "custpage_air_arr_period": setPeriodDates
            }
            if (typeof eventRouter[scriptContext.fieldId] !== "function") return;
            eventRouter[scriptContext.fieldId](scriptContext);
            try {} catch (e) {
                log.error("fieldChanged", e);
            }
        }

        function setPeriodByDates(scriptContext) {
            var fromDtStr = format.format({
                value: scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_air_arr_from_date'
                }),
                type: format.Type.DATE
            });
            var toDtStr = format.format({
                value: scriptContext.currentRecord.getValue({
                    fieldId: 'custpage_air_arr_to_date'
                }),
                type: format.Type.DATE
            });
            var periods = JSON.parse(scriptContext.currentRecord.getValue({
                fieldId: "custpage_air_arr_periodjson"
            }));
            var periodObj = periods.find(function (p) {
                return p.sd == fromDtStr && p.ed == toDtStr
            });

            if (!!periodObj) {
                scriptContext.currentRecord.setValue({
                    fieldId: "custpage_air_arr_period",
                    value: periodObj.i
                });
            }
        }

        function setPeriods(scriptContext) {
            if (!!scriptContext.currentRecord.getValue({
                    fieldId: "custpage_air_arr_periodtype"
                })) {

                var periods = JSON.parse(scriptContext.currentRecord.getValue({
                    fieldId: "custpage_air_arr_periodjson"
                }));
                var periodValues = []
                if (scriptContext.currentRecord.getValue({
                        fieldId: "custpage_air_arr_periodtype"
                    }) == 1) // MONTH
                {
                    periodValues = periods.filter(function (p) {
                        return !p.q && !p.y
                    });
                } else if (scriptContext.currentRecord.getValue({
                        fieldId: "custpage_air_arr_periodtype"
                    }) == 2) // QUARTER
                {

                } else if (scriptContext.currentRecord.getValue({
                        fieldId: "custpage_air_arr_periodtype"
                    }) == 3) // YEAR
                {

                }

                var cr = currentRecord.get();
                var periodFld = cr.getField({
                    fieldId: 'custpage_air_arr_period'
                });
                periodFld.removeSelectOption({
                    value: null,
                });
                periodFld.insertSelectOption({
                    value: "",
                    text: ""
                });
                for (var i = 0; i < periodValues.length; i++) {
                    periodFld.insertSelectOption({
                        value: periodValues[i].i,
                        text: periodValues[i].n
                    });
                }
            }
        }

        function setPeriodDates(scriptContext) {
            var periodId = scriptContext.currentRecord.getValue({
                fieldId: scriptContext.fieldId
            });
            var periods = JSON.parse(scriptContext.currentRecord.getValue({
                fieldId: "custpage_air_arr_periodjson"
            }));
            var periodObj = periods.find(function (p) {
                return p.i == periodId
            });
            if (!!periodObj) {
                scriptContext.currentRecord.setValue({
                    fieldId: "custpage_air_arr_from_date",
                    value: format.parse({
                        value: periodObj.sd,
                        type: format.Type.DATE
                    })
                });
                scriptContext.currentRecord.setValue({
                    fieldId: "custpage_air_arr_to_date",
                    value: format.parse({
                        value: periodObj.ed,
                        type: format.Type.DATE
                    })
                });
            }
        }


        function getURL(PAGE) {
            var url = location.href;
            var rec = currentRecord.get();
            if (PAGE == null) {
                PAGE = JSON.parse(rec.getValue('custpage_page'));

            }
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

        function renderTable() {
            debugger;

            var rec = currentRecord.get();
            var PAGE = JSON.parse(rec.getValue('custpage_page'));

            var url = getURL(PAGE);
            url += '&result=html';



            var html = '<style>#loader {  position: absolute;  left: 50%;  top: 50%;  z-index: 3;  width: 150px;  height: 150px; ' +
                ' margin: -75px 0 0 -75px;  border: 16px solid #f3f3f3;  border-radius: 50%;  border-top: 16px solid #3498db; width: 120px;  height: 120px;' +
                ' -webkit-animation: spin 2s linear infinite;  animation: spin 2s linear infinite;} @-webkit-keyframes spin {  0% { -webkit-transform: rotate(0deg); } ' +
                ' 100% { -webkit-transform:rotate(360deg); }} @keyframes spin {0% { transform: rotate(0deg); }  100% { transform: rotate(360deg); }} ' +
                '#cover{   position:fixed;   top:0; left:0;   background:rgba(256,256,256,0.9);   z-index:1;   width:100%;   height:100%;   display:none; }' +
                '</style><div id="loader"></div>\n';

            document.getElementById(PAGE.HTML_TABLE.id + '_val').innerHTML = html;
            jQuery("#loader").show()

            jQuery.get(url).then(function (result) {

                document.getElementById(PAGE.HTML_TABLE.id + '_val').innerHTML = result;

            })
        }


        function openDetail(entity) {
            debugger;

            entity.attributes.entityid
            var rec = currentRecord.get();
            var PAGE = JSON.parse(rec.getValue('custpage_page'));

            var url = getURL(PAGE);

            var urlObj = new URL(url);
            var search_params = urlObj.searchParams;

            // new value of "id" is set to "101"
            search_params.set('custpage_air_arr_customer', entity.attributes.entityid.value);
            search_params.set('result', 'html.detail');
            search_params.set('custpage_air_arr_detail', 'CIO');

            // change the search property of the main url
            urlObj.search = search_params.toString();

            // the new url string
            var url = urlObj.toString();

            entity.onclick = null;




            jQuery.get(url).then(function (result) {
                debugger;
                //document.getElementById(PAGE.HTML_TABLE.id + '_val').innerHTML = result;
                var row = entity.parentElement;
                row.style.display = 'none';
                row.insertAdjacentHTML('afterend', result);

            })
        }


        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            renderTable: renderTable,
            openDetail: openDetail
        }
    }
);