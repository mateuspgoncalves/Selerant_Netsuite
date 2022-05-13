/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/search"], function (record, search) {

    function afterSubmit(context) {

        var laborCostRecord = context.newRecord;
        var subsidiaryId = laborCostRecord.getValue({ fieldId: 'custrecord_sel_subidiary_empl' });
        var classId = laborCostRecord.getValue({ fieldId: 'custrecord_sel_class_emp' });
        var departId = laborCostRecord.getValue({ fieldId: 'custrecord_sel_depart_emp' });
        var laborcostValue = laborCostRecord.getValue({ fieldId: "custrecord_sel_laborcost_emp" });

        var id = [];

        var jobSearchObj = search.create({
            type: "employee",
            filters:
                [
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND",
                    ["class", "anyof", classId],
                    "AND",
                    ["department", "anyof", departId]
                ],
            columns:
                [
                    "internalid"
                ]
        }).run().each(function (result) {
            var a = [
                result.getValue({ name: "internalid" }) //id employee
            ];
            var objA = JSON.stringify(a);

            log.debug({
                title: 'Valori estrapolati e salvati in Json',
                details: objA
            });
            id.push(a);

            return true;
        });

        for (var i = 0; i < id.length; i++) {

            record.submitFields({
                type: record.Type.EMPLOYEE,
                id: id[i],
                values: {
                    laborcost: laborcostValue
                }
            }); 


        }
    }

    return {

        afterSubmit: afterSubmit
    }
});
