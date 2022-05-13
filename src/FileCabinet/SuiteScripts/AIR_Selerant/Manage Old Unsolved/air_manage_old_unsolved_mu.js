/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Oct 2016     m.brescacin
 *
 */

var manageOldUnsolvedMU = (function() {

	// MAX: ADD
	// Oggetto modellato in base alla custom list [NExIL] Riba State
	// N.B.: sarebbe meglio utilizzare un parametro
	var RIBA_STATE = {
			SELECTED: 4,
			PRESENTED: 1,
			ACCRUED: 2,
			UNPAID: 3	
	};

	var STATO_PAGAMENTO = {
			PAGATO: 1,
			PARZIALMENTE_PAGATO: 2,
			NON_PAGATO: 3	
	};

	var METODO_PAGAMENTO = {
			RIBA: 7,
			BANK_TRANSFER: 21
	};
	// END MAX

	/**
	 * @param {String} recType Record type internal id
	 * @param {Number} recId Record internal id
	 * @returns {Void}
	 */
	function massUpdate(recType, recId) {

		// Recupero l'utente
		var currentUser = nlapiGetContext().getUser();
		var dtScriptLaunch = nlapiDateToString(new Date(), 'datetimetz');

		var customPaymentObj = nlapiLookupField(recType, recId, ['custrecord_nexil_standard_payment',
			'custrecord_nexil_installments', 
			'custrecord_nexil_invoice', 
			'custrecord_nexil_amount']);

		customPaymentObj.custrecord_nexil_amount = parseFloat(customPaymentObj.custrecord_nexil_amount);

		// Tolgo la rata
		try {
			var customerPayment = nlapiLoadRecord('customerpayment', customPaymentObj.custrecord_nexil_standard_payment);
			var applyLineCount = customerPayment.getLineItemCount('apply');
			var recalcTotalAmount = false;
			for (var i = 1; applyLineCount && i <= applyLineCount; i++) {				
				recalcTotalAmount = false;
				var currentId = customerPayment.getLineItemValue('apply', 'internalid', i);
				if (currentId == customPaymentObj.custrecord_nexil_invoice) {
					customerPayment.selectLineItem('apply', i);

					// Recupero l'apply
					var applyAmount = parseFloat(customerPayment.getCurrentLineItemValue('apply', 'amount'));
					if (isNaN(applyAmount) == true) {
						applyAmount = 0;
					}

					// Controllo l'amout
					if (applyAmount == customPaymentObj.custrecord_nexil_amount) {
						customerPayment.setCurrentLineItemValue('apply', 'apply', 'F');
						customerPayment.setCurrentLineItemValue('apply', 'amount', 0);
						recalcTotalAmount = true;

					} else if (applyAmount > customPaymentObj.custrecord_nexil_amount) {
						customerPayment.setCurrentLineItemValue('apply', 'amount', applyAmount - customPaymentObj.custrecord_nexil_amount);
						recalcTotalAmount = true;
					}

					// Ricalcolo il totale se ho disapplicato qualcosa (sia totalmente che parzialmente)
					if (recalcTotalAmount == true) {
						var totalAmount = parseFloat(customerPayment.getFieldValue('payment'));
						totalAmount -= customPaymentObj.custrecord_nexil_amount;
						customerPayment.setFieldValue('payment', totalAmount);
					}

					customerPayment.commitLineItem('apply');
					break;
				}
			}

			// Recupero il totale applicato
			var newTotalAmount = parseFloat(customerPayment.getFieldValue('payment'));
			if (isNaN(newTotalAmount) == true) {
				newTotalAmount = 0;
			}

			// Se il totale è zero
			if (newTotalAmount == 0) {
				// Rimuovo il pagamento
				nlapiDeleteRecord('customerpayment', customPaymentObj.custrecord_nexil_standard_payment);
			} else {
				// Salvo il record
				nlapiSubmitRecord(customerPayment);
			}

		} catch(e) {
			nlapiLogExecution('ERROR', 'Remove apply error', ['customerpayment', customPaymentObj.custrecord_nexil_standard_payment].join(': '));
		}

		// Aggiorno i campi della Due Date
		try {

			var dueDate = nlapiLookupField('customrecord_nexil_due_dates',
					customPaymentObj.custrecord_nexil_installments,
					['custrecord_nexil_amount_payed', 'custrecord_nexil_original_amount']);

			var originalAmount = parseFloat(dueDate.custrecord_nexil_original_amount) - customPaymentObj.custrecord_nexil_amount;
			var totalPayed =  parseFloat(dueDate.custrecord_nexil_amount_payed) - customPaymentObj.custrecord_nexil_amount;

			nlapiSubmitField('customrecord_nexil_due_dates', 
					customPaymentObj.custrecord_nexil_installments,
					['custrecord_nexil_ep_ribastate',
						'custrecord_nexil_ep_unpaid_date', 'custrecord_nexil_ep_unpaid_user',
						'custrecord_nexil_amount_payed', 'custrecord_nexil_original_amount'],
						[RIBA_STATE.UNPAID,
							dtScriptLaunch, currentUser,
							totalPayed, originalAmount
							]);

		} catch(e) {
			nlapiLogExecution('ERROR', 'Update error', ['customrecord_nexil_due_dates', customPaymentObj.custrecord_nexil_installments].join(': '));
		}

		// Creo una nuova rata
		try {

			var newDueDate = nlapiCopyRecord('customrecord_nexil_due_dates', customPaymentObj.custrecord_nexil_installments);

			newDueDate.setFieldValue('custrecord_nexil_ep_ribastate', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_idpresentation', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_idaccrual', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_idunpaid', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_due_dates_epid', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_ribapayment', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_pres_user', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_present_date', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_handling_user', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_handling_date', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_unpaid_user', null);
			newDueDate.setFieldValue('custrecord_nexil_ep_unpaid_date', null);
			newDueDate.setFieldValue('custrecord_nexil_parent_due_date', customPaymentObj.custrecord_nexil_installments);
			newDueDate.setFieldValue('custrecord_nexil_original_amount', customPaymentObj.custrecord_nexil_amount);
			newDueDate.setFieldValue('custrecord_nexil_amount_payed', 0);
			newDueDate.setFieldValue('custrecord_nexil_ep_prevmat_payed_amt', 0);
			newDueDate.setFieldValue('custrecord_naxil_status', STATO_PAGAMENTO.NON_PAGATO);
			newDueDate.setFieldValue('custrecord_aln_pagato_ial', 'F');

			var currentMethodPayment = newDueDate.getFieldValue('custrecord_nexil_payment_method');
			if (currentMethodPayment && currentMethodPayment == METODO_PAGAMENTO.RIBA) {
				newDueDate.setFieldValue('custrecord_nexil_payment_method', METODO_PAGAMENTO.BANK_TRANSFER);
			}

			nlapiSubmitRecord(newDueDate, null, null);	

		} catch(e) {
			nlapiLogExecution('ERROR', 'Create error', 'Errore: ' + e);
		}

		// Elimino il custom payment
		try {
			nlapiDeleteRecord(recType, recId);
		} catch(e) {
			nlapiLogExecution('ERROR', 'Delete error', [recType, recId].join(': '));
		}

	}

	function emulaMassUpdate(idRicercaSalvata, indirizzoDestinatario){
		
		var ricercaSalvata=nlapiLoadSearch(null, idRicercaSalvata).runSearch(),
			inizio = 0,
			completeResults = [],
			partialResults = [],
			errors=[],
			lastYieldTime = new Date().getTime(), 
			context = nlapiGetContext();

		do{
			partialResults=ricercaSalvata.getResults(inizio,inizio+1000);

			if(partialResults && partialResults.length>0){
				completeResults=completeResults.concat(partialResults);
			}
			inizio+=1000;

		} while (partialResults && partialResults.length>=1000);

		for(var i in completeResults){
			if (context.getRemainingUsage() < 1000 || (new Date().getTime() - lastYieldTime) > 300000){
				nlapiYieldScript(); 
				lastYieldTime = new Date().getTime();
			}
			
			try{
				
				massUpdate('customrecord_nexil_custom_payment', completeResults[i].getId());
				
			} catch (e) {
				errors.push({id: completeResults[i].getId(), exc: e});
				nlapiLogExecution("error",completeResults[i].getId(),e);
			}
		}

		var testoOggetto="Mass Update Terminato",
		testoCorpo="E' stato eseguito l'aggiornamento di "+completeResults.length+" su "+(completeResults.length-errors.length)+" record.";

		if(errors.length>0){
			testoCorpo+="\nI seguenti record sono andati in errore:\n"+errors.map(function(el){return el.id;}).join(",\n");
		}

		//nlapiSendEmail("44481", indirizzoDestinatario, testoOggetto, testoCorpo);

	}

	/**
	 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
	 * @returns {Void}
	 */
	function scheduledMassUpdate(type) {
		
		var context=nlapiGetContext(),
			idRicercaSalvata= context.getSetting("SCRIPT", "custscript_aln_id_ric_slvt"),
			emailDestinatario=context.getSetting("SCRIPT", "custscript_aln_email_dest");
		
		emulaMassUpdate(idRicercaSalvata, emailDestinatario);
		
	}
	
	/**
	 * Metodi esposti
	 */
	return {
		massUpdate: massUpdate,
		scheduledMassUpdate: scheduledMassUpdate
	}

})();
