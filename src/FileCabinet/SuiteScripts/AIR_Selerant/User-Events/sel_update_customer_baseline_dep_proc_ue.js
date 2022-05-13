/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 * @author Bruno Belluccia
 * @version 1.0
 * @date 21/09/2021
 * @description 
 * script che aggiorna il campo custentity_air_baseline_depl_process_str del customer con una stringa ottenuta 
 * concatenando tutti i valori nella sublist recmachcustrecord_sel_cib_customer
 */
define(['N/search', 'N/record'],
    /**
     * @param {search} search
     * @param {record} record
     */
    function(search, record) {

        /**
         * @param {UserEventContext.beforeSubmit} context
         */
        function afterSubmit(context) {

            if (context.type == 'create' || context.type == 'edit' || context.type == 'delete') {

                var newRecord = context.newRecord;

                var customerId = newRecord.getValue({
                    fieldId: 'custrecord_sel_cib_customer'
                });

                var bundlesSearch = search.create({
                    type: "customrecord_sel_cust_inst_bundles",
                    filters: [
                        ["custrecord_sel_cib_customer", "anyof", customerId]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_sel_cib_bundle_id", label: "Bundle ID" }),
                        search.createColumn({ name: "custrecord_sel_cib_version", label: "Version" }),
                        search.createColumn({ name: "custrecord_sel_cib_options", label: "Options" }),
                        search.createColumn({ name: "custrecord_sel_cib_input_string", label: "Baseline Deployment Process Bundle Input String" }),
                        search.createColumn({ name: "custrecord_sel_cib_customer", label: "Customer" })
                    ]
                });

                var baselineDeploymentProcessString = '';

                bundlesSearch.run().each(function(result) {
                    var inputString = result.getValue('custrecord_sel_cib_input_string');
                    baselineDeploymentProcessString += inputString + ';';
                    return true;
                });

                if (baselineDeploymentProcessString.length > 0) {
                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: customerId,
                        values: {
                            custentity_air_baseline_depl_process_str: baselineDeploymentProcessString
                        }
                    });
                }
            }
        }

        return {
            afterSubmit: afterSubmit,
        };
    });