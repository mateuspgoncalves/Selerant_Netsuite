/**
 * @author Bruno Belluccia
 * @version 1.0
 * @date 12/11/2021
 */

define([],

    function () {

        //------------ Casi ------------
        const COMPANY_5_SELERANT = 117;
        const COMPANY_BASELINE = 356732;
        const CASE_PLANNING_DEVEX = 322533;
        const DEVOPS_BASE_LINK = 'https://devops.selerant.com/tfs/DevEx%20Program/DevEX%20Program/_workitems/edit/';
        const DEVOPS_BASE_LINK_BASELINE = 'https://devops.selerant.com/tfs/Customer%20Projects/DevEX%20Baseline%20System/_boards/board/t/Devex%20Baseline%20System%20Team/Backlog%20items/?workitem=';
        const AUTHOR_NOREPLY_NS_CASE_ALERTS = 356688; //Case Alert Notification Employee
        const PMO_GROUP = 356689;
        const EHS_REGULATORY_GROUP = 3841;


        const DEVEX_SUPPORT_TEAM_CORE_BUG = 134;

        const CASE_STATUSES = {
            SUBMITTED: 1,
            UNDER_ANALYSIS: 2,
            ESCALATED_DEVELOPMENT: 3,
            RE_OPENED: 4,
            CLOSED: 5,
            CR_UNDER_DEVELOPMENT_IN_PROGRESS: 6,
            ON_HOLD: 7,
            WAITING_FOR_CUSTOMER_DETAILS: 8,
            DELIVERED: 9,
            CANCELLED: 10,
            ESCALATED_ON_HOLD: 11,
            IMPLEMENTATION_COMPLETED_WAITING_FOR_CUSTOMER_CONFIRMATION: 12,
            IMPLEMENTATION_COMPLETED_UNDER_PM_REVIEW: 13,
            CR_UNDER_DEPLOYMENT_UAT_PHASE: 14,
            CR_UNDER_QC_INTERNAL_TESTING: 15,
            CR_UNDER_DEPLOYMENT_CUSTOMER_TESTING_PHASE: 16,
            PREPARING_DEPLOYMENT_PACKAGE: 17,
            IMPLEMENTATION_CONFIRMED_BY_CUSTOMER: 18,
            IMPLEMENTATION_CONFIRMED_BY_PM: 19,
            CR_CREATED: 20,
            CR_CLOSED: 21,
            DEPLOYMENT_PLANNED_IN_DIFFERENT_RELEASE: 22,
            CR_UNDER_DEPLOYMENT_TECHNICAL_IMPLEMENTATION: 23,
            EXPECTED_BEHAVIOR_GIVING_INSTRUCTIONS_TO_CUSTOMER: 24,
            CR_UNDER_ANALYSIS: 26,
            CR_DEVELOPMENT_COMPLETED_GOING_TO_DEPLOYMENT: 27,
            CR_UNDER_DEVELOPMENT_COMPLETED: 28,
            CR_UNDER_DEVELOPMENT_CODE_REVIEW: 29,
            CR_UNDER_UX_REVIEW: 30,
            CR_APPROVED: 31,
            APPROVED: 32,
            NOT_APPROVED: 33,
            UNDER_APPROVAL: 34,
            NOT_ELIGIBLE_FOR_SUPPORT: 35,
            ASSIGNED_TO_REGULATORY: 36,
            REASSIGNED_TO_EHS_FOR_MORE_INFO: 37,
            REGULATORY_ANALYSIS_COMPLETED: 38
        }

        const CASE_TYPES = {
            SPAM_EHS_FROM_INBOUND_EMAIL_HELP: 36,
            TBD_TO_BE_DETERMINED: 8,
            IDEA_SUGGESTION: 11,
            CUSTOMIZATION_TBD: 32,
            CORE_ISSUE_TBD: 31,
            BASELINE_ISSUE_TBD: 33,
            RFE_TBD: 34,
            CC_TBD: 24,
            CC_REGULATORY_CASE: 17,
            CC_TECHNICAL_CASE: 18,
            EHS_TBD: 28,
            EHS_REGULATORY_CASE: 12,
            EHS_TECHNICAL_CASE: 13,
            DEVEX_TBD: 29,
            REGULATORY_DATA_ISSUE: 19,
            REGULATORY_DATA_ISSUE_COPYRIGHT_PURCHASE: 21,
            REGULATORY_DATA_ISSUE_DATA_ERROR: 22,
            REGULATORY_DATA_ISSUE_CONSULTING_SERVICE: 16,
            REGULATORY_FUNCTIONAL_ISSUE: 20,
            CHANGE_REQUEST_CUSTOM: 7,
            SPR_CORE_BUG: 1,
            SPR_CUSTOM_BUG: 2,
            SPR_BASELINE_BUG: 15,
            DATA_ERROR: 9,
            RFI_LEGISLATION: 3,
            RFI_SOFTWARE: 4,
            RFI_BASELINE: 37,
            RFE_CORE_CHANGE_REQUEST: 6,
            RFE_BASELINE_CHANGE_REQUEST: 14,
            RFE_BUG: 35,
            IT_INFRASTRUCTURE_ISSUE: 10
        }

        const CASE_PHASES = {
            DEVELOPMENT: 9,
            QC_TEST: 10,
            TI_INTERNAL_TEST: 11,
            PS_SELERANT_TEST: 13,
            CUSTOMER_TEST: 14,
            SIT: 16,
            TRAINING: 17,
            UAT: 15,
            DEPLOYMENT: 1,
            PRODUCTION: 2,
            MAINTENANCE_SUPPORT: 12,
            PILOT: 3,
            EVALUATION: 4
        }

        const CASE_ORIGINS = {
            EMAIL: 1,
            PHONE: 2,
            OTHER: 3,
            INTERNAL: 4,
            NS_INTERFACE: 5,
            WEB_FORM: -5
        }

        const PRIORITY = {
            HIGH_IMPACT_ON_PROJECT_IMPLEMENTATION: 1,
            MEDIUM_IMPACT_ON_PROJECT_IMPLEMENTATION: 2,
            LOW_IMPACT_ON_PROJECT_IMPLEMENTATION: 3,
            IMPROVEMENT: 4,
            N_A: 6,
            INSERT_PRIORITY_VALUE: 7,
            NO_VALUE: 8
        }

        const SEVERITY = {
            HIGH_IMPACT: 1,
            MEDIUM_IMPACT: 2,
            LOW_IMPACT: 3,
            IMPROVEMENT: 4,
            N_A: 5,
            NO_VALUE: 6
        }

        const SYSTEM_AVAILABILITY = {
            NOT_AVAILABLE: 1,
            PARTIALLY_AVAILABLE: 2,
            AVAILABLE: 3
        }

        const TI_STATUSES = {
            NEW: 'NEW',
            UNDER_ANALYSIS: 'UNDER ANALYSIS',
            DEVELOPMENT_IN_PROGRESS: 'DEVELOPMENT IN PROGRESS',
            SELERANT_TEST: 'SELERANT TEST',
            SELERANT_REVIEW: 'SELERANT REVIEW',
            TO_DEPLOY: 'TO DEPLOY',
            DEVELOPMENT_COMPLETED: 'DEVELOPMENT COMPLETED',
            CUSTOMER_TEST: 'CUSTOMER TEST',
            UAT_FAIL: 'UAT FAIL',
            PRODUCTION: 'PRODUCTION',
            CLOSED: 'CLOSED'
        }

        const TFS_CR_STATUSES = {
            ACTIVE: 'Active',
            APPROVED: 'Approved',
            CANCELLED: 'Cancelled',
            CLOSED: 'Closed',
            CODE_REVIEW: 'Code Review',
            COMMITTED: 'Committed',
            DEV_COMPLETED: 'Dev Completed',
            DEV_IN_PROGRESS: 'Dev In Progress',
            DONE: 'Done',
            NEW: 'New',
            QC_STAGE: 'QC Stage',
            REMOVED: 'Removed',
            TESTING: 'Testing',
            UX_REVIEW: 'UX Review'
        }

        const REFERENCE_SYSTEM_AVAILABILITY = {
            AVAILABLE: 1,
            NOT_AVAILABLE: 2,
            TO_BE_REQUESTED: 3,
            UNDER_REQUEST: 4
        }

        const CASE_ENVIRONMENTS = {
            DEVELOPMENT: 1,
            TEST_QUALITY: 2,
            PRODUCTION: 3,
            TO_BE_DEFINED: 6
        }

        const EXPECTED_BEHAVIOUR = {
            YES: 1,
            NO: 2
        }

        const WORKAROUND = {
            YES: 1,
            NO: 2
        }

        const ELIGIBLE_FOR_SUPPORT = {
            YES: 1,
            NO: 2
        }

        const CASE_REPLICABLE = {
            YES: 1,
            NO: 2
        }

        const PRODUCT_LINE = {
            DEVEX: 1,
            HAZEX: 2,
            EHS: 3,
            SCC: 4,
            RSA_SERVICES: 5,
            ECODEX: 8,
            HSM: 9,
            HAZEX_CLOUD: 10
        }
        
        const TFS_FIELDS = [
            'custevent_case_tfs_cr_creation_date',
            'custevent_case_tfs_cr_assignee',
            'custeventcustevent_cas_eng_appr',
            'custevent_cas_decis_reason',
            'custevent_case_tfs_cr_priority',
            'custevent_case_tfs_cr_status',
            'custevent_case_tfs_cr_dev_started',
            'custevent_case_tfs_cr_code_reviewer',
            'custevent_case_tfs_cr_qc_assignee',
            'custevent_case_tfs_cr_closed_date',
            'custevent_case_tfs_cr_last_change',
            'custevent_sel_update_n',
            'custevent_case_tfs_cr_addressed_in',
            'custevent_case_tfs_cr_merge_info',
            'custevent_case_tfs_cr_solution',
            'custevent_cas_test_case',
            'custevent_cas_category',
            'custevent_cas_resolv_in_version',
            'custevent_case_tfs_ti_cr_id',
            'custevent_case_tfs_ti_assignee',
            'custevent_case_tfs_ti_state',
            'custevent_case_tfs_ti_devops_url',
            'custevent_case_tfs_ti_solution_proposed',
            'custevent_case_tfs_cr_scoping',
            'custevent_cas_test_case'
        ];

        //------------ Fine Casi ------------


        return {
            AUTHOR_NOREPLY_NS_CASE_ALERTS: AUTHOR_NOREPLY_NS_CASE_ALERTS,
            TI_STATUSES: TI_STATUSES,
            TFS_CR_STATUSES: TFS_CR_STATUSES,
            CASE_STATUSES: CASE_STATUSES,
            CASE_TYPES: CASE_TYPES,
            CASE_PHASES: CASE_PHASES,
            PRIORITY: PRIORITY,
            COMPANY_5_SELERANT: COMPANY_5_SELERANT,
            EXPECTED_BEHAVIOUR: EXPECTED_BEHAVIOUR,
            WORKAROUND: WORKAROUND,
            CASE_REPLICABLE: CASE_REPLICABLE,
            DEVOPS_BASE_LINK: DEVOPS_BASE_LINK,
            REFERENCE_SYSTEM_AVAILABILITY: REFERENCE_SYSTEM_AVAILABILITY,
            CASE_ORIGINS: CASE_ORIGINS,
            CASE_ENVIRONMENTS: CASE_ENVIRONMENTS,
            SEVERITY: SEVERITY,
            SYSTEM_AVAILABILITY: SYSTEM_AVAILABILITY,
            DEVEX_SUPPORT_TEAM_CORE_BUG: DEVEX_SUPPORT_TEAM_CORE_BUG,
            PMO_GROUP: PMO_GROUP,
            ELIGIBLE_FOR_SUPPORT: ELIGIBLE_FOR_SUPPORT,
            PRODUCT_LINE: PRODUCT_LINE,
            EHS_REGULATORY_GROUP: EHS_REGULATORY_GROUP,
            COMPANY_BASELINE: COMPANY_BASELINE,
            DEVOPS_BASE_LINK_BASELINE: DEVOPS_BASE_LINK_BASELINE,
            TFS_FIELDS: TFS_FIELDS,
            CASE_PLANNING_DEVEX: CASE_PLANNING_DEVEX
        }
    });