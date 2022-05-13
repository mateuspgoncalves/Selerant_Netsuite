function copyXRToCustomLine(){
    var lines = nlapiGetLineItemCount('expense');

    for(var i = 1; i <= lines; i++){
        nlapiSetLineItemValue('expense','custcol_sel_xr',i,nlapiGetLineItemValue('expense','exchangerate',i));
        nlapiSetLineItemValue('expense','custcol_sel_curr',i,nlapiGetLineItemValue('expense','currency',i));
        nlapiSetLineItemValue('expense','custcol_sel_fxamt',i,nlapiGetLineItemValue('expense','foreignamount',i));
    }
}