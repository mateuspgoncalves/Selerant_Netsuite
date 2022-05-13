/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/search"], function (search) {

    function beforeSubmit(context) {
        if (context.type == "create" || context.type == "edit") {

            var empRecord = context.newRecord;

            var subsidiaryId = empRecord.getValue({ fieldId: "subsidiary" });
            var classId = empRecord.getValue({ fieldId: "class" });
            var departId = empRecord.getValue({ fieldId: "department" });
            var currencyId = empRecord.getValue({ fieldId: "currency" });
            var laborcostValue = null;

            if (classId && classId != "" && departId && departId != "" && subsidiaryId && subsidiaryId != "" && currencyId && currencyId != "") {
                var customrecord_emp_laborcostSearchObj = search.create({
                    type: "customrecord_emp_laborcost",
                    filters:
                        [
                            ["custrecord_sel_class_emp", "anyof", classId],
                            "AND",
                            ["custrecord_sel_depart_emp", "anyof", departId],
                            "AND",
                            ["custrecord_sel_currency_emp", "anyof", currencyId],
                            "AND",
                            ["custrecord_sel_subidiary_empl", "anyof", subsidiaryId]
                        ],
                    columns:
                        [
                            "custrecord_sel_laborcost_emp"
                        ]
                }).run().each(function (result) {
                    laborcostValue = result.getValue(result.columns[0]);

                    empRecord.setValue({
                        fieldId: "laborcost",
                        value: laborcostValue
                    });
                    return true;
                });
            }
        }
    }

    return {

        beforeSubmit: beforeSubmit
    }

});