/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 * @author Bruno Belluccia
 * @version 1.0
 * @date 28/09/2021
 */

define([],
    function() {

        /**
         * @param {ClientScriptContext.sublistChanged} context
         */
        function sublistChanged(context) {

            if (context.sublistId == 'recmachcustrecord_sel_cib_customer') {

                var currentRecord = context.currentRecord;

                var numLines = currentRecord.getLineCount({
                    sublistId: 'recmachcustrecord_sel_cib_customer'
                });

                var baselineDeploymentProcessString = '';

                for (var line = 0; line < numLines; line++) {
                    var bundleName = currentRecord.getSublistText({
                        sublistId: 'recmachcustrecord_sel_cib_customer',
                        fieldId: 'custrecord_sel_cib_bundle_id',
                        line: line,
                    });

                    var version = currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_sel_cib_customer',
                        fieldId: 'custrecord_sel_cib_version',
                        line: line,
                    });

                    var option = currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_sel_cib_customer',
                        fieldId: 'custrecord_sel_cib_options',
                        line: line,
                    });

                    if (bundleName && version) {
                        baselineDeploymentProcessString += bundleName + ',' + version
                    }

                    if (option) {
                        baselineDeploymentProcessString += ',' + option;
                    }

                    baselineDeploymentProcessString += ';'
                }

                if (baselineDeploymentProcessString.length > 0) {
                    currentRecord.setValue({
                        fieldId: 'custentity_air_baseline_depl_process_str',
                        value: baselineDeploymentProcessString
                    });
                }
            }
        }

        return {
            sublistChanged: sublistChanged,
        };
    });