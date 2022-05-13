/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/search', 'N/runtime', 'N/ui/dialog', 'N/ui/message', 'N/format', './support_managements_constants.js'],
    /**
     * @param {search} search
     * @param {runtime} runtime
     * @param {dialog} dialog
     * @param {message} message
     * @param {format} format
     * @param {constants} CONSTANTS
     */
    function (search, runtime, dialog, message, format, CONSTANTS) {

        function pageInit(context) {

            var currentRecord = context.currentRecord;

            // ******************
            // * EDIT MODE ONLY *
            // ******************
            if (context.mode == 'edit') {

                var selectedEnvironment = currentRecord.getValue('custevent_cas_environm');

                if (selectedEnvironment && selectedEnvironment == CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION) {

                    setValue(currentRecord, 'priority', CONSTANTS.PRIORITY.N_A);
                    setDisabled(currentRecord, 'priority', true);

                } else {

                    setDisabled(currentRecord, 'custevent_sel_sys_availability', true);
                    setDisabled(currentRecord, 'custevent_sel_bus_impact', true);
                    setDisabled(currentRecord, 'custevent_sel_case_nature', true);
                }

                //aggiorno i campi provenienti dal customer tranne case email e phone e lascio l'assignee uguale se non è cambiato da company
                setCompanyInfosFields(currentRecord, false, true);
            }

            disableTFSFields(currentRecord);
        }

        function fieldChanged(context) {

            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;
            var company = currentRecord.getValue('company');

            // *********************
            // *  CASE TYPE *
            // *********************

            if (fieldId == 'category') {
                var crNumber = currentRecord.getValue('custevent_case_tfs_cr_id');
                if (crNumber && crNumber != '') {
                    var link = CONSTANTS.DEVOPS_BASE_LINK + crNumber;
                    var category = currentRecord.getValue({ fieldId: 'category' });

                    if (category == CONSTANTS.CASE_TYPES.BASELINE_ISSUE_TBD ||
                        category == CONSTANTS.CASE_TYPES.SPR_BASELINE_BUG ||
                        category == CONSTANTS.CASE_TYPES.RFI_BASELINE ||
                        category == CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST) {

                        link = CONSTANTS.DEVOPS_BASE_LINK_BASELINE + crNumber;

                    }

                    setValue(currentRecord, 'custevent_case_tfs_cr_link', link);

                    dialog.alert({
                        title: 'Message:',
                        message: ' TFS Cr Link Updated after the Case Type change'
                    });
                }
            }

            // *********************
            // *  TFS CR LINK *
            // *********************

            if (fieldId == 'custevent_case_tfs_cr_id') {

                var crNumber = currentRecord.getValue('custevent_case_tfs_cr_id');
                var link = CONSTANTS.DEVOPS_BASE_LINK + crNumber;
                var category = currentRecord.getValue({ fieldId: 'category' });

                if (category == CONSTANTS.CASE_TYPES.BASELINE_ISSUE_TBD ||
                    category == CONSTANTS.CASE_TYPES.SPR_BASELINE_BUG ||
                    category == CONSTANTS.CASE_TYPES.RFI_BASELINE ||
                    category == CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST) {

                    link = CONSTANTS.DEVOPS_BASE_LINK_BASELINE + crNumber;

                }

                setValue(currentRecord, 'custevent_case_tfs_cr_link', link);

                dialog.alert({
                    title: 'Message:',
                    message: ' TFS Cr Link Updated'
                });
            }

            // ************
            // * PRIORITY *
            // ************

            if (fieldId == 'custevent_cas_environm') {

                var selectedEnvironment = currentRecord.getValue(fieldId);

                if (selectedEnvironment == CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION) {

                    setValue(currentRecord, 'priority', CONSTANTS.PRIORITY.N_A);
                    setDisabled(currentRecord, 'priority', true);
                    setDisabled(currentRecord, 'custevent_sel_sys_availability', false);
                    setDisabled(currentRecord, 'custevent_sel_bus_impact', false);
                    setDisabled(currentRecord, 'custevent_sel_case_nature', false);

                } else {

                    setValue(currentRecord, 'priority', CONSTANTS.PRIORITY.INSERT_PRIORITY_VALUE);
                    setDisabled(currentRecord, 'priority', false);
                    setValue(currentRecord, 'custevent_sel_sys_availability', '');
                    setDisabled(currentRecord, 'custevent_sel_sys_availability', true);
                    setValue(currentRecord, 'custevent_sel_bus_impact', '');
                    setDisabled(currentRecord, 'custevent_sel_bus_impact', true);
                    setValue(currentRecord, 'custevent_sel_case_nature', '');
                    setDisabled(currentRecord, 'custevent_sel_case_nature', true);

                }
            }

            // ************
            // * COMPANY *
            // ************
            if (fieldId == 'company') {

                var optionsInternalCase = {
                    title: 'Open an internal case?',
                    message: 'Do you want to open an internal case? <br><br>Please Note: <i>once saved this field will not be editable</i>',
                    buttons: [
                        { label: 'YES', value: true },
                        { label: 'NO', value: false }
                    ]
                };

                function responseInternalCase(value) {
                    setValue(currentRecord, 'custevent_case_internal_case', value);
                    setValue(currentRecord, 'category', CONSTANTS.CASE_TYPES.TBD_TO_BE_DETERMINED)

                    //aggiorno i campi provenienti dal customer compreso case email e phone
                    setCompanyInfosFields(currentRecord, true, false);

                    //disabilito il tasto contact
                    setDisabled(currentRecord, 'contact', true);
                }

                function catchInternalCase(value) {
                    setValue(currentRecord, 'custevent_case_internal_case', value);
                    setValue(currentRecord, 'category', CONSTANTS.CASE_TYPES.TBD_TO_BE_DETERMINED);

                    //aggiorno i campi provenienti dal customer compreso case email e phone
                    setCompanyInfosFields(currentRecord, true, false);

                    //abilito il tasto contact
                    setDisabled(currentRecord, 'contact', false);
                }

                if (company == CONSTANTS.COMPANY_BASELINE) {

                    setValue(currentRecord, 'custevent_case_internal_case', true);
                    setValue(currentRecord, 'custevent_sel_case_opened_for_baseline', true);
                    responseInternalCase(true);

                } else if (company == CONSTANTS.COMPANY_5_SELERANT) {

                    var message5Selerant =
                        '<p>You have selected the company <strong>"5 Selerant Group"</strong>.</p><br>' +
                        '<p>Company 5 Selerant Group <u>is no longer used to open an internal case</u>.</p><br>' +
                        '<p>To open an internal case relating to a client it is <strong>mandatory</strong> to select the client and to the question if it is an internal case to answer yes.</p><br>' +
                        '<p>To open an internal case relating to one of the Selerant companies in the registry, you can continue to select them. In this case it is <strong>recommended</strong> to indicate that it is an internal case since the company is a Selerant company.</p><br>' +
                        '<p>Do you want to continue with the opening of a case for the company "5 Selerant Group" having taken note of what is specified?</p>';

                    var options5Selerant = {
                        title: 'IMPORTANT MESSAGE',
                        message: message5Selerant,
                        buttons: [
                            { label: 'YES', value: true },
                            { label: 'NO', value: false }
                        ]
                    };

                    function response5Selerant(value) {
                        if (value) {
                            dialog.create(optionsInternalCase).then(responseInternalCase).catch(catchInternalCase);
                        } else {
                            setValue(currentRecord, 'company', '');
                            setValue(currentRecord, 'custevent_sel_case_opened_for_baseline', false);
                        }
                    }

                    function catch5Selerant(value) { }

                    dialog.create(options5Selerant).then(response5Selerant).catch(catch5Selerant);

                } else if (company != null && company != '') {

                    dialog.create(optionsInternalCase).then(responseInternalCase).catch(catchInternalCase);
                    setValue(currentRecord, 'custevent_sel_case_opened_for_baseline', false);

                }
            }

            var phase = +currentRecord.getValue({ fieldId: 'custevent_cas_phase' });

            // *********************************
            //* PHASE MAINTENANCE/SUPPORT ONLY *
            // *********************************
            if (phase == CONSTANTS.CASE_PHASES.MAINTENANCE_SUPPORT) {

                // ************
                // *  IS CASE REPLICABLE? *
                // ************

                if (fieldId == 'custevent_sel_is_case_replicable') {
                    var caseReplicable = currentRecord.getText('custevent_sel_is_case_replicable');
                    if (caseReplicable == 'Yes') {
                        dialog.alert({
                            title: 'Message:',
                            message: 'Please evaluate if the case has an expected behavior by setting the correspondent field'
                        });
                    } else if (caseReplicable == 'No') {
                        dialog.alert({
                            title: 'Message:',
                            message: 'Case is not replicable, please ask more information to customer to replicate the case, AM will be notified to supervise the case.'
                        });
                    }
                }

                // ************
                // *  IS IT AN EXPECTED BEHAVIOUR? *
                // ************

                if (fieldId == 'custevent_sel_expected_behaviour_status') {
                    var expectedBehaviour = currentRecord.getText('custevent_sel_expected_behaviour_status');
                    if (expectedBehaviour == 'Yes') {
                        dialog.alert({
                            title: 'Message:',
                            message: 'Please inform the customer about expected behaviour'
                        });

                        setValue(currentRecord, 'status', CONSTANTS.CASE_STATUSES.EXPECTED_BEHAVIOR_GIVING_INSTRUCTIONS_TO_CUSTOMER);

                    }
                }

                // ************
                // *  IS THERE A WORKAROUND? *
                // ************

                if (fieldId == 'custevent_sel_exists_workarount') {
                    var workaround = currentRecord.getText('custevent_sel_exists_workarount');
                    if (workaround == 'No') {
                        dialog.alert({
                            title: 'Message:',
                            message: 'Wait for a Time-line from Account Manager before answering to customer, ' +
                                'then assign case (if core bug) with Time-Line to Devex Support – Core Bugs by setting assign to L3 correspondent value'
                        });
                    }
                }
            }
        }

        function saveRecord(context) {

            var currentRecord = context.currentRecord;

            var company = currentRecord.getValue({ fieldId: 'company' });

            var createdDate = currentRecord.getValue('custevent_sel_case_date_created');

            if (createdDate && createdDate < new Date('1/18/2022')) {

                if (company == CONSTANTS.COMPANY_5_SELERANT) {
                    company = currentRecord.getValue('custevent_cas_open_for');
                }
            }

            var lookup = search.lookupFields({
                type: 'entity',
                id: company,
                columns: [
                    'custentity_sel_support_team'
                ]
            });

            if (!lookup.custentity_sel_support_team || lookup.custentity_sel_support_team == '') {


                var productLine = currentRecord.getValue('custevent_cas_prod_line');

                if (productLine == CONSTANTS.PRODUCT_LINE.DEVEX || (!productLine && company != CONSTANTS.COMPANY_BASELINE)) {

                    message.create({
                        title: 'Message:',
                        message: 'The field SUPPORT TEAM need to be setted in customer support area, PM Coordinator has alredy been noticed',
                        type: message.Type.WARNING
                    }).show();

                    // dialog.alert({
                    //     title: 'Message:',
                    //     message: 'The field SUPPORT TEAM need to be setted in customer support area, PM Coordinator has alredy been noticed',
                    // });

                    //nota non c'è modo di bloccare il salvataggio se non con una confirm

                    // if (confirm('The field SUPPORT TEAM need to be setted in customer support area. Do you want to proceed?'))
                    //     return true;
                    // else
                    //     return false;
                }
            }

            // ************
            // * PRIORITY *
            // ************

            var enviroment = currentRecord.getValue({ fieldId: "custevent_cas_environm" });
            var priority = currentRecord.getValue({ fieldId: "priority" });
            var category = currentRecord.getValue({ fieldId: 'category' });

            var systemAvailabilityText = currentRecord.getText({ fieldId: "custevent_sel_sys_availability" });
            var businessImpactText = currentRecord.getText({ fieldId: "custevent_sel_bus_impact" });
            var caseNatureText = currentRecord.getText({ fieldId: "custevent_sel_case_nature" });

            if (enviroment == CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION && (systemAvailabilityText == '' || businessImpactText == '' || caseNatureText == '')) {

                var options = {
                    title: 'Missing Severity Fields',
                    message: 'For cases related to Production environment is mandatory to fill System Availability, Business Impact and Case Nature'
                };

                function success(result) { }

                function failure(reason) { }
                dialog.alert(options).then(success).catch(failure);
                return false;
            }

            if (enviroment != CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION &&
                priority == CONSTANTS.PRIORITY.IMPROVEMENT &&
                (category != CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST &&
                    category != CONSTANTS.CASE_TYPES.RFE_TBD &&
                    category != CONSTANTS.CASE_TYPES.RFE_BUG &&
                    category != CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST)) {

                var options = {
                    title: 'Invalid “Case Type” Setting',
                    message: 'Priority is 4 (Improvement) - Go to Case Type Assessment Section and reset Case Type as RFE'
                };

                function success(result) { }

                function failure(reason) { }

                dialog.alert(options).then(success).catch(failure);

                return false;
            }

            if (enviroment != CONSTANTS.CASE_ENVIRONMENTS.PRODUCTION &&
                (priority == CONSTANTS.PRIORITY.N_A || priority == CONSTANTS.PRIORITY.INSERT_PRIORITY_VALUE)) {

                var options = {
                    title: 'Invalid Priority',
                    message: 'Please select a Priority value between 1 and 4'
                };

                function success(result) { }

                function failure(reason) { }
                dialog.alert(options).then(success).catch(failure);
                return false;
            }

            return true;
        }

        function setCompanyInfosFields(currentRecord, updateContact, editMode) {

            //eseguo l'update dei campi solo se non è il customer che ha i permessi limitati
            if (runtime.getCurrentUser().roleCenter != 'CUSTOMER') {

                var company = currentRecord.getValue('company');

                //se il caso è di prima del 18/01 è stato aperto per 5 selerant allora faccio gli aggiornamenti dei campi dal case open for customer
                var createdDate = currentRecord.getValue('custevent_sel_case_date_created');

                if (createdDate && createdDate < new Date('1/18/2022')) {

                    if (company == CONSTANTS.COMPANY_5_SELERANT) {
                        company = currentRecord.getValue('custevent_cas_open_for');
                    }
                }

                var productLine = currentRecord.getValue('custevent_cas_prod_line');
                var companyInfos = getCompanyInfos(company);
                var internalCase = currentRecord.getValue('custevent_case_internal_case');

                if (companyInfos) {

                    if (companyInfos.custentity_cust_project_manager[0]) {
                        setValue(currentRecord, 'custevent_custom_proj_manager', companyInfos.custentity_cust_project_manager[0].value ? companyInfos.custentity_cust_project_manager[0].value : '');
                    } else {
                        setValue(currentRecord, 'custevent_custom_proj_manager', '');
                    }

                    if (companyInfos.custentity_customer_account_manager[0]) {
                        setValue(currentRecord, 'custevent_sel_cust_acc_manager', companyInfos.custentity_customer_account_manager[0].value ? companyInfos.custentity_customer_account_manager[0].value : '');
                    } else {
                        setValue(currentRecord, 'custevent_sel_cust_acc_manager', '');
                    }

                    if (companyInfos.custentity_cust_product_line[0]) {
                        setValue(currentRecord, 'custevent_cas_prod_line', companyInfos.custentity_cust_product_line[0].value ? companyInfos.custentity_cust_product_line[0].value : '');
                    } else {
                        setValue(currentRecord, 'custevent_cas_prod_line', '');
                    }

                    if (companyInfos.custentity_sel_pm_coordinator[0]) {
                        setValue(currentRecord, 'custevent_sel_pm_coordinator', companyInfos.custentity_sel_pm_coordinator[0].value ? companyInfos.custentity_sel_pm_coordinator[0].value : '');
                    } else {
                        setValue(currentRecord, 'custevent_sel_pm_coordinator', '');
                    }

                    //se sono in edit se il support team è diverso da null e diverso da quello che abbiamo già settato allora cambialo sennò non fare nulla
                    //se è in creazione lasciare vuoto per avviare le territories

                    if (editMode) {
                        var newSupportTeam = companyInfos.custentity_sel_support_team ? companyInfos.custentity_sel_support_team[0] : '';
                        var oldSupportTeam = currentRecord.getValue('assigned');
                        if (newSupportTeam && newSupportTeam != '') {
                            if (newSupportTeam.value != oldSupportTeam) {
                                setValue(currentRecord, 'assigned', newSupportTeam.value);
                            }
                        }
                    } else {
                        if (companyInfos.custentity_sel_support_team && companyInfos.custentity_sel_support_team[0]) {
                            setValue(currentRecord, 'assigned', companyInfos.custentity_sel_support_team[0].value ? companyInfos.custentity_sel_support_team[0].value : '');
                        } else {

                            if (productLine == CONSTANTS.PRODUCT_LINE.DEVEX || (!productLine && company != CONSTANTS.COMPANY_BASELINE)) {

                                dialog.alert({
                                    title: 'Message:',
                                    message: 'The field SUPPORT TEAM need to be setted in customer support area, PM Coordinator will be notified when saving'
                                });

                            }

                            //resetto il campo per abilitare le regole delle territories alla creazione
                            setValue(currentRecord, 'assigned', '');
                        }
                    }

                    if (companyInfos.custentity_cust_elegible_support && companyInfos.custentity_cust_elegible_support[0]) {
                        setValue(currentRecord, 'custevent_case_el_support_ehs_hazex_flo', companyInfos.custentity_cust_elegible_support[0].value == CONSTANTS.ELIGIBLE_FOR_SUPPORT.YES);
                    } else {
                        setValue(currentRecord, 'custevent_case_el_support_ehs_hazex_flo', false);
                    }

                    if (companyInfos.custentity_cust_assist_categ && companyInfos.custentity_cust_assist_categ[0]) {
                        setValue(currentRecord, 'custevent_cas_assist_categ', companyInfos.custentity_cust_assist_categ[0].text);
                    } else {
                        setValue(currentRecord, 'custevent_cas_assist_categ', '');
                    }

                    //aggiorno i contatti solo se updatecontact è true
                    if (updateContact) {
                        if (internalCase) {

                            if (company == CONSTANTS.COMPANY_BASELINE) {

                                //MAIN CASE EMAIL
                                if (companyInfos.email) {
                                    setValue(currentRecord, 'email', companyInfos.email);
                                } else {
                                    setValue(currentRecord, 'email', '');
                                }

                                //MAIN CASE PHONE
                                if (companyInfos.phone) {
                                    setValue(currentRecord, 'phone', companyInfos.phone);
                                } else {
                                    setValue(currentRecord, 'phone', '');
                                }
                            }
                            else {

                                var userObj = runtime.getCurrentUser();

                                //MAIN CASE EMAIL
                                setValue(currentRecord, 'email', userObj.email);

                                //MAIN CASE PHONE
                                var employeeFields = search.lookupFields({
                                    type: 'employee',
                                    id: userObj.id,
                                    columns: 'phone'
                                });
                                setValue(currentRecord, 'phone', employeeFields.phone);
                            }

                        } else {

                            //MAIN CASE EMAIL
                            if (companyInfos.email) {
                                setValue(currentRecord, 'email', companyInfos.email);
                            } else {
                                setValue(currentRecord, 'email', '');
                            }

                            //MAIN CASE PHONE
                            if (companyInfos.phone) {
                                setValue(currentRecord, 'phone', companyInfos.phone);
                            } else {
                                setValue(currentRecord, 'phone', '');
                            }
                        }
                    }

                } else {
                    setValue(currentRecord, 'custevent_custom_proj_manager', '');
                    setValue(currentRecord, 'custevent_sel_cust_acc_manager', '');
                    setValue(currentRecord, 'custevent_cas_prod_line', '');
                    setValue(currentRecord, 'custevent_sel_pm_coordinator', '');
                    setValue(currentRecord, 'assigned', '');
                    setValue(currentRecord, 'custevent_case_el_support_ehs_hazex_flo', false);
                    setValue(currentRecord, 'custevent_cas_assist_categ', '');

                    if (updateContact) {
                        setValue(currentRecord, 'email', '');
                        setValue(currentRecord, 'phone', '');
                    }
                }

                // *******************************
                // * STANDARD MAINTENANCE FIELDS *
                // *******************************
                var activeContract = getActiveContract(company);
                if (activeContract && activeContract.length > 0) {
                    setValue(currentRecord, 'custevent_sel_standard_maintenance', true);

                    var startDate = null;
                    if (activeContract[0].start_date) {
                        startDate = format.parse({ value: activeContract[0].start_date, type: format.Type.DATE });
                    }
                    if (startDate) {
                        setValue(currentRecord, 'custevent_sel_sm_start_date', startDate);
                    }

                    var endDate = null;
                    if (activeContract[0].end_date) {
                        endDate = format.parse({ value: activeContract[0].end_date, type: format.Type.DATE });
                    }
                    if (endDate) {
                        setValue(currentRecord, 'custevent_sel_sm_end_date', endDate);
                    }
                } else {
                    setValue(currentRecord, 'custevent_sel_standard_maintenance', false);
                    setValue(currentRecord, 'custevent_sel_sm_start_date', '');
                    setValue(currentRecord, 'custevent_sel_sm_end_date', '');
                }

                // **********************************
                // * APPLICATION MAINTENANCE FIELDS *
                // **********************************
                var activeMaintenanceProjects = getActiveMaintenanceProject(company);
                if (activeMaintenanceProjects && activeMaintenanceProjects.length > 0) {

                    setValue(currentRecord, 'custevent_sel_application_maintenance', true);

                    var startDate = null;

                    if (activeMaintenanceProjects[0].start_date) {
                        startDate = format.parse({ value: activeMaintenanceProjects[0].start_date, type: format.Type.DATE });
                    }
                    if (startDate) {
                        setValue(currentRecord, 'custevent_sel_am_start_date', startDate);
                    }

                    var endDate = null;
                    if (activeMaintenanceProjects[0].end_date) {
                        endDate = format.parse({ value: activeMaintenanceProjects[0].end_date, type: format.Type.DATE });
                    }
                    if (endDate) {
                        setValue(currentRecord, 'custevent_sel_am_end_date', endDate);
                    }
                } else {
                    setValue(currentRecord, 'custevent_sel_application_maintenance', false);
                    setValue(currentRecord, 'custevent_sel_am_start_date', '');
                    setValue(currentRecord, 'custevent_sel_am_end_date', '');
                }
            }
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

                log.debug({
                    title: 'lookup',
                    details: lookup
                })
                return lookup;
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

        function disableTFSFields(currentRecord) {
            for (var i = 0; i < CONSTANTS.TFS_FIELDS.length; i++) {
                setDisabled(currentRecord, CONSTANTS.TFS_FIELDS[i], true);
            }
        }

        function setDisabled(record, fieldId, isDisabled) {
            var field = record.getField({
                fieldId: fieldId
            });
            field.isDisabled = isDisabled;
        }

        function setValue(record, fieldId, value) {
            record.setValue({
                fieldId: fieldId,
                value: value
            });
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged
        }
    });