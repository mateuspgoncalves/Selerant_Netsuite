/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @author Bruno Belluccia
 * @version 1.1
 * @date 12/11/2021
 */

//this script send notification to specific email address when some case fields on case changed

define(['N/search', 'N/format', 'N/config', './send_email_library.js', './support_managements_constants.js'],
    /**
     * @param {search} search
     * @param {format} format
     * @param {config} config
     * @param {maillib} maillib
     * @param {constants} CONSTANTS
     */
    function (search, format, config, maillib, CONSTANTS) {

        function beforeSubmit(context) {

            if (context.type == context.UserEventType.DELETE) {
                return;
            }

            try {
                var currentRecord = context.newRecord;

                //in caso di nuovo caso questo è vuoto
                var caseNumber = currentRecord.getValue({ fieldId: 'casenumber' });

                var company = currentRecord.getValue({ fieldId: 'company' });
                var createdDate = currentRecord.getValue('custevent_sel_case_date_created');

                if (createdDate && createdDate < new Date('1/18/2022')) {

                    if (company == CONSTANTS.COMPANY_5_SELERANT) {
                        company = currentRecord.getValue('custevent_cas_open_for');
                    }
                }

                var productLine = currentRecord.getValue({ fieldId: 'custevent_cas_prod_line' });

                var lookup = search.lookupFields({
                    type: 'entity',
                    id: company,
                    columns: [
                        'custentity_sel_support_team',
                        'altname'
                    ]
                });

                var companyname = lookup.altname;

                if (!lookup.custentity_sel_support_team || lookup.custentity_sel_support_team == '' && (productLine == CONSTANTS.PRODUCT_LINE.DEVEX || (!productLine && company != CONSTANTS.COMPANY_BASELINE))) {

                    var link = maillib.getRecordLink('supportcase', currentRecord.id);

                    var mailMessage =
                        "<div>" +
                        "<div>The field <strong>Support Team</strong> need to be setted in customer support area.</div>" +
                        "</div>" +
                        "<p>Things you need to do:</p>" +
                        "<ol>" +
                        "<li>Update the support team in the customer area;</li>" +
                        "<li>Open the case at the following <b><a href='" + link + "'> link </a></b> and edit and save it;</li>" +
                        "</ol>" +
                        "<p><strong>Important Notes:</strong></p>" +
                        "<ul>" +
                        "<li>These operations will automatically update the fields that need updating;</li>" +
                        "<li>As long as these actions are not performed<strong><span style=\"text - decoration: underline;\"> you will receive notifications in place of L1;</span></strong></li>" +
                        "</ul>";

                    var pmCoordinator = currentRecord.getValue({ fieldId: 'custevent_sel_pm_coordinator' });

                    sendEmailToAddresses(currentRecord.id, {
                        emails: pmCoordinator,
                        subject: 'Action Required | Support team need to be setted in customer support area',
                        message: mailMessage,
                        case_number: caseNumber,
                        company_name: companyname
                    });

                    return false;
                }

            } catch (error) {
                log.error({
                    title: 'Send Notification UE | Error',
                    details: error + ' ' + error.message
                });
            }
        }

        function afterSubmit(context) {

            if (context.type == context.UserEventType.DELETE) {
                return;
            }

            try {
                var oldRecord = context.oldRecord;

                var oldCategory = null;
                var oldUpdateN = null;
                var oldExpectedCloseDate = null;
                var oldExpectedBehaviour = null;
                var oldWorkaround = null;
                var oldCaseReplicable = null;
                var oldReferenceSysAvailability = null;
                var oldAssigneeL2 = null;
                var oldAssigneeL3 = null;
                var oldStatus = null;
                var oldCaseEmail = null;
                var oldPlannedInVersion = null;

                if (oldRecord) {
                    oldCategory = +oldRecord.getValue({ fieldId: 'category' });
                    oldUpdateN = oldRecord.getValue({ fieldId: 'custevent_sel_update_n' });
                    oldExpectedCloseDate = oldRecord.getValue({ fieldId: 'custevent_cas_expected_close_date' });
                    oldExpectedBehaviour = oldRecord.getValue({ fieldId: 'custevent_sel_expected_behaviour_status' });
                    oldWorkaround = oldRecord.getValue({ fieldId: 'custevent_sel_exists_workarount' });
                    oldCaseReplicable = oldRecord.getValue({ fieldId: 'custevent_sel_is_case_replicable' });
                    oldReferenceSysAvailability = oldRecord.getValue({ fieldId: 'custevent_ref_sys_availab' });
                    oldAssigneeL2 = oldRecord.getValue({ fieldId: 'custevent_assign_to_l2' });
                    oldAssigneeL3 = oldRecord.getValue({ fieldId: 'custevent_assign_to_l3' });
                    oldStatus = +oldRecord.getValue({ fieldId: 'status' });
                    oldCaseEmail = oldRecord.getValue({ fieldId: 'email' });
                    oldPlannedInVersion = oldRecord.getValue({ fieldId: 'custeventcustevent_case_plan_ver' });
                }

                var currentRecord = context.newRecord;

                //recupero le informazioni che non sono disponibili nel current record 

                var companyname = null;
                var caseNumber = null;
                var plannedInVersionText = null;

                if (context.type == 'create') {
                    var lookup = search.lookupFields({
                        type: 'supportcase',
                        id: currentRecord.id,
                        columns: [
                            'company',
                            'casenumber',
                            'custeventcustevent_case_plan_ver'
                        ]
                    });

                    companyname = lookup.company[0].text;
                    caseNumber = lookup.casenumber;
                    plannedInVersionText = lookup.custeventcustevent_case_plan_ver[0].text
                }
                else {
                    companyname = currentRecord.getValue({ fieldId: 'companyname' });
                    caseNumber = currentRecord.getValue({ fieldId: 'casenumber' });
                    newPlannedInVersionText = currentRecord.getText({ fieldId: 'custeventcustevent_case_plan_ver' });
                }

                var internalCase = currentRecord.getValue({ fieldId: 'custevent_case_internal_case' });

                var projectManager = currentRecord.getValue({ fieldId: 'custevent_custom_proj_manager' });
                var accountManager = currentRecord.getValue({ fieldId: 'custevent_sel_cust_acc_manager' });
                var pmCoordinator = currentRecord.getValue({ fieldId: 'custevent_sel_pm_coordinator' });

                var recipient = projectManager || pmCoordinator;

                var company = currentRecord.getValue({ fieldId: 'company' });

                var createdDate = currentRecord.getValue('custevent_sel_case_date_created');

                if (createdDate && createdDate < new Date('1/18/2022')) {

                    if (company == CONSTANTS.COMPANY_5_SELERANT) {
                        company = currentRecord.getValue('custevent_cas_open_for');
                    }
                }

                var assigneeL1 = currentRecord.getValue({ fieldId: 'assigned' });
                var assigneeL2 = currentRecord.getValue({ fieldId: 'custevent_assign_to_l2' });
                var assigneeL3 = currentRecord.getValue({ fieldId: 'custevent_assign_to_l3' });

                var phase = +currentRecord.getValue({ fieldId: 'custevent_cas_phase' });

                var category = +currentRecord.getValue({ fieldId: 'category' });
                var status = +currentRecord.getValue({ fieldId: 'status' });
                var caseEmail = currentRecord.getValue({ fieldId: 'email' });

                var caseCreatorEmail = currentRecord.getValue({ fieldId: 'custevent_case_creator_mail' });

                var plannedInVersion = currentRecord.getValue({ fieldId: 'custeventcustevent_case_plan_ver' });
                var foundInVersion = currentRecord.getValue({ fieldId: 'custevent_cas_found_in_ver' });

                var severity = currentRecord.getValue({ fieldId: 'custevent_sel_severity' });
                var priority = currentRecord.getValue({ fieldId: 'priority' });

                var updateN = currentRecord.getValue({ fieldId: 'custevent_sel_update_n' });

                var expectedCloseDate = currentRecord.getValue({ fieldId: 'custevent_cas_expected_close_date' });

                var expectedBehaviour = currentRecord.getValue({ fieldId: 'custevent_sel_expected_behaviour_status' });

                var workaround = currentRecord.getValue({ fieldId: 'custevent_sel_exists_workarount' });

                var caseReplicable = currentRecord.getValue({ fieldId: 'custevent_sel_is_case_replicable' });

                var referenceSysAvailability = currentRecord.getValue({ fieldId: 'custevent_ref_sys_availab' });

                var applicationMaintenance = currentRecord.getValue({ fieldId: 'custevent_sel_application_maintenance' });
                var standardMaintenance = currentRecord.getValue({ fieldId: 'custevent_sel_standard_maintenance' });

                var productLine = currentRecord.getValue({ fieldId: 'custevent_cas_prod_line' });

                var mailCaseInfos = "";
                if (context.type != context.UserEventType.CREATE) {
                    mailCaseInfos = getMailCaseInfos(currentRecord);
                }

                // ****************************
                //* PROJECT MANAGER NOT FOUND *
                // ****************************

                if (!projectManager &&
                    (productLine == CONSTANTS.PRODUCT_LINE.DEVEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX_CLOUD ||
                        (!productLine && company != CONSTANTS.COMPANY_BASELINE))) {

                    log.error({
                        title: 'Send Notification UE | Cannot send email',
                        details: 'Customer Project Manager Manager not found'
                    });

                    sendEmailToAddresses(currentRecord.id, {
                        emails: pmCoordinator,
                        subject: 'Action Required | Customer Project Manager not found in Customer registry',
                        message: 'Customer Project Manager needs to be set ' +
                            'in the customer area to be notified for case management, please ' +
                            'provide to set them as soon as possible',
                        case_number: caseNumber,
                        company_name: companyname
                    });
                }

                // ****************************
                //* ACCOUNT MANAGER NOT FOUND *
                // ****************************

                if (!accountManager &&
                    (productLine == CONSTANTS.PRODUCT_LINE.DEVEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX_CLOUD ||
                        (!productLine && company != CONSTANTS.COMPANY_BASELINE))) {

                    log.error({
                        title: 'Send Notification UE | Cannot send email',
                        details: 'Customer Customer Account Manager not found'
                    });

                    sendEmailToAddresses(currentRecord.id, {
                        emails: pmCoordinator,
                        subject: 'Action Required | Customer Account Manager not found in Customer registry',
                        message: 'Customer Account Manager needs to be set ' +
                            'in the customer area to be notified for case management, please ' +
                            'provide to set them as soon as possible',
                        case_number: caseNumber,
                        company_name: companyname
                    });
                }

                // ***************************
                //* PM COORDINATOR NOT FOUND *
                // ***************************

                if (!pmCoordinator &&
                    (productLine == CONSTANTS.PRODUCT_LINE.DEVEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX ||
                        productLine == CONSTANTS.PRODUCT_LINE.HAZEX_CLOUD ||
                        (!productLine && company != CONSTANTS.COMPANY_BASELINE))) {

                    log.error({
                        title: 'Send Notification UE | Cannot send email',
                        details: 'Customer pm coordinator Manager not found'
                    });

                    sendEMailToGroup(currentRecord.id, {
                        groupId: CONSTANTS.PMO_GROUP,
                        subject: 'Action Required | Customer PM Coordinator not found in Customer registry',
                        message: 'Customer PM Coordinator needs to be set ' +
                            'in the customer area to be notified for case management, please ' +
                            'provide to set them as soon as possible',
                        case_number: caseNumber,
                        company_name: companyname
                    });
                }

                // *******************
                //* CREATE MODE ONLY *
                // *******************

                if (context.type == context.UserEventType.CREATE) {

                    if (internalCase) {

                        if (assigneeL1) {

                            var message = '<p>Internal Case has been created.</p>' +
                                '<div>' +
                                '<div>Please follow the instructions below:</div>' +
                                '</div>' +
                                '<ol>' +
                                '<li>Assign case to L2 to analyze and identify case type and check on L2 case type final setting</li>' +
                                '<li>Assign Identified Case to L3 for resolution and monitor case status progress</li>' +
                                '<li>Close Case after PS Review has been successful.</li>' +
                                '<li>If case is going to be installed on different release set the Case Status on &ldquo;Planned on Different Release</li>' +
                                '</ol>';

                            var subject = 'Action required | Instructions for new internal case';

                            if (company == CONSTANTS.COMPANY_BASELINE) {
                                message = '<p>Internal Baseline Case has been created.</p>';
                                subject = 'Action required | Instructions for new internal case';
                            }

                            message += '<br><br><br>' + mailCaseInfos;

                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL1,
                                subject: subject,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                    } else {

                        if (assigneeL1) {

                            var message = '<p><span style="font-weight: 400;">Case has been created, customer has been notified. </span></p>' +
                                '<p><span style="font-weight: 400;">Please follow the instructions below:&nbsp;</span></p>' +
                                '<ol>' +
                                '<li><span style="font-weight: 400;">Answer Customer within SLA IRT (initial response time) and supervise SLA CAT (corrective action time) in relation to Severity Value, ' +
                                'monitoring Resolution Department though automatic notifications on status progress. See SLAs in the case form.&nbsp;</span></li>' +
                                '<li><span style="font-weight: 400;">Assign case to L2 to analyze and identify case type and check on L2 case type final setting.&nbsp;</span></li>' +
                                '<li><span style="font-weight: 400;">Assign Identified Case to L3 for resolution and monitor case status progress&nbsp;</span></li>' +
                                '<li><span style="font-weight: 400;">Close Case after Customer Review and PS Review has been successful.</span></li>' +
                                '</ol>';

                            message += '<br><br><br>' + mailCaseInfos;

                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL1,
                                subject: 'Action required | Instructions for new case',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }

                    // ***************
                    //* ASSIGN TO L2 *
                    // ***************   
                    if (assigneeL2) {

                        var message = 'Please provide Case Identification, when done set Case Type Accordingly.';
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: assigneeL2,
                            subject: 'Action required | Please provide case identification',
                            message: message,
                            case_number: caseNumber
                        });
                    }

                    // ***************
                    //* ASSIGN TO L3 *
                    // ***************         
                    if (assigneeL3) {

                        var message = 'A case is assigned to your L3 Group. Please provide necessary actions.';
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEMailToGroup(currentRecord.id, {
                            groupId: assigneeL3,
                            subject: 'Action required | A case is assigned to your L3 Group',
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }
                }

                // *****************
                //* EDIT MODE ONLY *
                // *****************

                if (context.type == context.UserEventType.EDIT) {

                    // ***************
                    //* ASSIGN TO L2 *
                    // ***************   
                    if (assigneeL2 && assigneeL2 != '' && assigneeL2 != oldAssigneeL2) {

                        var message = 'Please provide Case Identification, when done set Case Type Accordingly.';
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: assigneeL2,
                            subject: 'Action required | Please provide case identification',
                            message: message,
                            case_number: caseNumber
                        });
                    }

                    // ***************
                    //* ASSIGN TO L3 *
                    // ***************         
                    if (assigneeL3 && assigneeL3 != '' && assigneeL3 != oldAssigneeL3) {

                        var message = 'A case is assigned to your L3 Group. Please provide necessary actions.';
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEMailToGroup(currentRecord.id, {
                            groupId: assigneeL3,
                            subject: 'Action required | A case is assigned to your L3 Group',
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }

                    // ************
                    //* CASE TYPE *
                    // ************                
                    if (category && category != '' && category != oldCategory) {

                        var notificaL1Base = true;

                        if (!internalCase) {

                            if (category != CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST && category != CONSTANTS.CASE_TYPES.SPR_CORE_BUG) {

                                if (applicationMaintenance) {

                                    if (accountManager) {

                                        var message = 'Support needs your approval to proceed with the case. <br/>Please Set the correspondent value (approved/not approved) on Case Status in the Case Form to move on with the process, L1 will be notified automatically.';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEmailToAddresses(currentRecord.id, {
                                            emails: accountManager,
                                            subject: 'Action required | Support need your approval',
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                    }

                                    if (assigneeL1) {

                                        var message = 'Account Manager has been notified, wait for his/her approval.';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEMailToGroup(currentRecord.id, {
                                            groupId: assigneeL1,
                                            subject: 'Waiting AM approval',
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                        notificaL1Base = false;
                                    }

                                    currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.UNDER_APPROVAL });

                                } else {

                                    if (accountManager) {

                                        var message = 'Support needs your consultation to proceed with the case.';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEmailToAddresses(currentRecord.id, {
                                            emails: accountManager,
                                            subject: 'Action Required | Support needs your consultation to proceed with the case',
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });

                                        dialog.alert({
                                            title: 'Message:',
                                            message: 'Application Maintenance is false. <br/>Account Manager has been notified for consultation, wait for his response before responding to customer”'
                                        });

                                    }
                                }
                            }

                            if (category == CONSTANTS.CASE_TYPES.SPR_CORE_BUG) {

                                if (standardMaintenance) {

                                    if (severity == CONSTANTS.SEVERITY.HIGH_IMPACT) {

                                        var dialogMessage = "<p><span>Action Required:</span></p>" +
                                            "<p><span>Answer Customer in max 1 hour window or by SLA IRT (initial response time) if present and provide customer " +
                                            "with resolution within max 4 hour window or by SLA CAT (corrective action time) as indicated in the Incident Information Section. </span></p>" +
                                            "<p><span>Case has been already notified to L3 Devex Support Team &ndash; CORE BUGS for case resolution</span></p>";

                                        currentRecord.setValue({ fieldId: 'custevent_assign_to_l3', value: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG });

                                        var message = 'A core bug case Severity 1 has been opened, please provide Support L1 with resolution in max 4 hour window or within SLA CAT as show in case form.';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEMailToGroup(currentRecord.id, {
                                            groupId: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG,
                                            subject: 'Action Required | A core bug case Severity 1 has been opened',
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });

                                        dialog.alert({
                                            title: 'Message:',
                                            message: dialogMessage
                                        });

                                        dialogMessage += '<br><br><br>' + mailCaseInfos;

                                        if (assigneeL1) {
                                            sendEMailToGroup(currentRecord.id, {
                                                groupId: assigneeL1,
                                                subject: 'Action required | Severity of case is 1 - High Impact',
                                                message: dialogMessage,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });
                                            notificaL1Base = false;
                                        }

                                    } else if (severity == CONSTANTS.SEVERITY.MEDIUM_IMPACT) {

                                        var message = "<p><span>Action Required:</span></p>" +
                                            "<p><span>Answer Customer in max 4 hour window or by SLA IRT (initial response time) if present and provide customer " +
                                            "with workaround. </span></p>" +
                                            "<p><span>Case has been already notified to L3 Devex Support Team &ndash; CORE BUGS for workaround</span></p>";

                                        currentRecord.setValue({ fieldId: 'custevent_assign_to_l3', value: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG });

                                        var L3Message = "<p><span>A core bug case Severity 2 has been opened.</span></p>" +
                                            "<p><span>Please provide Support L1 with workaround if present by flagging the &ldquo;is there a workaround=YES&rdquo; field in the case form.</span></p>" +
                                            "<p><span style=>L1 will be notified automatically</span></p>" +
                                            "<p><span style=>if there is no workaround please flag the option &ldquo;is there a workaround=NO&rdquo; in the case form&rdquo;, in this case AM will be notified to provide a Time Line</span></p>";

                                        L3Message += '<br><br><br>' + mailCaseInfos;

                                        sendEMailToGroup(currentRecord.id, {
                                            groupId: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG,
                                            subject: 'Action Required | A core bug case Severity 2 has been opened',
                                            message: L3Message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });

                                        dialog.alert({
                                            title: 'Message:',
                                            message: message
                                        });

                                        message += '<br><br><br>' + mailCaseInfos;

                                        if (assigneeL1) {
                                            sendEMailToGroup(currentRecord.id, {
                                                groupId: assigneeL1,
                                                subject: 'Action required | Severity of case is 2 - Medium Impact',
                                                message: message,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });
                                            notificaL1Base = false;
                                        }

                                    } else if (severity == CONSTANTS.SEVERITY.LOW_IMPACT || severity == CONSTANTS.SEVERITY.IMPROVEMENT) {

                                        var message = "<p><span>Case has been already notified to L3 Devex Support Team &ndash; CORE BUGS for workaround</span></p>";

                                        currentRecord.setValue({ fieldId: 'custevent_assign_to_l3', value: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG });

                                        var L3Message = "<p><span>A core bug case Severity " + severity + " has been opened.</span></p>" +
                                            "<p><span>Please provide Support L1 with workaround if present by flagging the &ldquo;is there a workaround=YES&rdquo; field in the case form.</span></p>" +
                                            "<p><span style=>L1 will be notified automatically</span></p>" +
                                            "<p><span style=>if there is no workaround please flag the option &ldquo;is there a workaround=NO&rdquo; in the case form&rdquo;, in this case AM will be notified to provide a Time Line</span></p>";

                                        L3Message += '<br><br><br>' + mailCaseInfos;

                                        sendEMailToGroup(currentRecord.id, {
                                            groupId: CONSTANTS.DEVEX_SUPPORT_TEAM_CORE_BUG,
                                            subject: "Action Required | A core bug case Severity " + severity + " has been opened",
                                            message: L3Message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });

                                        dialog.alert({
                                            title: 'Message:',
                                            message: message
                                        });

                                        message += '<br><br><br>' + mailCaseInfos;
                                        if (assigneeL1) {

                                            var subject = 'Severity of case is  3 - Low Impact'

                                            if (severity == CONSTANTS.SEVERITY.IMPROVEMENT) {
                                                subject = 'Severity of case is  4 - Improvement'
                                            }

                                            sendEMailToGroup(currentRecord.id, {
                                                groupId: assigneeL1,
                                                subject: subject,
                                                message: message,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            notificaL1Base = false;
                                        }
                                    }
                                }
                            }

                            if (category == CONSTANTS.CASE_TYPES.SPR_CORE_BUG || category == CONSTANTS.CASE_TYPES.SPR_BASELINE_BUG) {

                                if (!standardMaintenance) {

                                    //customer
                                    if (caseEmail) {
                                        sendEmailToAddresses(currentRecord.id, {
                                            emails: caseEmail,
                                            subject: 'Your case is not eligible for support since your Standard Maintenance Contract is not active.',
                                            message: 'Your case is not eligible for support since your Standard Maintenance Contract is not active. You will be contacted by Account Manager to manage the request',
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                    }

                                    //se il case creator è diverso dalla mail del caso stesso invio notifica pure a quell'indirizzo
                                    if (caseCreatorEmail && caseCreatorEmail != caseEmail) {
                                        sendEmailToAddresses(currentRecord.id, {
                                            emails: caseCreatorEmail,
                                            subject: 'Your case is not eligible for support since your Standard Maintenance Contract is not active.',
                                            message: 'Your case is not eligible for support since your Standard Maintenance Contract is not active. You will be contacted by Account Manager to manage the request',
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                    }

                                    if (accountManager) {

                                        var message = 'A core case has been opened by the customer, Standard Maintenance is not active, Support cannot process the case. Customer has already been notified. Please contact the customer to manage the request';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEmailToAddresses(currentRecord.id, {
                                            emails: accountManager,
                                            subject: "Action Required | A core case has been opened by the customer, Standard Maintenance is not active",
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                    }

                                    if (assigneeL1) {

                                        var message = 'Standard Maintenance not active, case is not eligible for support, AM and customer has been already notified that case will not be processed.';
                                        message += '<br><br><br>' + mailCaseInfos;

                                        sendEMailToGroup(currentRecord.id, {
                                            groupId: assigneeL1,
                                            subject: 'Standard Maintenance not active, case is not eligible for support',
                                            message: message,
                                            case_number: caseNumber,
                                            company_name: companyname
                                        });
                                        notificaL1Base = false;
                                    }

                                    currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.NOT_ELIGIBLE_FOR_SUPPORT });
                                }
                            }
                        }

                        if (category == CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST) {

                            if (projectManager) {

                                var message = 'RFE core case has been created, L1 has been told to assign the case to L3, you will be notified on every case status change';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEmailToAddresses(currentRecord.id, {
                                    emails: projectManager,
                                    subject: 'RFE core case has been created',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            if (assigneeL1) {

                                var message = 'Assign Case to an L3 Solution Management Group for evaluation. PM has been already notified and he will receive automatically status progress.';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEMailToGroup(currentRecord.id, {
                                    groupId: assigneeL1,
                                    subject: 'Action required | Assign Case to an L3 Solution Management Group for evaluation',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                                notificaL1Base = false;
                            }
                        }

                        // **************
                        //* L1 NOTIFICA DI BASE AL CAMBIO DI TIPO *
                        // **************     

                        //mando la notifica a L1 a qualsiasi cambio di tipo di caso se non è disabilitata dalle notifiche precedenti
                        if (assigneeL1 && notificaL1Base) {

                            var message = 'Case type has been identified, please assign case to L3 for resolution, you will be notified at every status progress.';
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL1,
                                subject: 'Action required | Please assign case to L3 for resolution',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }

                    // **************
                    //* CASE STATUS *
                    // **************      
                    //aggiorno ad ogni cambio di stato        
                    if (status && status != '' && status != oldStatus) {

                        var newStatusTxt = currentRecord.getText({ fieldId: 'status' });
                        var oldStatusTxt = oldRecord.getText({ fieldId: 'status' });

                        var subject = null;
                        var message = null;
                        if (newStatusTxt && oldStatusTxt) {

                            subject = 'Case Status has been changed from ' + oldStatusTxt + ' to ' + newStatusTxt;
                            message = 'The status of the case has been changed from ' + oldStatusTxt + ' to ' + newStatusTxt;

                        } else {

                            subject = 'Case Status has been changed';
                            message = 'The status of the case has been changed.';

                        }

                        if (assigneeL1) {
                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL1,
                                subject: subject,
                                message: message + '<br><br><br>' + mailCaseInfos,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                        if (internalCase) {

                            //NOTA probabile restrizione per EHS

                            if (projectManager) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: projectManager,
                                    subject: subject,
                                    message: message + '<br><br><br>' + mailCaseInfos,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                        } else {

                            if (accountManager) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: accountManager,
                                    subject: subject,
                                    message: message + '<br><br><br>' + mailCaseInfos,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            //customer
                            if (caseEmail) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: caseEmail,
                                    subject: subject,
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            //se il case creator è diverso dalla mail del caso stesso invio notifica pure a quell'indirizzo
                            if (caseCreatorEmail && caseCreatorEmail != caseEmail) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: caseCreatorEmail,
                                    subject: subject,
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }

                        if (status == CONSTANTS.APPROVED) {
                            if (assigneeL1) {

                                var message = 'Case Approved. Assign case to L3 for resolution. You will be notified at every status change and you are in charge of the correct case closure.';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEMailToGroup(currentRecord.id, {
                                    groupId: assigneeL1,
                                    subject: 'Action Required | Case Approved. Assign case to L3 for resolution',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }

                        if (status == CONSTANTS.NOT_APPROVED) {
                            //customer
                            if (caseEmail) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: caseEmail,
                                    subject: 'Case was not approved - please contact Account Manager for details',
                                    message: 'Case was not approved - please contact Account Manager for details',
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            //se il case creator è diverso dalla mail del caso stesso invio notifica pure a quell'indirizzo
                            if (caseCreatorEmail && caseCreatorEmail != caseEmail) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: caseCreatorEmail,
                                    subject: 'Case was not approved - please contact Account Manager for details',
                                    message: 'Case was not approved - please contact Account Manager for details',
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }

                        if (status == CONSTANTS.CASE_STATUSES.ASSIGNED_TO_REGULATORY && assigneeL3 == CONSTANTS.EHS_REGULATORY_GROUP) {

                            var message = 'A Regulatory Case has been opened by EHS Support please provide for resolution.';
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL3,
                                subject: 'Action Required | A Regulatory Case has been opened ',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }


                    if (recipient) {

                        // ***********
                        //* UPDATE N *
                        // ***********

                        if (updateN !== oldUpdateN) {

                            var message = 'Update Number has been set in the case ' + caseNumber;
                            message += '<br><br><br>' + mailCaseInfos;


                            sendEmailToAddresses(currentRecord.id, {
                                emails: projectManager,
                                subject: 'Update Number has been set in the case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }
                }


                // **********************
                //* EXPECTED CLOSE DATE *
                // **********************

                if (expectedCloseDate) {

                    if (oldExpectedCloseDate) {

                        if (expectedCloseDate.getTime() != oldExpectedCloseDate.getTime()) {
                            var message = 'Field EXPECTED CLOSE DATE has been changed from ' + formatDate({ date: oldExpectedCloseDate }) + ' to ' + formatDate({ date: expectedCloseDate }) + ' on case ' + caseNumber;
                            message += '<br><br><br>' + mailCaseInfos;

                            if (projectManager) {
                                sendEmailToAddresses(currentRecord.id, {
                                    emails: projectManager,
                                    subject: 'Field EXPECTED CLOSE DATE has been changed on a case' + caseNumber,
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            } else if (pmCoordinator) {

                                sendEmailToAddresses(currentRecord.id, {
                                    emails: pmCoordinator,
                                    subject: 'Field EXPECTED CLOSE DATE has been changed on a case' + caseNumber,
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            sendEmailToAddresses(currentRecord.id, {
                                emails: CONSTANTS.CASE_PLANNING_DEVEX,
                                subject: 'Field EXPECTED CLOSE DATE has been changed on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }
                    else {

                        var message = 'Field EXPECTED CLOSE DATE has been setted to ' + formatDate({ date: expectedCloseDate }) + ' on case ' + caseNumber;
                        message += '<br><br><br>' + mailCaseInfos;

                        if (projectManager) {
                            sendEmailToAddresses(currentRecord.id, {
                                emails: projectManager,
                                subject: 'Field EXPECTED CLOSE DATE has been setted on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        } else if (pmCoordinator) {

                            sendEmailToAddresses(currentRecord.id, {
                                emails: pmCoordinator,
                                subject: 'Field EXPECTED CLOSE DATE has been setted on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                        sendEmailToAddresses(currentRecord.id, {
                            emails: CONSTANTS.CASE_PLANNING_DEVEX,
                            subject: 'Field EXPECTED CLOSE DATE has been setted on a case' + caseNumber,
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }
                }
                else {
                    //vuol dire che c'era un valore nelle expected e che è stato rimosso
                    if (oldExpectedCloseDate) {

                        var message = 'Field EXPECTED CLOSE DATE has been deleted. Old value was: ' + formatDate({ date: oldExpectedCloseDate }) + ' on case ' + caseNumber;
                        message += '<br><br><br>' + mailCaseInfos;

                        if (projectManager) {
                            sendEmailToAddresses(currentRecord.id, {
                                emails: projectManager,
                                subject: 'Field EXPECTED CLOSE DATE has been deleted on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        } else if (pmCoordinator) {

                            sendEmailToAddresses(currentRecord.id, {
                                emails: pmCoordinator,
                                subject: 'Field EXPECTED CLOSE DATE has been deleted on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                        sendEmailToAddresses(currentRecord.id, {
                            emails: CONSTANTS.CASE_PLANNING_DEVEX,
                            subject: 'Field EXPECTED CLOSE DATE has been deleted on a case' + caseNumber,
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }
                }

                // *********************************
                //* PHASE MAINTENANCE/SUPPORT ONLY *
                // *********************************
                if (phase == CONSTANTS.CASE_PHASES.MAINTENANCE_SUPPORT) {

                    // *********************
                    //* EXPECTED BEHAVIOUR *
                    // *********************
                    if (expectedBehaviour && expectedBehaviour != '' && expectedBehaviour != oldExpectedBehaviour) {

                        if (accountManager) {
                            if (expectedBehaviour == CONSTANTS.EXPECTED_BEHAVIOUR.YES) {

                                var message = 'Case has expected behaviour, support is providing customer with information.';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEmailToAddresses(currentRecord.id, {
                                    emails: accountManager,
                                    subject: 'Action required | Case has expected behaviour',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            } else if (expectedBehaviour == CONSTANTS.EXPECTED_BEHAVIOUR.NO) {

                                var message = 'Case has not an expected behaviour, needs to be analyzed deeper by technical support or engineering, ' +
                                    'please supervise the case.';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEmailToAddresses(currentRecord.id, {
                                    emails: accountManager,
                                    subject: 'Action required | Case has not an expected behaviour',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }
                    }

                    // *************
                    //* WORKAROUND *
                    // *************                
                    if (workaround && workaround != '' && workaround != oldWorkaround) {

                        if (workaround == CONSTANTS.WORKAROUND.YES) {

                            if (assigneeL1) {

                                var message = 'Case has a workaround, please provide implementation and respond to customer';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEMailToGroup(currentRecord.id, {
                                    groupId: assigneeL1,
                                    subject: 'Action Required | Case has a workaround, please provide implementation and respond to customer',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                        } else if (workaround == CONSTANTS.WORKAROUND.NO) {

                            if (accountManager) {

                                var message = 'Case has not a workaround, please provide support with a time-line.';
                                message += '<br><br><br>' + mailCaseInfos;


                                sendEmailToAddresses(currentRecord.id, {
                                    emails: accountManager,
                                    subject: 'Action required | Case has not a workaround',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                            if (assigneeL1) {

                                var message = 'Case has no workaround, Wait for a Time-line from Account Manager before answering to customer, then assign case (if core bug) with Time-Line to Devex Support - Core Bugs by setting assign to L3 correspondent value';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEMailToGroup(currentRecord.id, {
                                    groupId: assigneeL1,
                                    subject: 'Case has no workaround, Wait for a Time-line from Account Manager before answering to customer',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }

                        }
                    }


                    // ******************
                    //* CASE REPLICABLE *
                    // ******************                
                    if (caseReplicable && caseReplicable != '' && caseReplicable != oldCaseReplicable) {

                        if (caseReplicable == CONSTANTS.CASE_REPLICABLE.NO) {
                            if (accountManager) {

                                var message = 'Case is not replicable, support is asking customer more information, ' +
                                    'case needs your supervision to make sure all information needed are given from customer to solve the case';
                                message += '<br><br><br>' + mailCaseInfos;

                                sendEmailToAddresses(currentRecord.id, {
                                    emails: accountManager,
                                    subject: 'Action required | Case is not replicable',
                                    message: message,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }
                    }

                    // ********************************
                    //* REFERENCE SYSTEM AVAILABILITY *
                    // ********************************  
                    if (!referenceSysAvailability || referenceSysAvailability == '' ||
                        (referenceSysAvailability != oldReferenceSysAvailability && referenceSysAvailability == CONSTANTS.REFERENCE_SYSTEM_AVAILABILITY.NOT_AVAILABLE)) {

                        if (assigneeL1) {

                            var message = 'Reference system to replicate the case is missing, please ask it to customer with the help of Account Manager.' +
                                'Account Manager has already been notified';
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEMailToGroup(currentRecord.id, {
                                emails: assigneeL1,
                                subject: 'Reference system to replicate the case is missing',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                        if (accountManager) {

                            var message = 'Reference system to replicate the case is missing, your support is needed to move on with the case';
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEmailToAddresses(currentRecord.id, {
                                emails: accountManager,
                                subject: 'Reference system to replicate the case is missing',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }
                }

                // *********************
                //* PLANNED IN VERSION *
                // *********************


                if (plannedInVersion && plannedInVersion != '') {

                    if (oldPlannedInVersion && oldPlannedInVersion != '') {

                        if (plannedInVersion != oldPlannedInVersion) {

                            var plannedInVersionText = currentRecord.getText({ fieldId: 'custeventcustevent_case_plan_ver' });
                            var oldPlannedInVersionText = oldRecord.getText({ fieldId: 'custeventcustevent_case_plan_ver' });

                            var message = 'Field PLANNED IN VERSION has been changed from ' + oldPlannedInVersionText + ' to ' + plannedInVersionText + ' on case ' + caseNumber;
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEmailToAddresses(currentRecord.id, {
                                emails: CONSTANTS.CASE_PLANNING_DEVEX,
                                subject: 'Field  PLANNED IN VERSION has been changed on a case' + caseNumber,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }
                    else {

                        if (context.type == context.UserEventType.EDIT && !plannedInVersionText) {
                            plannedInVersionText = currentRecord.getText({ fieldId: 'custeventcustevent_case_plan_ver' });
                        }

                        var message = 'Field  PLANNED IN VERSION has been setted to ' + plannedInVersionText + ' on case ' + caseNumber;
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: CONSTANTS.CASE_PLANNING_DEVEX,
                            subject: 'Field PLANNED IN VERSION has been setted on a case' + caseNumber,
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });

                    }
                }
                else {

                    //se c'è un progretto in corso
                    if (phase && phase != CONSTANTS.CASE_PHASES.MAINTENANCE_SUPPORT) {

                        if (recipient) {

                            if (category == CONSTANTS.CASE_TYPES.CORE_ISSUE_TBD ||
                                category == CONSTANTS.CASE_TYPES.BASELINE_ISSUE_TBD ||
                                category == CONSTANTS.CASE_TYPES.SPR_CORE_BUG ||
                                category == CONSTANTS.CASE_TYPES.RFI_BASELINE) {

                                if (priority == CONSTANTS.PRIORITY.HIGH_IMPACT_ON_PROJECT_IMPLEMENTATION ||
                                    priority == CONSTANTS.PRIORITY.MEDIUM_IMPACT_ON_PROJECT_IMPLEMENTATION ||
                                    priority == CONSTANTS.PRIORITY.LOW_IMPACT_ON_PROJECT_IMPLEMENTATION ||
                                    priority == CONSTANTS.PRIORITY.IMPROVEMENT) {

                                    var message = 'Field PLANNED IN VERSION must be set.';
                                    message += '<br><br><br>' + mailCaseInfos;

                                    sendEmailToAddresses(currentRecord.id, {
                                        emails: recipient,
                                        subject: 'Planned in version field require to be set',
                                        message: message,
                                        case_number: caseNumber,
                                        company_name: companyname
                                    });
                                }
                            }
                        }
                    }

                    //vuol dire che è stato rimossa la planned in version
                    if (oldPlannedInVersion && oldPlannedInVersion != '') {

                        var message = 'Field  PLANNED IN VERSION has been deleted on case ' + caseNumber;
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: CONSTANTS.CASE_PLANNING_DEVEX,
                            subject: 'Field PLANNED IN VERSION has been deleted on a case' + caseNumber,
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }

                }

                // *******************
                //* FOUND IN VERSION *
                // *******************

                if (!foundInVersion || foundInVersion == '') {

                    if (productLine != CONSTANTS.PRODUCT_LINE.EHS &&
                        productLine != CONSTANTS.PRODUCT_LINE.HAZEX_CLOUD) {

                        var message = 'Please provide details on the version in which the problem has been found, ' +
                            'this is necessary information to move the case forward';
                        var subject = 'Action required | Version details needed on case';

                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: recipient,
                            subject: subject,
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });

                        if (assigneeL1) {
                            sendEMailToGroup(currentRecord.id, {
                                groupId: assigneeL1,
                                subject: subject,
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }
                }

                if (recipient) {

                    // ***********
                    //* CORE BUG *
                    // ***********

                    //se è un core bug e se è diverso dallo stato precedente
                    if (category === CONSTANTS.CASE_TYPES.SPR_CORE_BUG && oldCategory !== category) {

                        var message = "New core bug case has been identified, with severity " + severity +
                            " or Priority " + priority + ", " +
                            "please supervise and plan the resolution process with engineering by setting the Planned in Version Field." +
                            "Once the field Update n° will be filled in, you will be notified and you can proceed with the supervision of" +
                            "the implementation made by Customer Support Teaam, you will be in charge of case closure by setting status closed" +
                            "after yours and customer validation."

                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: recipient,
                            subject: 'New core bug case has been identified',
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    }


                    // ******
                    //* RFE *
                    // ******

                    if (category == CONSTANTS.CASE_TYPES.RFE_BASELINE_CHANGE_REQUEST ||
                        category == CONSTANTS.CASE_TYPES.RFE_TBD ||
                        category == CONSTANTS.CASE_TYPES.RFE_BUG) {

                        var message = "Case is RFE not core, please manage the case assigning it to the right resolution team using the L3 assign to field.";
                        message += '<br><br><br>' + mailCaseInfos;

                        sendEmailToAddresses(currentRecord.id, {
                            emails: recipient,
                            subject: 'Action Required | Case is RFE not core',
                            message: message,
                            case_number: caseNumber,
                            company_name: companyname
                        });
                    } else if (category == CONSTANTS.CASE_TYPES.RFE_CORE_CHANGE_REQUEST) {

                        if (accountManager) {

                            var message = "Case is RFE core but not a bug";
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEmailToAddresses(currentRecord.id, {
                                emails: accountManager,
                                subject: 'Case is RFE core but not a bug',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }

                        if (assigneeL1) {

                            var message = "Case is RFE core but not a bug, consult Account Manager before responding to customer. Account Manager has already been notified";
                            message += '<br><br><br>' + mailCaseInfos;

                            sendEmailToAddresses(currentRecord.id, {
                                emails: accountManager,
                                subject: 'Action Required | Case is RFE core but not a bug',
                                message: message,
                                case_number: caseNumber,
                                company_name: companyname
                            });
                        }
                    }

                    if (phase) {

                        if (phase != CONSTANTS.CASE_PHASES.MAINTENANCE_SUPPORT) {

                            var oldCrStatus = null;
                            var oldTiState = null;
                            if (oldRecord) {
                                oldCrStatus = oldRecord.getValue({ fieldId: 'custevent_case_tfs_cr_status' });
                                oldTiState = oldRecord.getValue({ fieldId: 'custevent_case_tfs_ti_state' });
                            }

                            var newCrStatus = currentRecord.getValue({ fieldId: 'custevent_case_tfs_cr_status' });
                            var newTiState = currentRecord.getValue({ fieldId: 'custevent_case_tfs_ti_state' });

                            if (category === CONSTANTS.CASE_TYPES.SPR_CUSTOM_BUG && newTiState && oldTiState !== newTiState) {

                                switch (newTiState) {

                                    case CONSTANTS.TI_STATUSES.NEW:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CREATED });

                                            var message = 'CR has been created, you will be notified at every CR status change';
                                            message += '<br><br><br>' + mailCaseInfos;

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Created',
                                                message: message,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.UNDER_ANALYSIS:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_ANALYSIS });

                                            var message = 'CR is under analysis, you will be notified at every CR status change';
                                            message += '<br><br><br>' + mailCaseInfos;

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under Analysis',
                                                message: message,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.DEVELOPMENT_IN_PROGRESS:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_IN_PROGRESS });

                                            var message = 'CR is under development';
                                            message += '<br><br><br>' + mailCaseInfos;

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under Development (In Progress)',
                                                message: message,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.SELERANT_TEST, CONSTANTS.TI_STATUSES.SELERANT_REVIEW:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_QC_INTERNAL_TESTING });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under QC (Internal Testing)',
                                                message: 'CR is under QC internal testing <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.TO_DEPLOY, CONSTANTS.TI_STATUSES.DEVELOPMENT_COMPLETED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_DEVELOPMENT_COMPLETED_GOING_TO_DEPLOYMENT });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Development Completed (Going to Deployment)',
                                                message: 'CR development completed - going to deployment <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.CUSTOMER_TEST:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEPLOYMENT_CUSTOMER_TESTING_PHASE });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under Deployment (Customer Testing Phase)',
                                                message: 'CR is under customer testing <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }

                                    case CONSTANTS.TI_STATUSES.UAT_FAIL:
                                        {
                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under Analysis',
                                                message: 'CR under customer testing - UAT failed - please supervise the case <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.PRODUCTION:
                                        {
                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Under Analysis',
                                                message: 'CR is in production <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TI_STATUSES.CLOSED:
                                        {
                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CUSTOM BUG - CR Closed',
                                                message: 'CR closed - please provide to close case by changing case status when the implementation in prod. passes both customer and PM approval <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    default:
                                        {
                                            break;
                                        }
                                }
                            } else if (category === CONSTANTS.CASE_TYPES.SPR_CORE_BUG && newCrStatus && oldCrStatus !== newCrStatus) {

                                switch (newCrStatus) {

                                    case CONSTANTS.TFS_CR_STATUSES.ACTIVE:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CREATED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Created',
                                                message: 'CR has been created, you will be notified at every CR status change <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.DEV_IN_PROGRESS:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_IN_PROGRESS });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Under Development (In Progress)',
                                                message: 'CR is under development <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.DEV_COMPLETED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_COMPLETED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Under Development (Completed)',
                                                message: 'CR development is completed <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.CODE_REVIEW:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_CODE_REVIEW });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Under Development (Code Review)',
                                                message: 'CR is under code review <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.QC_STAGE:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_QC_INTERNAL_TESTING });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Under QC (Internal Testing)',
                                                message: 'CR is under QC Testing <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.UX_REVIEW:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_UX_REVIEW });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Under UX Review',
                                                message: 'CR is under UX Review <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.CLOSED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CLOSED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Closed',
                                                message: 'CR is closed <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.CANCELLED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CANCELLED });

                                            var reason = currentRecord.getValue({ fieldId: 'custevent_cas_decis_reason' }); // Decision Reason

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'CORE BUG - CR Cancelled',
                                                message: 'CR is cancelled: ' + reason + '<br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    default:
                                        {
                                            break;
                                        }
                                }
                            } else if (category === CONSTANTS.CASE_TYPES.SPR_BASELINE_BUG && newCrStatus && oldCrStatus !== newCrStatus) {

                                switch (newCrStatus) {
                                    case CONSTANTS.TFS_CR_STATUSES.NEW:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CREATED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Created',
                                                message: 'CR has been created, you will be notified at every CR status change <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.APPROVED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_APPROVED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Approved',
                                                message: 'CR has been approved, you will be notified at every CR status change <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.COMMITTED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_DEVELOPMENT_IN_PROGRESS });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Under Development (In Progress) <br><br><br>' + mailCaseInfos,
                                                message: 'CR is under development',
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.TESTING:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_UNDER_QC_INTERNAL_TESTING });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Created',
                                                message: 'CR is under QC Testing <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.DONE:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CR_CLOSED });

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Closed',
                                                message: 'CR is closed <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    case CONSTANTS.TFS_CR_STATUSES.REMOVED:
                                        {
                                            currentRecord.setValue({ fieldId: 'status', value: CONSTANTS.CASE_STATUSES.CANCELLED });

                                            var reason = currentRecord.getValue({ fieldId: 'custevent_cas_decis_reason' }); // Decision Reason

                                            sendEmailToAddresses(currentRecord.id, {
                                                emails: recipient,
                                                subject: 'BASELINE BUG - CR Cancelled',
                                                message: 'CR is cancelled <br><br><br>' + mailCaseInfos,
                                                case_number: caseNumber,
                                                company_name: companyname
                                            });

                                            break;
                                        }
                                    default:
                                        {
                                            break;
                                        }
                                }
                            }
                        }
                    } else {

                        //se internal case manda mail a l1 please set phase
                        if (internalCase) {
                            if (assigneeL1) {
                                sendEMailToGroup(currentRecord.id, {
                                    groupId: assigneeL1,
                                    subject: 'Action Required | Phase not found',
                                    message: 'Please provide details about phase, this is necessary information to move the case forward <br><br><br>' + mailCaseInfos,
                                    case_number: caseNumber,
                                    company_name: companyname
                                });
                            }
                        }

                    }
                }
            } catch (error) {
                log.error({
                    title: 'Send Notification UE | Error',
                    details: error + ' ' + error.message
                });
            }
        }

        function sendEmailToAddresses(recordId, context) {
            log.debug({
                title: 'send email to address context',
                details: context
            })

            var message = context.message;

            if (recordId) {
                //link al record presente
                var link = maillib.getRecordLink('supportcase', recordId);

                if (link) {

                    if (context.case_number == 'To Be Generated') {
                        message += "<br><br> Follow the link for more infos: <a href='" + link + "'> New Case link </a>";
                    } else {
                        message += "<br><br> Follow the link for more infos: <a href='" + link + "'> " + context.case_number + "</a>";
                    }

                }

                message += "<br><br><b>IMPORTANT NOTE:</b><br>" +
                    "This message was sent to you from an automatic mailbox managed by netsuite and unattended. Do not respond to this communication.";
            }

            var subject = "NS CASE ALERT | " + context.company_name + " | " + context.case_number + " | " + context.subject;

            if (context.case_number == 'To Be Generated') {
                if (context.company_name) {
                    subject = "NS CASE ALERT | " + context.company_name + " | New Case | " + context.subject;
                }
                else {
                    subject = "NS CASE ALERT | New Case | " + context.subject;
                }
            }

            maillib.sendEmail({
                author: CONSTANTS.AUTHOR_NOREPLY_NS_CASE_ALERTS,
                mode: maillib.EMAIL_MODE.ADDRESSES,
                subject: subject,
                message: message,
                email: context.emails,
                internal: true,
            });
        }

        function sendEMailToGroup(recordId, context) {
            log.debug({
                title: 'send email to group context',
                details: context
            })

            var message = context.message;

            if (recordId) {
                //link al record presente
                var link = maillib.getRecordLink('supportcase', recordId);

                if (link) {

                    if (context.case_number == 'To Be Generated') {
                        message += "<br><br> Follow the link for more infos: <a href='" + link + "'> New Case link </a>";
                    } else {
                        message += "<br><br> Follow the link for more infos: <a href='" + link + "'>" + context.case_number + "</a>";
                    }

                }

                message += "<br><br><b>IMPORTANT NOTE:</b><br>" +
                    "This message was sent to you from an automatic mailbox managed by netsuite and unattended. Do not respond to this communication.";
            }

            var subject = "NS CASE ALERT | " + context.company_name + " | " + context.case_number + " | " + context.subject;

            if (context.case_number == 'To Be Generated') {
                if (context.company_name) {
                    subject = "NS CASE ALERT | " + context.company_name + " | New Case | " + context.subject;
                }
                else {
                    subject = "NS CASE ALERT | New Case | " + context.subject;
                }
            }

            var response = maillib.sendEmail({
                author: CONSTANTS.AUTHOR_NOREPLY_NS_CASE_ALERTS,
                mode: maillib.EMAIL_MODE.GROUP,
                id: context.groupId,
                subject: subject,
                message: message,
                email: null,
                internal: true,
            });

            //se non si è riusciti ad inviare la mail al gruppo si invia ad ogni singolo appartenente
            if (response != 200) {
                maillib.sendEmail({
                    author: CONSTANTS.AUTHOR_NOREPLY_NS_CASE_ALERTS,
                    mode: maillib.EMAIL_MODE.GROUP_ALL,
                    id: context.groupId,
                    subject: subject,
                    message: message,
                    email: null,
                    internal: true,
                });
            }
        }

        function getMailCaseInfos(currentRecord) {

            var fieldsToSend = [
                {
                    id: 'casenumber',
                    text: ''
                },
                {
                    id: 'title',
                    text: ''
                },
                {
                    id: 'company',
                    text: ''
                },
                {
                    id: 'custevent_case_internal_case',
                    text: ''
                },
                {
                    id: 'custevent_sel_case_opened_for_baseline',
                    text: ''
                },
                {
                    id: 'email',
                    text: ''
                },
                {
                    id: 'contact',
                    text: 'Main Case Contact'
                },
                {
                    id: 'custevent_case_creator_mail',
                    text: ''
                },
                {
                    id: 'assigned',
                    text: 'Assign to L1'
                },
                {
                    id: 'custevent_assign_to_l2',
                    text: 'Assign to L2'
                },
                {
                    id: 'custevent_assign_to_l3',
                    text: 'Assign to L3'
                },
                {
                    id: 'custevent_cas_prod_line',
                    text: ''
                },
                {
                    id: 'custevent_cas_assist_categ',
                    text: ''
                },
                {
                    id: 'custevent_sel_standard_maintenance',
                    text: ''
                },
                {
                    id: 'custevent_sel_application_maintenance',
                    text: ''
                },
                {
                    id: 'custevent_case_el_support_ehs_hazex_flo',
                    text: ''
                },
                {
                    id: 'custevent_cas_phase',
                    text: ''
                },
                {
                    id: 'createddate',
                    text: ''
                },
                {
                    id: 'lastmodifieddate',
                    text: ''
                },
                {
                    id: 'enddate',
                    text: ''
                },
                {
                    id: 'lastreopeneddate',
                    text: ''
                },
                {
                    text: 'Start Date',
                    fields: [
                        {
                            id: 'startdate',
                            text: ''
                        },
                        {
                            id: 'starttime',
                            text: ''
                        }
                    ]
                },
                {
                    id: 'category',
                    text: ''
                },
                {
                    id: 'custevent_sel_severity',
                    text: ''
                },
                {
                    id: 'priority',
                    text: ''
                },
                {
                    id: 'status',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_id',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_link',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_status',
                    text: ''
                },
                {
                    id: 'custevent_cas_resolv_in_version',
                    text: ''
                },
                {
                    id: 'custevent_cas_decis_reason',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_addressed_in',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_solution',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_merge_info',
                    text: ''
                },
                {
                    id: 'custevent_cas_category',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_assignee',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_priority',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_qc_assignee',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_creation_date',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_code_reviewer',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_dev_started',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_last_change',
                    text: ''
                },
                {
                    id: 'custevent_case_tfs_cr_closed_date',
                    text: ''
                },
            ];

            var html = '<table>' +
                '<tbody>' +
                '    <tr>' +
                '       <th colspan="2" style="text-align:center;  border-bottom: 1pt solid;">' +
                '           <b><h1>' +
                '                -- CASE INFOS --' +
                '            </h1></b>' +
                '        </th>' +
                '    </tr>';

            for (var i = 0; i < fieldsToSend.length; i++) {

                var htmlRow = '<tr valign="top"><td nowrap="nowrap" valign="top" width="20%"><b>';

                var text = fieldsToSend[i].text;

                var value = '';
                var fields = fieldsToSend[i].fields;

                if (fields) {
                    for (var j = 0; j < fields.length; j++) {
                        value += currentRecord.getText(fields[j].id);
                        if (j != fields.length - 1) {
                            value += ', ';
                        }
                    }
                }
                else {
                    var id = fieldsToSend[i].id;
                    value = currentRecord.getText(id);

                    if (!text && text == '') {
                        var field = currentRecord.getField({
                            fieldId: id
                        });
                        if (field) {
                            text = field.label;
                        }
                    }
                }

                htmlRow += text;
                htmlRow += '</b></td><td valign="top" width="80%">';
                htmlRow += value;
                htmlRow += '</td></tr>';

                html += htmlRow;
            }
            html += '</tbody></table>';

            return html;
        }

        function formatDate(context) {

            if (context) {
                var date = context.date;
                var timezone = context.timezone;

                if (date) {

                    if (typeof date === 'string') {
                        date = new Date(date);
                    }

                    if (!timezone || timezone == '') {
                        var companyInformation = config.load({ type: config.Type.COMPANY_INFORMATION });
                        timezone = companyInformation.getValue({ fieldId: 'timezone' });
                    }

                    return format.format({ value: date, type: format.Type.DATE, timezone: timezone });
                }
            }

            return null;

        }

        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });