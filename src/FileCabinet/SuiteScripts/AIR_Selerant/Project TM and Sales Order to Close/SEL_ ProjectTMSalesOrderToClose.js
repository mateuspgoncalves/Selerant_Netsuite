/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function(record, search) {

    function afterSubmit(context) {
         var currentProject = context.newRecord;
         var idProject = currentProject.getValue({fieldId: "id"});

         var selBillingType = currentProject.getValue({fieldId: "jobbillingtype"});
         var selStatus = currentProject.getValue({fieldId: "entitystatus"});

         //Il project deve essere TM e lo status del progetto in closed
         if(selBillingType == "TM" && selStatus == 1) { //Time and Materials and close
            //mi cerco gli id dei sales order associati al project
            var jobSearchObj = search.create({
                  type: "job",
                  filters:
                  [
                     ["internalid","anyof",idProject], 
                     "AND", 
                     ["transaction.type","anyof","SalesOrd"]
                  ],
                  columns:[
                     search.createColumn({
                        name: "internalid",
                        join: "transaction"
                     })
                  ]
               }).run().each(function(result){
                  // carico il record del Sales Order con il suo rispettivo id 
                  var salesOrderRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: result.getValue(result.columns[0])
                     });
                  
                  //numero di righe item
                  var numLines = salesOrderRecord.getLineCount({
                     sublistId: 'item',
                     fieldId: result.getValue(result.columns[0])
                  });

                  log.debug({
                     title: 'Numero righe item:',
                     details: numLines
                  });

                  for (var i = 0; i < numLines; i++) {

                     // e per ogni sales order associato vado a prelevarmi il valore delle colonne Invoiced e Quantity degli item che sto scorrendo
                     var valueQuantity = salesOrderRecord.getSublistValue({
                                             sublistId: "item",
                                             fieldId: "quantity",
                                             line: i});
                     var valueInvoiced = salesOrderRecord.getSublistValue({
                                             sublistId: "item",
                                             fieldId: "quantitybilled",
                                             line: i});
                     var checkClose =  salesOrderRecord.getSublistValue({
                                          sublistId: "item",
                                          fieldId: "isclosed",
                                          line: i
                                       });
                     // se invoiced e quantity sono diversi e la colonna closed non è a true, allora vado a settare a True quest'ultima e la [SEL] Closed Line
                     if(valueInvoiced != valueQuantity && !checkClose){

                        salesOrderRecord.setSublistValue({
                           sublistId: "item",
                           fieldId: "isclosed",
                           value: true,
                           line: i
                        });

                        salesOrderRecord.setSublistValue({
                           sublistId: "item",
                           fieldId: "custcol_closed_line",
                           value: true,
                           line: i
                        });

                        log.debug({
                           title: 'CLOSED?',
                           details: "Sì"
                        });
                     }

                  }
                  salesOrderRecord.save();
                  
               });
         }
      }

    return {
        afterSubmit: afterSubmit
    }
});
