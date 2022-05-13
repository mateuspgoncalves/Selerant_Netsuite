/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/runtime',
    'N/search',
    'N/ui/serverWidget',
    'N/format',
    './moment.js',
    './support_managements_constants.js'
],

    /**
     * @param {record} record
     * @param {runtime} runtime 
     * @param {search} search  
     * @param {serverWidget} serverWidget 
     * @param {format} format  
     * @param {moment} moment
     * @param {constants} CONSTANTS
     */
    function (record, runtime, search, serverWidget, format, moment, CONSTANTS) {

        var isFromReassign = false;

        function beforeLoad(context) {

            var currentRecord = context.newRecord;

            //visibilità case open for per casi vecchi
            var createdDate = currentRecord.getValue({ fieldId: 'custevent_sel_case_date_created' });

            var openForCustomerField = context.form.getField({ id: 'custevent_cas_open_for' });
            var oldCaseCreatorField = context.form.getField({ id: 'custevent_sel_case_created_by_user' });
            var newCaseCreatorField = context.form.getField({ id: 'custevent_sel_case_creator' });
            var oldEligibleForSupport = context.form.getField({ id: 'custevent_cas_elegible_support' });
            var newEligibleForSupport = context.form.getField({ id: 'custevent_case_el_support_ehs_hazex_flo' });

            if (createdDate && createdDate < new Date('1/18/2022')) {

                var company = currentRecord.getValue('company');

                if (company != CONSTANTS.COMPANY_5_SELERANT) {

                    //per i casi vecchi ma non 5 selerant elimino la visualizzazione
                    openForCustomerField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                } else {
                    //setto il valore di internal case a true se 5 selerant
                    currentRecord.setValue({ fieldId: 'custevent_case_internal_case', value: true });

                }

                newCaseCreatorField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                newEligibleForSupport.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });



            } else {

                openForCustomerField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                oldCaseCreatorField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                oldEligibleForSupport.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }

            var assignToL1Field = context.form.getField({ id: 'assigned' });
            assignToL1Field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            var internalCaseField = context.form.getField({ id: 'custevent_case_internal_case' });
            internalCaseField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            // ********************
            // * CREATE MODE ONLY *
            // ********************
            if (context.type == context.UserEventType.CREATE) {

                var userObj = runtime.getCurrentUser();

                // CASE CREATOR EMAIL
                currentRecord.setValue({ fieldId: "custevent_case_creator_mail", value: userObj.email });

                // OLD CASE CREATOR
                currentRecord.setValue({ fieldId: "custevent_sel_case_created_by_user", value: userObj.name });

                currentRecord.setValue({ fieldId: "custevent_sel_case_creator", value: userObj.id });

                //setto l'origine a NS interface se creato da interfaccia NS
                if (runtime.executionContext == 'USERINTERFACE') {
                    // Origin
                    currentRecord.setValue({ fieldId: "origin", value: CONSTANTS.CASE_ORIGINS.NS_INTERFACE });
                }
            }

            // // ******************
            // // * EDIT MODE ONLY *
            // // ******************
            if (context.type == context.UserEventType.EDIT) {

                var companyField = context.form.getField({ id: 'company' });
                companyField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            }

            //Gestione Grab: se l'utente corrente è uguale a L2 allora rimuovo il bottone
            var assigneeL2 = currentRecord.getValue({ fieldId: "custevent_assign_to_l2" });
            if (assigneeL2 == runtime.getCurrentUser().id) {
                context.form.removeButton({
                    id: 'grab',
                });
            }
        }

        function beforeSubmit(context) {

            if (context.type == context.UserEventType.DELETE) {
                return;
            }

            var currentRecord = context.newRecord;
            var oldRecord = context.oldRecord;

            var company = currentRecord.getValue('company');

            var origin = currentRecord.getValue('origin');

            //Gestione Grab
            if (context.type == context.UserEventType.REASSIGN) {
                var newL1 = currentRecord.getValue({ fieldId: 'assigned' });
                var oldL1 = oldRecord.getValue({ fieldId: 'assigned' });

                if (newL1 != oldL1) {
                    currentRecord.setValue({ fieldId: "custevent_assign_to_l2", value: newL1 });
                    currentRecord.setValue({ fieldId: "assigned", value: oldL1 });
                }
            }

            if (context.type == context.UserEventType.CREATE) {
                currentRecord.setValue({ fieldId: "custevent_sel_case_date_created", value: currentRecord.getValue('startdate') });
            }

            //gestisco i campi obbligatori quando viene dal web form
            if (context.type == context.UserEventType.CREATE && origin == CONSTANTS.CASE_ORIGINS.WEB_FORM) {

                //caso aperto dal customer online quindi sempre internal case falso
                currentRecord.setValue({ fieldId: 'custevent_case_internal_case', value: false });
                //caso aperto dal customer online quindi il tipo di caso è da definire
                currentRecord.setValue({ fieldId: 'category', value: CONSTANTS.CASE_TYPES.TBD_TO_BE_DETERMINED });

                //setto i fields e mi faccio dare le company infos utilizzate
                var companyInfos = setCompanyInfosFields(currentRecord, false);

                var contact = getContact(company, runtime.getCurrentUser().email);

                //se ho trovato il contatto della mail presente lo uso sennò carico i contatti dal cliente
                if (contact && contact.length == 1) {

                    currentRecord.setValue({ fieldId: 'contact', value: contact[0].id });
                    currentRecord.setValue({ fieldId: 'email', value: contact[0].email });
                    currentRecord.setValue({ fieldId: 'phone', value: contact[0].phone });

                    log.debug('uso mail e phone dal contatto')

                } else if (companyInfos) {

                    // MAIN CASE EMAIL
                    if (companyInfos.email) {
                        currentRecord.setValue({ fieldId: 'email', value: companyInfos.email });
                    } else {
                        currentRecord.setValue({ fieldId: 'email', value: '' });
                    }

                    // MAIN CASE PHONE
                    if (companyInfos.phone) {
                        currentRecord.setValue({ fieldId: 'phone', value: companyInfos.phone });
                    } else {
                        currentRecord.setValue({ fieldId: 'phone', value: '' });
                    }

                    log.debug('uso mail e phone del customer')

                }
            }

            // ******************
            // * EDIT MODE ONLY *
            // ******************
            if (context.type == context.UserEventType.EDIT) {

                //se il caso non è chiuso effettuo il refresh dei campi
                var status = currentRecord.getValue('status');

                if (status != CONSTANTS.CASE_STATUSES.CLOSED) {

                    var caseDateCreated = currentRecord.getValue('custevent_sel_case_date_created');
                    if (!caseDateCreated || caseDateCreated == '') {
                        currentRecord.setValue({ fieldId: "custevent_sel_case_date_created", value: currentRecord.getValue('startdate') });
                    }

                    //se la company è 5 selerant setto il caso come interno
                    if (company == CONSTANTS.COMPANY_5_SELERANT) {
                        currentRecord.setValue({ fieldId: 'custevent_case_internal_case', value: true });
                    }
                    else if (company == CONSTANTS.COMPANY_BASELINE) {
                        currentRecord.setValue({ fieldId: 'custevent_case_internal_case', value: true });
                        currentRecord.setValue({ fieldId: 'custevent_sel_case_opened_for_baseline', value: true });
                    }

                    //setto i fields e mi faccio dare le company infos utilizzate
                    var companyInfos = setCompanyInfosFields(currentRecord, true);

                    // commentato perchè nel caso in cui la mail o il phone sono vuoti a questo punto non so quale è il comportamento da seguire
                    // soprattutto in relazione all'internal case type. Inoltre cercare di caricare informazioni qua vuol dire che 
                    // gli altri casi (client e apertura da webform) hanno fallito nel fare le stesse logiche
                    // mantengo commentato se dovessimo riprendere la logica più avanti con qualche altro ragionamento
                    // al momento se il la mail è vuota essendo un campo obnbligatorio netsuite non salva il caso

                    // if (companyInfos) {

                    //     //se main mail e phone sono vuoti allora li recupero dalla company
                    //     var mainEmail = currentRecord.getValue('email');
                    //     if ((!mainEmail || mainEmail == '') && companyInfos.email) {
                    //         currentRecord.setValue({ fieldId: 'email', value: companyInfos.email });
                    //     }

                    //     var mainPhone = currentRecord.getValue('phone');
                    //     if ((!mainPhone || mainPhone == '') && companyInfos.phone) {
                    //         currentRecord.setValue({ fieldId: 'phone', value: companyInfos.phone });
                    //     }
                    // }

                    // ********************
                    // * CR creation date *
                    // ********************
                    var oldCrCreationDate = oldRecord.getValue('custevent_case_tfs_cr_creation_date');
                    var newCrCreationDate = currentRecord.getValue('custevent_case_tfs_cr_creation_date');
                    if (newCrCreationDate && oldCrCreationDate != newCrCreationDate) {
                        currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CREATED });
                    }

                    // *****************************
                    // * CR development start date *
                    // *****************************
                    var oldCrDevStartDate = oldRecord.getValue('custevent_case_tfs_cr_dev_started');
                    var newCrDevStartDate = currentRecord.getValue('custevent_case_tfs_cr_dev_started');
                    if (newCrDevStartDate && oldCrDevStartDate != newCrDevStartDate) {
                        currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_IN_PROGRESS });
                    }

                    // *********************
                    // * [SEL] QC ASSIGNEE *
                    // *********************
                    var oldQcAssignee = oldRecord.getValue('custevent_case_tfs_cr_qc_assignee');
                    var newQcAssignee = currentRecord.getValue('custevent_case_tfs_cr_qc_assignee');
                    if (newQcAssignee && oldQcAssignee != newQcAssignee) {
                        currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_QC_INTERNAL_TESTING });
                    }

                    // ******************
                    // * CR CLOSED DATE *
                    // ******************
                    var oldDevCloseDate = oldRecord.getValue('custevent_case_tfs_cr_closed_date');
                    var newDevCloseDate = currentRecord.getValue('custevent_case_tfs_cr_closed_date');
                    if (newDevCloseDate && oldDevCloseDate != newDevCloseDate) {
                        currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CLOSED });
                    }
                }
            }

            // *************************
            // * PRIORITY AND SEVERITY *
            // *************************
            var selEnviroment = currentRecord.getValue({ fieldId: "custevent_cas_environm" });
            var selAvailability = currentRecord.getValue({ fieldId: "custevent_sel_sys_availability" });
            var selImpact = currentRecord.getValue({ fieldId: "custevent_sel_bus_impact" });
            var category = currentRecord.getValue({ fieldId: 'category' });

            if (selEnviroment == CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION) { // priority not available
                currentRecord.setValue({ fieldId: "priority", value: CONSTANTS.PRIORITY.N_A });

                if (category == CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST || category == CONSTANTS.CASE_TYPES.RFE_TBD || category == CONSTANTS.CASE_TYPES.RFE_BUG || category == CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST) {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.IMPROVEMENT });

                } else if (selAvailability == CONSTANTS.SYSTEM_AVAILABILITY.NOT_AVAILABLE) {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.HIGH_IMPACT });

                } else if (selAvailability == CONSTANTS.SYSTEM_AVAILABILITY.PARTIALLY_AVAILABLE) {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.MEDIUM_IMPACT });

                } else if (selAvailability == CONSTANTS.SYSTEM_AVAILABILITY.AVAILABLE && selImpact < 4) {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.LOW_IMPACT });

                } else { // other cases

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.LOW_IMPACT });
                }

            } else {

                if (category == CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST || category == CONSTANTS.CASE_TYPES.RFE_TBD || category == CONSTANTS.CASE_TYPES.RFE_BUG || category == CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST) {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.IMPROVEMENT });

                } else {

                    currentRecord.setValue({ fieldId: "custevent_sel_severity", value: CONSTANTS.SEVERITY.N_A });
                }
            }

            var selSeverity = currentRecord.getValue({ fieldId: "custevent_sel_severity" });

            var idCustomer = currentRecord.getValue({ fieldId: "company" });

            var customerRecord = record.load({ type: record.Type.CUSTOMER, id: idCustomer });

            if (selSeverity == CONSTANTS.SEVERITY.HIGH_IMPACT) {

                var rtOne = customerRecord.getValue({ fieldId: "custentity_case_severity_1rt" })
                var caOne = customerRecord.getValue({ fieldId: "custentity_case_severity_1ca" })
                var rtOnePars = parseFloat(rtOne) || 0;
                var caOnePars = parseFloat(caOne) || 0;
                currentRecord.setValue({ fieldId: "custevent_sel_react_time", value: rtOnePars });
                currentRecord.setValue({ fieldId: "custevent_sel_corr_act_time", value: caOnePars });

            } else if (selSeverity == CONSTANTS.SEVERITY.MEDIUM_IMPACT) {

                var rtTwo = customerRecord.getValue({ fieldId: "custentity_case_severity_2rt" });
                var caTwo = customerRecord.getValue({ fieldId: "custentity_case_severity_2ca" });
                var rtTwoPars = parseFloat(rtTwo) || 0;
                var caTwoPars = parseFloat(caTwo) || 0;
                currentRecord.setValue({ fieldId: "custevent_sel_react_time", value: rtTwoPars });
                currentRecord.setValue({ fieldId: "custevent_sel_corr_act_time", value: caTwoPars });

            } else if (selSeverity == CONSTANTS.SEVERITY.LOW_IMPACT) {

                var rtThree = customerRecord.getValue({ fieldId: "custentity_case_severity_3rt" });
                var caThree = customerRecord.getValue({ fieldId: "custentity_case_severity_3ca" });
                var rtThreePars = parseFloat(rtThree) || 0;
                var caThreePars = parseFloat(caThree) || 0;
                currentRecord.setValue({ fieldId: "custevent_sel_react_time", value: rtThreePars });
                currentRecord.setValue({ fieldId: "custevent_sel_corr_act_time", value: caThreePars });

            } else {

                currentRecord.setValue({ fieldId: "custevent_sel_react_time", value: null });
                currentRecord.setValue({ fieldId: "custevent_sel_corr_act_time", value: null });

            }

            var issueDescription = currentRecord.getValue({ fieldId: "custevent_sel_issue_description" });
            var incomingMessage = currentRecord.getValue({ fieldId: "incomingmessage" });

            if (issueDescription == null || issueDescription == undefined || issueDescription == '') {
                currentRecord.setValue({ fieldId: "custevent_sel_issue_description", value: incomingMessage });
            }

        }

        function afterSubmit(context) {

            log.debug({
                title: 'afterSubmit',
                details: afterSubmit
            })
            if (context.type == context.UserEventType.DELETE) {
                return;
            }

            var recordId = context.newRecord.id;
            var lookup = search.lookupFields({
                type: 'supportcase',
                id: recordId,
                columns: [
                    'createddate',
                    'supportfirstreply',
                    'enddate',
                    'custevent_sel_react_time',
                    'custevent_sel_corr_act_time',
                ]
            });

            log.debug({
                title: 'lookup',
                details: lookup
            });



            var id = record.submitFields({
                type: 'supportcase',
                id: recordId,
                values: {
                    'custevent_sel_cat_sla_compliant': 1,
                    'title': 'con le mani ciao ciao'
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            log.debug({
                title: 'id',
                details: id
            })


            // var currentRecord = record.load({ type: record.Type.SUPPORT_CASE, id: recordId, isDynamic: true });

            // // ******************
            // // * SLA COMPLIANCE *
            // // ******************
            // var datecreated = currentRecord.getValue({ fieldId: "datecreated" });
            // var supportfirstreply = currentRecord.getValue({ fieldId: "supportfirstreply" });
            // var enddate = currentRecord.getValue({ fieldId: "enddate" });
            // var irtSLA = currentRecord.getValue({ fieldId: "custevent_sel_react_time" });
            // var catSLA = currentRecord.getValue({ fieldId: "custevent_sel_corr_act_time" });

            // if (supportfirstreply != null && isNonEmptyPositiveNumber(irtSLA)) {

            //     var irt = hoursWorked(moment(datecreated), moment(supportfirstreply));
            //     var value = irt < irtSLA ? 1 : 2;
            //     currentRecord.setValue({ fieldId: "custevent_sel_irt_sla_compliant", value: value });

            // }

            // if (enddate != null && isNonEmptyPositiveNumber(catSLA)) {

            //     var cat = hoursWorked(moment(datecreated), moment(enddate));
            //     var value = cat < catSLA ? 1 : 2;
            //     currentRecord.setValue({ fieldId: "custevent_sel_cat_sla_compliant", value: value });

            // }

            // currentRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });

        }

        function isNonEmptyNumber(value) {
            return value.toString().length > 0 && !isNaN(value);
        }

        function isNonEmptyPositiveNumber(value) {
            return isNonEmptyNumber(value) && value > 0;
        }

        // calculation function
        function hoursWorked(start, end) {
            if (end.isBefore(start, 'second')) {
                return 0;
            }

            var bizHrs = {
                1: {
                    start: "01:00",
                    end: "10:00"
                },
                2: {
                    start: "01:00",
                    end: "10:00"
                },
                3: {
                    start: "01:00",
                    end: "10:00"
                },
                4: {
                    start: "01:00",
                    end: "10:00"
                },
                5: {
                    start: "01:00",
                    end: "10:00"
                },
                6: {},
                7: {}
            };

            var timeDiff = moment.duration(end.diff(start));
            var startDay = start.format('YYYY-MM-DD');
            var endDay = end.format('YYYY-MM-DD');
            var current = start;
            var currentDay = current.format('YYYY-MM-DD');

            var totalMin = 0;
            var endTime,
                startTime;
            var weekday,
                bizStartTime,
                bizEndTime,
                duration;

            do {
                weekday = current.format('E');
                bizStartTime = bizHrs[weekday].start;
                bizEndTime = bizHrs[weekday].end;

                if (bizStartTime && bizStartTime) {
                    if (currentDay == startDay) {
                        startTime = start.format("HH:mm");
                        startTime = startTime > bizStartTime ? startTime : bizStartTime;
                        startTime = startTime < bizEndTime ? startTime : bizEndTime;
                    } else {
                        startTime = bizStartTime;
                    }

                    if (currentDay == endDay) {
                        endTime = end.format("HH:mm");
                        endTime = endTime < bizEndTime ? endTime : bizEndTime;
                        endTime = endTime > bizStartTime ? endTime : bizStartTime;
                    } else {
                        endTime = bizEndTime;
                    }
                    startTime = moment(currentDay + ' ' + startTime);
                    endTime = moment(currentDay + ' ' + endTime);

                    duration = moment.duration(endTime.diff(startTime)).as('minutes');
                    totalMin += duration;
                }

                // next day
                current.add(1, "days");
                currentDay = current.format('YYYY-MM-DD');
            } while (currentDay <= endDay);

            return totalMin / 60;
        }

        function setCompanyInfosFields(currentRecord, editMode) {

            var company = currentRecord.getValue('company');

            //se il caso è di prima del 18/01 è stato aperto per 5 selerant allora faccio gli aggiornamenti dei campi dal case open for customer
            var createdDate = currentRecord.getValue('custevent_sel_case_date_created');

            if (createdDate && createdDate < new Date('1/18/2022')) {

                if (company == CONSTANTS.COMPANY_5_SELERANT) {
                    company = currentRecord.getValue('custevent_cas_open_for');
                }
            }

            var companyInfos = getCompanyInfos(company);

            if (companyInfos) {

                if (companyInfos.custentity_cust_project_manager[0]) {
                    currentRecord.setValue({
                        fieldId: 'custevent_custom_proj_manager',
                        value: companyInfos.custentity_cust_project_manager[0].value ? companyInfos.custentity_cust_project_manager[0].value : ''
                    });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_custom_proj_manager', value: '' });
                }

                if (companyInfos.custentity_customer_account_manager[0]) {
                    currentRecord.setValue({
                        fieldId: 'custevent_sel_cust_acc_manager',
                        value: companyInfos.custentity_customer_account_manager[0].value ? companyInfos.custentity_customer_account_manager[0].value : ''
                    });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_sel_cust_acc_manager', value: '' });
                }

                if (companyInfos.custentity_cust_product_line[0]) {
                    currentRecord.setValue({
                        fieldId: 'custevent_cas_prod_line',
                        value: companyInfos.custentity_cust_product_line[0].value ? companyInfos.custentity_cust_product_line[0].value : ''
                    });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_cas_prod_line', value: '' });
                }

                if (companyInfos.custentity_sel_pm_coordinator[0]) {
                    currentRecord.setValue({
                        fieldId: 'custevent_sel_pm_coordinator',
                        value: companyInfos.custentity_sel_pm_coordinator[0].value ? companyInfos.custentity_sel_pm_coordinator[0].value : ''
                    });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_sel_pm_coordinator', value: '' });
                }

                if (editMode) {
                    var newSupportTeam = companyInfos.custentity_sel_support_team[0];
                    var oldSupportTeam = currentRecord.getValue('assigned');
                    if (newSupportTeam && newSupportTeam != '') {
                        if (newSupportTeam.value != oldSupportTeam) {
                            currentRecord.setValue({ fieldId: 'assigned', value: newSupportTeam.value });
                        }
                    }
                } else {

                    if (companyInfos.custentity_sel_support_team[0]) {
                        currentRecord.setValue({
                            fieldId: 'assigned',
                            value: companyInfos.custentity_sel_support_team[0].value ? companyInfos.custentity_sel_support_team[0].value : ''
                        });
                    } else {
                        currentRecord.setValue({ fieldId: 'assigned', value: '' });
                    }
                }


                if (companyInfos.custentity_cust_elegible_support[0]) {
                    currentRecord.setValue({ fieldId: 'custevent_case_el_support_ehs_hazex_flo', value: companyInfos.custentity_cust_elegible_support[0].value == CONSTANTS.ELIGIBLE_FOR_SUPPORT.YES });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_case_el_support_ehs_hazex_flo', value: false });
                }

                if (companyInfos.custentity_cust_assist_categ[0]) {
                    currentRecord.setValue({ fieldId: 'custevent_cas_assist_categ', value: companyInfos.custentity_cust_assist_categ[0].text });
                } else {
                    currentRecord.setValue({ fieldId: 'custevent_cas_assist_categ', value: '' });
                }

            } else {

                currentRecord.setValue({ fieldId: 'custevent_custom_proj_manager', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_sel_cust_acc_manager', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_cas_prod_line', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_sel_pm_coordinator', value: '' });
                currentRecord.setValue({ fieldId: 'assigned', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_case_el_support_ehs_hazex_flo', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_cas_assist_categ', value: '' });

            }

            // *******************************
            // * STANDARD MAINTENANCE FIELDS *
            // *******************************

            var activeContract = getActiveContract(company);

            if (activeContract && activeContract.length > 0) {
                currentRecord.setValue({ fieldId: 'custevent_sel_standard_maintenance', value: true });

                var startDate = null;
                if (activeContract[0].start_date) {
                    startDate = format.parse({ value: activeContract[0].start_date, type: format.Type.DATE });
                }
                if (startDate) {
                    currentRecord.setValue({ fieldId: 'custevent_sel_sm_start_date', value: startDate });
                }

                var endDate = null
                if (activeContract[0].end_date) {
                    endDate = format.parse({ value: activeContract[0].end_date, type: format.Type.DATE });
                }
                if (endDate) {
                    currentRecord.setValue({ fieldId: 'custevent_sel_sm_end_date', value: endDate });
                }

            } else {
                currentRecord.setValue({ fieldId: 'custevent_sel_standard_maintenance', value: false });
                currentRecord.setValue({ fieldId: 'custevent_sel_sm_start_date', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_sel_sm_end_date', value: '' });
            }

            // **********************************
            // * APPLICATION MAINTENANCE FIELDS *
            // **********************************
            var activeMaintenanceProjects = getActiveMaintenanceProject(company);
            if (activeMaintenanceProjects && activeMaintenanceProjects.length > 0) {

                currentRecord.setValue({ fieldId: 'custevent_sel_application_maintenance', value: true });

                var startDate = null;

                if (activeMaintenanceProjects[0].start_date) {
                    startDate = format.parse({ value: activeMaintenanceProjects[0].start_date, type: format.Type.DATE });
                }
                if (startDate) {
                    currentRecord.setValue({ fieldId: 'custevent_sel_am_start_date', value: startDate });
                }

                var endDate = null;
                if (activeMaintenanceProjects[0].end_date) {
                    endDate = format.parse({ value: activeMaintenanceProjects[0].end_date, type: format.Type.DATE });
                }
                if (endDate) {
                    currentRecord.setValue({ fieldId: 'custevent_sel_am_end_date', value: endDate });
                }

            } else {
                currentRecord.setValue({ fieldId: 'custevent_sel_application_maintenance', value: false });
                currentRecord.setValue({ fieldId: 'custevent_sel_am_start_date', value: '' });
                currentRecord.setValue({ fieldId: 'custevent_sel_am_end_date', value: '' });
            }

            //ritorno il company infos usato per gestire altri campi con altre logiche
            return companyInfos;
        }

        function getCompanyInfos(id) {
            if (id) {

                var lookup = search.lookupFields({
                    type: 'entity',
                    id: id,
                    columns: [
                        'email',
                        'phone',
                        'custentity_cust_project_manager',
                        'custentity_customer_account_manager',
                        'custentity_cust_product_line',
                        'custentity_sel_pm_coordinator',
                        'custentity_sel_support_team',
                        'custentity_cust_elegible_support',
                        'custentity_cust_assist_categ'
                    ]
                });

                return lookup;
            }

            return null;
        }

        function getContact(companyId, email) {

            if (companyId && email) {

                var contactSearchObj = search.create({
                    type: "contact",
                    filters: [
                        ["company", "anyof", companyId],
                        "AND", ["email", "is", email]
                    ],
                    columns: [
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "email", label: "Email" }),
                        search.createColumn({ name: "phone", label: "Phone" }),
                        search.createColumn({ name: "altphone", label: "Office Phone" }),
                        search.createColumn({ name: "fax", label: "Fax" }),
                        search.createColumn({ name: "company", label: "Company" }),
                        search.createColumn({ name: "altemail", label: "Alt. Email" })
                    ]
                });

                var retObj = [];
                contactSearchObj.run().each(function (result) {

                    retObj.push({
                        'id': result.id,
                        'name': result.getValue('entityid'),
                        'email': result.getValue('email'),
                        'altemail': result.getValue('altemail'),
                        'phone': result.getValue('phone'),
                        'altphone': result.getValue('altphone'),
                        'fax': result.getValue('fax'),
                        'companyid': result.getValue('company'),
                        'companyName': result.getText('company'),
                    });

                    return true;
                });

                return retObj;
            }

            return null;
        }

        function getActiveContract(companyId) {

            if (companyId) {

                var customrecord_contractsSearchObj = search.create({
                    type: "customrecord_contracts",
                    filters: [
                        ["custrecord_contracts_bill_to_customer", "anyof", companyId],
                        "AND", ["custrecord_contract_status", "anyof", "5", "2"] //renewal generated or Active
                    ],
                    columns: [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "id", label: "ID" }),
                        search.createColumn({
                            name: "custrecord_contracts_start_date",
                            sort: search.Sort.DESC,
                            label: "Contract Start Date"
                        }),
                        search.createColumn({ name: "custrecord_contracts_end_date", label: "Contract End Date" }),
                        search.createColumn({ name: "custrecord_contract_status", label: "Status" }),
                        search.createColumn({ name: "custrecord_contracts_bill_to_customer", label: "Bill To Customer" }),
                        search.createColumn({ name: "custrecord_contracts_end_user", label: "End User" }),
                        search.createColumn({ name: "custrecord_swe_contract_value", label: "Contract Value (Base Curr)" }),
                        search.createColumn({ name: "custrecord_contract_date_renewed", label: "Contract Renewed On" })
                    ]
                });

                var returnObj = [];

                customrecord_contractsSearchObj.run().each(function (result) {

                    returnObj.push({
                        id: result.id,
                        name: result.getValue('name'),
                        start_date: result.getValue('custrecord_contracts_start_date'),
                        end_date: result.getValue('custrecord_contracts_end_date'),
                        status_name: result.getText('custrecord_contract_status'),
                        status_id: result.getValue('custrecord_contract_status')
                    });

                    return true;
                });

                return returnObj;
            }

            return null;

        }

        function getActiveMaintenanceProject(companyId) {

            if (companyId) {
                var jobSearchObj = search.create({
                    type: "job",
                    filters: [
                        ["customer", "anyof", companyId],
                        "AND", ["status", "anyof", "5", "2"], //Awarded o in progress
                        "AND", ["entityid", "contains", "maintenance"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "customer", label: "Customer" }),
                        search.createColumn({ name: "entitystatus", label: "Status" }),
                        search.createColumn({ name: "contact", label: "Primary Contact" }),
                        search.createColumn({ name: "jobtype", label: "Project Type" }),
                        search.createColumn({ name: "startdate", label: "Start Date" }),
                        search.createColumn({ name: "enddate", label: "End Date" }),
                        search.createColumn({ name: "altemail", label: "Alt. Email" }),
                        search.createColumn({ name: "custentity8", label: "[SEL] Is Cloud?" }),
                        search.createColumn({ name: "csegcustrec_project", label: "[SEL] Project" })
                    ]
                });

                var returnObj = [];
                jobSearchObj.run().each(function (result) {

                    returnObj.push({
                        id: result.id,
                        name: result.getValue('altname'),
                        start_date: result.getValue('startdate'),
                        end_date: result.getValue('enddate')
                    });

                    return true;
                });

                return returnObj;

            }

            return null;
        }

        return {
            beforeSubmit: beforeSubmit,
            //afterSubmit: afterSubmit,
            beforeLoad: beforeLoad
        }
    });