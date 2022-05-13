/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record'], function (search, record) {
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            try {
                var recordToCopy = context.newRecord;
                log.debug({title: 'record da copiare',details : recordToCopy});

                var createdContact = record.create({type: record.Type.CONTACT, isDynamic: true});
                createdContact.setValue({fieldId:'company', value: 117});
                createdContact.setValue({fieldId: 'subsidiary', value: recordToCopy.getValue('subsidiary')});
                createdContact.setValue({fieldId: 'entityid', value: recordToCopy.getValue('entityid')});
                createdContact.setValue({fieldId: 'firstname', value: recordToCopy.getValue('firstname')});
                createdContact.setValue({fieldId: 'title', value: recordToCopy.getValue('title')});
                createdContact.setValue({fieldId: 'custentity_contact_country', value: recordToCopy.getValue('custentity_contact_country')});
                createdContact.setValue({fieldId: 'email', value: recordToCopy.getValue('email')});
                createdContact.setValue({fieldId: 'mobilephone', value: recordToCopy.getValue('mobilephone')});

                log.debug({title: 'createdContact',details : createdContact});
                createdContact.save();

            } catch (e) {
                log.error({
                    title: 'Error',
                    details: {
                        "name": e.name,
                        "message": e.message
                    }
                });
                throw e;
            }
        }
    }
    return {
        afterSubmit: afterSubmit
    }
});