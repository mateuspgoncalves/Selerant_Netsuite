/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/query', 'N/search', 'N/translation', 'N/ui/serverWidget'],
    /**
 * @param{file} file
 * @param{query} query
 * @param{search} search
 * @param{translation} translation
 * @param{serverWidget} serverWidget
 */
    (file, query, search, translation, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

        }

        return {onRequest}

    });
