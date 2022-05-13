/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope  SameAccount
 * author:  fe.almeida@reply.com
 * Date: 15/10/21
 * Version: 1.0
 * Project: selerant
 */


define([
        'N/ui/serverWidget',
        './air_form_lib', './air_annual_recurring_revenues_msr'
    ],

    /**
     * @param {search} search
     * @param {serverWidget} serverWidget
     */
    function (
        serverWidget,
        air_form_lib, msr
    ) {

        /**
         * Definition of the Suitelet script trigger point.
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            var periods = msr.getAccountingPeriods()
            const PAGE = {
                collection: "custcollection_air_sel_strings",
                htmltemplate: './air_annual_recurring_revenues_view.html',
                TITLE: "ARRFORMTITLE",
                CLIENT_SCRIPT: "./air_annual_recurring_revenues_cl.js",
                SUBTABS: [{
                    id: 'custpage_air_arr_reportsubtab',
                    labelkey: 'REPORT'
                }],
                HTML_TABLE: {
                    id: "custpage_air_arr_table",
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'arr table',
                    container: 'custpage_air_arr_reportsubtab',
                },
                FILTERS: [{
                        id: "custpage_air_arr_periodtype",
                        type: serverWidget.FieldType.SELECT,
                        labelkey: 'PERIODTYPE',
                        source: 'customlist_air_periodtype',
                        mandatory: true
                    }, {
                        id: "custpage_air_arr_period",
                        type: serverWidget.FieldType.SELECT,
                        labelkey: 'PERIOD',
                        mandatory: true
                    },
                    // {
                    //     id:"custpage_air_arr_customergroup",
                    //     type: serverWidget.FieldType.CHECKBOX,
                    //     labelkey: 'CUSTOMERGROUP'
                    // },
                    {
                        id: "custpage_air_arr_detail",
                        type: serverWidget.FieldType.SELECT,
                        labelkey: 'CUSTOMERGROUP',
                        mandatory: true,
                        values: {
                            'C': 'Customer',
                            'CI': 'Item',
                            'CIO': 'Order'
                        }
                    },
                    {
                        id: "custpage_air_arr_customer",
                        type: serverWidget.FieldType.SELECT,
                        labelkey: 'CUSTOMERGROUP',
                        source: 'customer',
                    },
                    
                    {
                        id: 'custpage_air_arr_from_date',
                        type: serverWidget.FieldType.DATE,
                        displayType: serverWidget.FieldDisplayType.DISABLED,
                        labelkey: 'fromdate',
                        mandatory: true
                    }, {
                        id: 'custpage_air_arr_to_date',
                        type: serverWidget.FieldType.DATE,
                        displayType: serverWidget.FieldDisplayType.DISABLED,
                        labelkey: 'todate',
                        mandatory: true
                    }, {
                        id: "custpage_air_arr_periodjson",
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'period json',
                        displayType: serverWidget.FieldDisplayType.HIDDEN,
                        defaultValue: JSON.stringify(periods.values),
                    }
                ]
            }

            air_form_lib.writePage(context, PAGE, msr.renderReport);

        }

        return {
            onRequest: onRequest
        }
    }
);