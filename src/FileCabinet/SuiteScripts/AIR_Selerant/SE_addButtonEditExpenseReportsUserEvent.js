/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/ui/serverWidget', 'N/search'], function (logModule, serverWidgetModule, searchModule) {

  function beforeLoad(context) {
    var RETRIVE_DOCUMENTS_LIST_ARCHIVA_FUNCTION = function () {
      require(['N/url', 'N/currentRecord'], function () {
        try {
          var copiedId;
          var confirm = window.confirm("Vuoi fare una copia di questo record?");
          if (confirm) {
            if (!window.AIR_Boolean) {
              window.AIR_Boolean = true;
              console.log('window.AIR_Boolean: ' + window.AIR_Boolean);
              var originalRecordId = nlapiGetRecordId();
              var originalRecordType = nlapiGetRecordType();
              var oldRecord = nlapiLoadRecord(originalRecordType, originalRecordId);
              var tranidRecordToDelete = oldRecord.getFieldValue('tranid');
              console.log('tranidRecordToDelete: ' + tranidRecordToDelete);
              var newRecord = nlapiCopyRecord(originalRecordType, originalRecordId, null);
              newRecord.setFieldValue('tranid', tranidRecordToDelete + '_REOPENING');
              newRecord.setFieldValue('supervisorapproval', 'F');
              newRecord.setFieldValue('accountingapproval', 'F');
              newRecord.setFieldValue('complete', 'F');
              copiedId = nlapiSubmitRecord(newRecord);
              nlapiDeleteRecord(originalRecordType, originalRecordId);
              nlapiSubmitField(originalRecordType, copiedId, 'tranid', tranidRecordToDelete);
              var url = window.location.href;
              url = url.replace(originalRecordId, copiedId)
              url = url + '&e=T'
              window.open(url);
            }
          }
        } catch (error) {
          var errorString = JSON.stringify(error);
          if (errorString.indexOf('This transaction cannot be deleted because it is linked to by one or more transactions') > -1) {
            nlapiDeleteRecord(originalRecordType, copiedId);
            alert('This transaction cannot be deleted because it is linked to by one or more transactions!');
          }
        }
      });
    };
    if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT) {
      var customerRecord = context.newRecord;
      var supervisorapproval = customerRecord.getValue('supervisorapproval');
      var accountingapproval = customerRecord.getValue('accountingapproval');
      if (supervisorapproval && accountingapproval) {
        var form = context.form;
        form.addButton({
          id: 'custpage_aln_open_archiva_docs',
          label: 'Reopening Expense Report',
          functionName: '(' + RETRIVE_DOCUMENTS_LIST_ARCHIVA_FUNCTION.toString().replace(/"/g, '\'') + ')()'
        });
      }

    }
  }

  return {
    beforeLoad: beforeLoad
  };
});