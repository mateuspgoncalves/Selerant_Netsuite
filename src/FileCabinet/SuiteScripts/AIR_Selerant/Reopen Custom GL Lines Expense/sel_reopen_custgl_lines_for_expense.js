/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Mar 2019     f.losito
 *
 */

/** https://netsuite.custhelp.com/app/answers/detail/a_id/41499/
 * custom implementation
 * @param  {nlobjRecord} transactionRecord
 * @param  {*} standardLines
 * @param  {*} customLines
 * @param  {*} book
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

	try {
		if (transactionRecord.getFieldValue('type') == 'exprept') {
			if (transactionRecord.getFieldValue('supervisorapproval') == 'T' && transactionRecord.getFieldValue('accountingapproval') == 'T') {
				var mainData = getMainData(transactionRecord);

				if (!mainData.accCorpCard) {
					nlapiLogExecution('DEBUG',
						['no Credit Card Associated to entity: ', mainData.entity].join(' '),
						['check Expense Report: ', mainData.tranId].join(' '));
					return;
				}

				var originLinesObj = getOriginLines(mainData.allLineFields, transactionRecord);

				var standardLinesObj = getStandardLines(standardLines);

				var resultChk = reopenForCreditCard(mainData, originLinesObj, standardLinesObj, customLines);

				nlapiLogExecution('DEBUG', resultChk, JSON.stringify(mainData));
			}
		} else {
			nlapiLogExecution('DEBUG', 'no exprept', 'no implementation for ' + transactionRecord.getFieldValue('type'));
		}
	} catch (error) {
		if (error instanceof nlobjError) {
			nlapiLogExecution('DEBUG', 'customizeGlImpact Error', error.getCode() + '\n' + error.getDetails());
		} else {
			nlapiLogExecution('DEBUG', 'customizeGlImpact Error', error);
		}
	}
}

function getMainData(transactionRecord) {

	var mainData = {
		allLineFields: null,
		type: null,
		typeField: null,
		entity: null,
		subsidiary: null,
		accCorpCard: null,
		accCorpCardAux: null,
		tranId: null
	};

	mainData.allLineFields = transactionRecord.getAllLineItemFields('expense');
	mainData.type = transactionRecord.getRecordType();
	mainData.typeField = transactionRecord.getFieldValue('type');
	mainData.entity = transactionRecord.getFieldValue('entity');
	mainData.subsidiary = transactionRecord.getFieldValue('subsidiary');
	mainData.accCorpCard = transactionRecord.getFieldValue('acctcorpcardexp');
	if (!mainData.accCorpCard) {
		mainData.accCorpCard = nlapiLookupField('employee', mainData.entity, 'defaultacctcorpcardexp');
	}
	mainData.accCorpCardAux = transactionRecord.getFieldValue('auxacctcorpcardexp');
	mainData.tranId = transactionRecord.getFieldValue('tranid');
	mainData.entityName = transactionRecord.getFieldValue('entityname');

	nlapiLogExecution('DEBUG', 'getMainData', JSON.stringify(mainData));

	return mainData;

}

function getStandardLines(standardLines) {

	var standardLinesObj = {};

	for (var actLine = 0; actLine < standardLines.getCount(); actLine++) {

		standardLinesObj[actLine] = {};

		var currLine = standardLines.getLine(actLine);

		standardLinesObj[actLine] = {
			entity: currLine.getEntityId(),
			account: currLine.getAccountId(),
			creditAmount: currLine.getCreditAmount(),
			debitAmount: currLine.getDebitAmount(),
			memo: currLine.getMemo(),
			classId: currLine.getClassId(),
			department: currLine.getDepartmentId(),
			location: currLine.getLocationId(),
			subsidiaryId: currLine.getSubsidiaryId()
		};

		nlapiLogExecution('DEBUG', ['standardLines JSON', actLine].join(' '), JSON.stringify(standardLines));
		nlapiLogExecution('DEBUG', ['standardLines', actLine].join(' '), JSON.stringify(standardLinesObj[actLine]));

	}

	return standardLinesObj;

}

function getOriginLines(allLineFields, transactionRecord) {

	var originLinesObj = {};

	for (var actLine = 1; actLine <= transactionRecord.getLineItemCount('expense'); actLine++) {

		originLinesObj[actLine] = {};

		for (var nameCol in allLineFields) {

			var lineItemValue = transactionRecord.getLineItemValue('expense', allLineFields[nameCol], actLine);

			originLinesObj[actLine][allLineFields[nameCol]] = lineItemValue;

		}

		nlapiLogExecution('DEBUG', ['originLinesObj', actLine].join(' '), JSON.stringify(originLinesObj[actLine]));
	}

	return originLinesObj;

}

function reopenForCreditCard(mainData, originLinesObj, standardLinesObj, customLines) {

	var accountIdForCC = null;

	for (var line in standardLinesObj) {
		if ((mainData.entity == standardLinesObj[line].entity) &&
			(mainData.accCorpCard == standardLinesObj[line].account)) {

			var reopenLine = customLines.addNewLine();

			accountIdForCC = standardLinesObj[line].account;

			reopenLine.setEntityId(standardLinesObj[line].entity);
			reopenLine.setAccountId(accountIdForCC);
			reopenLine.setClassId(standardLinesObj[line].classId);
			//reopenLine.setCreditAmount(standardLinesObj[line].debitAmount);
			reopenLine.setDebitAmount(standardLinesObj[line].creditAmount);
			reopenLine.setDepartmentId(standardLinesObj[line].department);
			reopenLine.setLocationId(standardLinesObj[line].location);

			var customMemo = ['Recalss from', mainData.tranId].join(' ');

			reopenLine.setMemo(customMemo);

			break;
		}
	}

	for (var expense in originLinesObj) {

		if (originLinesObj[expense].corporatecreditcard == 'T') {

			var found = false;

			for (var line in standardLinesObj) {

				var memoPlusCat = '';

				if (originLinesObj[expense].memo) {
					var memoPlusCat = [originLinesObj[expense].category_display, originLinesObj[expense].memo].join(': ');
				} else {
					var memoPlusCat = originLinesObj[expense].category_display;
				}

				/*
				 *	&&(+originLinesObj[expense].amount == +standardLinesObj[line].debitAmount) 
				 *	in glImpact all the account costs was grouped
				 *	the amount for this goal is not a proper filter
				 */

				if ((standardLinesObj[line].memo) && (!found) &&
					(memoPlusCat == standardLinesObj[line].memo)) {

					var creditLine = customLines.addNewLine();

					/*
					 *	if there was a subsidiary for the line entity (customer)
					 *	as different from the main subsidiary (employee)
					 *	throw error 
					 */

					var realSubsidiaryId = {
						subsidiary: null
					};

					if (standardLinesObj[line].entity) {
						realSubsidiaryId = nlapiLookupField('entity', standardLinesObj[line].entity, ['subsidiary']);
					}

					if (+realSubsidiaryId.subsidiary == +mainData.subsidiary) {
						creditLine.setEntityId(standardLinesObj[line].entity);
					} else {
						creditLine.setEntityId(+mainData.entity);
					}

					if (!accountIdForCC) {
						accountIdForCC = standardLinesObj[line].account;
					}

					creditLine.setAccountId(accountIdForCC);

					creditLine.setClassId(standardLinesObj[line].classId);

					// standardLinesObj[line].creditAmount
					// standardLinesObj[line].debitAmount

					if (+originLinesObj[expense].amount > 0) {
						creditLine.setCreditAmount(+originLinesObj[expense].amount);
					} else {
						creditLine.setDebitAmount(+(Math.abs(originLinesObj[expense].amount)));
					}

					creditLine.setDepartmentId(standardLinesObj[line].department);
					creditLine.setLocationId(standardLinesObj[line].location);

					var memoString = [standardLinesObj[line].memo, 'Expense: ' + mainData.tranId, 'Employee: ' + mainData.entityName].join(' - ');
					creditLine.setMemo(memoString);

					found = true;

				}
			}
		}
	}

	for (var i = 0; i < customLines.getCount(); i++) {
		tmpCustom = {};

		var currLine = customLines.getLine(i);

		tmpCustom = {
			entity: currLine.getEntityId(),
			account: currLine.getAccountId(),
			creditAmount: currLine.getCreditAmount(),
			debitAmount: currLine.getDebitAmount(),
			memo: currLine.getMemo(),
			classId: currLine.getClassId(),
			department: currLine.getDepartmentId(),
			location: currLine.getLocationId()
		};

		nlapiLogExecution('DEBUG', ['customLines', i].join(' '), JSON.stringify(tmpCustom));

	}


	return true;

}