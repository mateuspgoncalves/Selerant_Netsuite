function saveRecord() {
	console.log("Function saveRecord called");
	var stars = document.getElementsByName('rate');
	for (var i = 0, length = stars.length; i < length; i++) {
		if (stars[i].checked) {
			var value = stars[i].value;
			console.log("Rate: " + stars[i].value);
			document.getElementById('custrecord_sel_case_survey_rating').value = value;
		  	break;
		}
	}
}
