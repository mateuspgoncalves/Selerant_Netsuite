/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/search"], function (record, search) {

    var mapProject = {};

    function beforeSubmit(context) {
        if (context.type == "edit" || context.type == "create" || context.type == "copy") {

            var transReco = context.newRecord;

            if (transReco.type == "expensereport") {

                var numLines = transReco.getLineCount({ sublistId: "expense" });

                for (var i = 0; i < numLines; i++) {
                    var idCustomerJob = transReco.getSublistValue({
                        sublistId: "expense",
                        fieldId: "customer",
                        line: i
                    });
                    try {
                        if (idCustomerJob) {
                            var recordJobId = record.load({
                                id: idCustomerJob,
                                type: "job"
                            });

                            var jobID = recordJobId.getValue({ fieldId: "id" });
                            var entityId = recordJobId.getValue({ fieldId: "entitytitle" })

                            var recordId = getIdSelProject(jobID, entityId);

                            transReco.setSublistValue({
                                sublistId: "expense",
                                fieldId: "csegcustrec_project",
                                line: i,
                                value: recordId
                            });

                        }
                    } catch (e) { }
                }

            } else if (transReco.type == "vendorbill" || transReco.type == "vendorcredit") {
                var numLines = transReco.getLineCount({ sublistId: "item" });
                var numLinesExp = transReco.getLineCount({ sublistId: "expense" });

                for (var i = 0; i < numLines; i++) {
                    var idCustomerJob = transReco.getSublistValue({
                        sublistId: "item",
                        fieldId: "customer",
                        line: i
                    });
                    try {
                        if (idCustomerJob) {
                            var recordJobId = record.load({
                                id: idCustomerJob,
                                type: "job"
                            });

                            var jobID = recordJobId.getValue({ fieldId: "id" });
                            var entityId = recordJobId.getValue({ fieldId: "entitytitle" })

                            var recordId = getIdSelProject(jobID, entityId);

                            transReco.setSublistValue({
                                sublistId: "item",
                                fieldId: "csegcustrec_project",
                                line: i,
                                value: recordId
                            });

                        }
                    } catch (e) { }
                }

                for (var j = 0; j < numLinesExp; j++) {
                    var idCustomerJobExp = transReco.getSublistValue({
                        sublistId: "expense",
                        fieldId: "customer",
                        line: j
                    });
                    try {
                        if (idCustomerJobExp) {
                            var recordJobId = record.load({
                                id: idCustomerJobExp,
                                type: "job"
                            });

                            var jobIDEx = recordJobId.getValue({ fieldId: "id" });
                            var entityIdEX = recordJobId.getValue({ fieldId: "entitytitle" })

                            var recordIdExp = getIdSelProject(jobIDEx, entityIdEX);

                            transReco.setSublistValue({
                                sublistId: "expense",
                                fieldId: "csegcustrec_project",
                                line: j,
                                value: recordIdExp
                            });

                        }
                    } catch (e) { }
                }

            } else if (transReco.type == "timebill") {
                var idCustJob = transReco.getValue({ fieldId: "customer" });
                if (idCustJob && idCustJob != "") {
                    var recType = search.lookupFields({
                        type: "entity",
                        id: idCustJob,
                        columns: ["type"]
                    });

                    //var recTypeLkpField = recType.type[0].text

                    if (recType.type[0].text == "Project") {
                        var recordIdJob = record.load({
                            id: idCustJob,
                            type: "job"
                        });

                        var jobID = recordIdJob.getValue({ fieldId: "id" });
                        var entityId = recordIdJob.getValue({ fieldId: "entitytitle" })

                        var recId = getIdSelProject(jobID, entityId);

                        transReco.setValue({
                            fieldId: 'csegcustrec_project',
                            value: recId
                        });
                    }
                }

            } else {
                var idCustJob = transReco.getValue({ fieldId: "job" });
                var numLines = transReco.getLineCount({ sublistId: "item" });
                if (idCustJob) {
                    var recordIdJob = record.load({
                        id: idCustJob,
                        type: "job"
                    });

                    var jobID = recordIdJob.getValue({ fieldId: "id" });
                    var entityId = recordIdJob.getValue({ fieldId: "entitytitle" })

                    var recId = getIdSelProject(jobID, entityId);

                    transReco.setValue({
                        fieldId: 'csegcustrec_project',
                        value: recId
                    });

                    for (var j = 0; j < numLines; j++) {

                        transReco.setSublistValue({
                            sublistId: "item",
                            fieldId: "csegcustrec_project",
                            line: j,
                            value: recId
                        });
                    }
                }
            }
        }
    }


    function getIdSelProject(jobID, entityId) {
        var recordId = null;
        if (!mapProject.hasOwnProperty(jobID)) {
            var customrecord_csegcustrec_projectSearchObj = search.create({
                type: "customrecord_csegcustrec_project",
                filters:
                    [
                        ["custrecord_sel_project_id", "anyof", jobID]
                    ],
                columns:
                    [
                        "internalid"
                    ]
            });

            customrecord_csegcustrec_projectSearchObj.run().each(function (result) {
                recordId = result.getValue({ name: "internalid" });
                mapProject[jobID] = recordId;
                return false;
            });
        } else {
            recordId = mapProject[jobID];
        }

        if (!recordId) {

            var newRecordProject = record.create({
                type: "customrecord_csegcustrec_project",
            });
            newRecordProject.setValue({
                fieldId: "custrecord_sel_project_id",
                value: jobID
            });
            newRecordProject.setValue({
                fieldId: "name",
                value: entityId
            });
            recordId = newRecordProject.save();
        }

        return recordId;
    }

    return {
        beforeSubmit: beforeSubmit,
    }
});
