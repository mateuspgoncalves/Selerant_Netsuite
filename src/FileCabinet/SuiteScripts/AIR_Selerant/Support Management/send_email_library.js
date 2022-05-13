/**
 *@NApiVersion 2.x
 *@NModuleScope SameAccount
 * @author Bruno Belluccia
 * @version 1.0
 * @date 22/10/2021
 */
define(['N/search', 'N/email', 'N/url'],

    /**
     * @param {search} search
     * @param {email} email
     * @param {url} url
     */
    function (search, email, url) {

        const EMAIL_MODE = {
            EMPLOYEES: 1,
            GROUP: 2,
            GROUP_ALL: 3,
            ADDRESSES: 4
        };

        const ERRORS = {
            MISSING_REQUIRED_ARGUMENTS: 1,
            ERROR_FROM_NETSUITE: 2,
            EMPLY_OR_NULL_EMPLOYEES_FROM_GROUP: 3
        };

        /** 
         * Invia la o le mail in base alla modalità richiesta
         * 
         * @param {context} context
         * @param {*} context.author - (obbligatorio) employee da cui risulta essere inviata la mail
         * @param {*} context.mode - (obbligatorio)
         *              1 - invia una mail alla mail dell'employee;
         *              2 - invia una mail alla mail del gruppo di employee
         *              3 - invia una mail a tutti i membri di un gruppo
         *              4 - invia una mail all'indirizzo fornito
         * @param {*} context.id - (obbligatorio per mode 0,1 e 2) in base alla modalità
         *              mode 0: id dell'employee;
         *              mode 1: id del grupppo di employee
         *              mode 2: id del gruppo di employee
         *              mode 3: null    
         * @param {*} context.subject - (obbligatorio) oggetto della mail
         * @param {*} context.message - (obbligatorio) messaggio della mail
         * @param {*} context.email - (obbligatorio per mode 4) indirizzo e-mail o array di indirizzi e-mail e id di employee o gruppi di employee usato solo in mode 4
         * @param {*} context.internal - (opzionale) If true, the Message record is not visible to an external Entity (for example, a customer or contact). The default value is false.
         * 
         * return errors:
         *  1: missing required arguments
         *  2: error in send email from netsuite
         *  3: empty or null employees from group
         */
        function sendEmail(context) {

            log.debug({
                title: 'sendEmailLib context',
                details: context
            });

            var author = context.author;
            if (!author || author == '') {
                log.error({ title: "Errore nell'inviare email", details: 'missing required arguments author' });

                return {
                    error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                    error_type: 'missing required arguments',
                    error_message: 'author are mandatory'
                }
            }
            var mode = context.mode;
            if (!mode || mode == '') {
                log.error({ title: "Errore nell'inviare email", details: 'missing required arguments mode' });

                return {
                    error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                    error_type: 'missing required arguments',
                    error_message: 'mode are mandatory'
                }
            }
            var oggetto = context.subject;
            if (!oggetto || oggetto == '') {
                log.error({ title: "Errore nell'inviare email", details: 'missing required arguments subject' });

                return {
                    error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                    error_type: 'missing required arguments',
                    error_message: 'subject are mandatory'
                }
            }
            var messaggio = context.message;
            if (!messaggio || messaggio == '') {
                log.error({ title: "Errore nell'inviare email", details: 'missing required arguments message' });

                return {
                    error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                    error_type: 'missing required arguments',
                    error_message: 'message are mandatory'
                }
            }

            var id = context.id;
            var mail = context.email;
            var internal = context.internal;

            switch (mode) {

                case EMAIL_MODE.EMPLOYEES:
                    {
                        if (id) {

                            try {
                                email.send({
                                    author: author,
                                    recipients: id,
                                    subject: oggetto,
                                    body: messaggio,
                                    isInternalOnly: internal ? internal : false,
                                });

                                return 200;
                            } catch (error) {
                                log.error({ title: "Errore nell'inviare email", details: JSON.stringify(error) });

                                return {
                                    error: 2,
                                    error_type: error.name,
                                    error_message: error.message
                                }
                            }

                        } else {
                            log.error({ title: "Errore nell'inviare email", details: 'missing required arguments id' });

                            return {
                                error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                                error_type: 'missing required arguments',
                                error_message: 'id is mandatory'
                            }
                        }

                        break;
                    }

                case EMAIL_MODE.GROUP:
                    {
                        if (id) {

                            try {
                                email.send({
                                    author: author,
                                    recipients: id,
                                    subject: oggetto,
                                    body: messaggio,
                                    isInternalOnly: internal ? internal : false,
                                });

                                return 200;
                            } catch (error) {
                                log.error({ title: "Errore nell'inviare email", details: JSON.stringify(error) });

                                return {
                                    error: ERRORS.ERROR_FROM_NETSUITE,
                                    error_type: error.name,
                                    error_message: error.message
                                }
                            }

                        } else {
                            log.error({ title: "Errore nell'inviare email", details: 'missing required arguments id' });

                            return {
                                error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                                error_type: 'missing required arguments',
                                error_message: 'id is mandatory'
                            }
                        }

                        break;
                    }

                case EMAIL_MODE.GROUP_ALL:
                    {
                        if (id) {

                            //ricevo tutti gli employee del gruppo già suddivisi a gruppi da 10 per non incorrere nel max di NS
                            var employees = getGroupEmployee(id);

                            if (employees) {

                                for (var i = 0; i < employees.length; i++) {

                                    try {
                                        email.send({
                                            author: author,
                                            recipients: employees[i],
                                            subject: oggetto,
                                            body: messaggio,
                                            isInternalOnly: internal ? internal : false,
                                        });

                                    } catch (error) {
                                        log.error({ title: "Errore nell'inviare email", details: JSON.stringify(error) });

                                        return {
                                            error: ERRORS.ERROR_FROM_NETSUITE,
                                            error_type: error.name,
                                            error_message: error.message
                                        }
                                    }

                                }

                                return 200;

                            } else {
                                log.error({ title: "Errore nell'inviare email", details: 'Empty Employee Group' });

                                return {
                                    error: ERRORS.EMPLY_OR_NULL_EMPLOYEES_FROM_GROUP,
                                    error_type: 'Empty or null object',
                                    error_message: 'Empty or null employee group'
                                }
                            }

                        } else {
                            log.error({ title: "Errore nell'inviare email", details: 'missing required arguments id' });

                            return {
                                error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                                error_type: 'missing required arguments',
                                error_message: 'id is mandatory'
                            }
                        }

                        break;
                    }

                case EMAIL_MODE.ADDRESSES:
                    {
                        if (mail || mail == '') {

                            try {
                                email.send({
                                    author: author,
                                    recipients: mail,
                                    subject: oggetto,
                                    body: messaggio,
                                    isInternalOnly: internal ? internal : false,
                                });
                            } catch (error) {
                                log.error({ title: "Errore nell'inviare email", details: JSON.stringify(error) });

                                return {
                                    error: ERRORS.ERROR_FROM_NETSUITE,
                                    error_type: error.name,
                                    error_message: error.message
                                }
                            }

                            return 200;

                        } else {
                            log.error({ title: "Errore nell'inviare email", details: 'missing required arguments mail' });

                            return {
                                error: ERRORS.MISSING_REQUIRED_ARGUMENTS,
                                error_type: 'missing required arguments',
                                error_message: 'mail is mandatory'
                            }
                        }

                        break;
                    }
                default:
                    break;
            }
        }

        /** 
         * Ricerca gli employee appartenenti ad un gruppo in input
         * 
         * @param {groupId} groupId - id del gruppo di employee
         * 
         * @return array array di id di employee diviso per gruppi di 10 oppure null
         */
        function getGroupEmployee(groupId) {

            if (groupId) {

                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [
                        ["group", "anyof", groupId]
                    ],
                    columns: [
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "email", label: "Email" }),
                        search.createColumn({ name: "altemail", label: "Alt. Email" })
                    ]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;

                var results = [];
                var cont = 0;
                var subResult;


                employeeSearchObj.run().each(function (result) {

                    if (cont == 0) {
                        subResult = [];
                    }

                    if (cont < 10) {
                        subResult.push(result.id);
                        cont++;
                    }

                    if (cont == searchResultCount || cont == 10) {
                        results.push(subResult);
                        cont = 0;
                    }

                    return true;
                });

                return results;

            } else {
                return null;
            }
        }

        /** 
         * Ritorna il link al record specifico dato il tipo e l'id
         * utile da inserire nelle mail per portarli alla pagina di lavoro netsuite
         * 
         * @param {record_type} record_type - il tipo del record 
         * @param {record_id} record_id - l'id del record 
         * 
         * @return il link a record oppure null
         */
        function getRecordLink(record_type, record_id) {

            if (record_id && record_type) {
                return url.resolveRecord({
                    recordType: record_type,
                    recordId: record_id,
                    isEditMode: false,
                });
            } else {
                return null;
            }
        }

        return {
            sendEmail: sendEmail,
            getRecordLink: getRecordLink,
            EMAIL_MODE: EMAIL_MODE,
            ERRORS: ERRORS
        }
    });