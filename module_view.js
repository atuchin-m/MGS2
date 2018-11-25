/// functions for interface list
//raw

function view_refreshTeamView(team, modelData, maxProblem){
	var attemptsArray = [];
	for(var i = 0; i < maxProblem; i++){
		attemptsArray[i] = [0, 0];
	}
	for(i in modelData){
		var curForm = JSON.parse(modelData[i][0]);
		attemptsArray[curForm.team][0] = +curForm.result;
		attemptsArray[curForm.team][1] ++; 
	}
	/// exctraction from 2017 script FACE algo
	for(i in attemptsArray){
		Logger.log(attemptsArray[i]);
	}
}