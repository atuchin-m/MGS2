/// functions for interface list
//raw

function view_refreshTeamView(team, modelData, maxProblem, viewSheet){
	var attemptsArray = [];
	var value = "";
	for(var i = 0; i < maxProblem; i++){
		attemptsArray[i] = [0, 0];
	}
	for(i in modelData){
		try{
			var curForm = JSON.parse(modelData[i][0]);
			if(curForm.team == team){
				attemptsArray[curForm.problem - 1][0] = +curForm.result;
				attemptsArray[curForm.problem - 1][1]++;
			}
		} catch(err){
			continue;
		} 
	}
	/// exctraction from 2017 script FACE algo
	for(i in attemptsArray){
		if(attemptsArray[i][1] > 0){
			var curRange = viewSheet.getRange(VIEW_START_X + team, VIEW_START_Y + parseInt(i));
			value = String(attemptsArray[i][1] - attemptsArray[i][0]);
			if(value == "0"){
				value = "";
			} 
			curRange.setValue(SYMBOLS[attemptsArray[i][0]] + value);
			curRange.setFontColor(FONTS[attemptsArray[i][0]]);
			curRange.setHorizontalAlignment("center");	
		}
	}
}