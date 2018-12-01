/// functions for interface list
//raw

function view_refreshTeamView(team, modelData, maxProblem, viewSheet){
	var attemptsArray = [];
	var value = "";
	var lastForm=  0, successCounter = 0;
	for(var i = 0; i < maxProblem; i++){
		attemptsArray[i] = [0, 0]; // first is 0 or 1, and second - number of forms
	}
	for(i in modelData){
		try{
			var curForm = JSON.parse(modelData[i][0]);
			if(curForm.team == team){
				lastForm = +curForm.result;
				attemptsArray[curForm.problem - 1][0] = +curForm.result;
				attemptsArray[curForm.problem - 1][1]++;
				if(lastForm == 1){
					successCounter++;
				}
			}
		} catch(err){
			continue;
		} 
	}
	/// exctraction from 2017 script FACE algo
	for(i in attemptsArray){
		var curRange = viewSheet.getRange(VIEW_START_X + team, VIEW_START_Y + parseInt(i));
		if(attemptsArray[i][1] > 0){
			value = String(attemptsArray[i][1] - attemptsArray[i][0]);
			if(value == "0"){
				value = "";
			} 
			curRange.setValue(SYMBOLS[attemptsArray[i][0]] + value);
			curRange.setFontColor(FONTS[attemptsArray[i][0]]);
			curRange.setHorizontalAlignment("center");	
		}else{
			curRange.setValue("");
		}
	}
	var d = new Date();
	if(successCounter == EXTRAS_BORDER && viewSheet.getRange(VIEW_START_X + team, VIEW_START_Y + maxProblem).isBlank() ){
		viewSheet.getRange(VIEW_START_X + team, VIEW_START_Y + maxProblem).setValue(d.toLocaleTimeString());
		return true;
	}
	return false;
}