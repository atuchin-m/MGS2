/**
 * here should be functions for advanced game checks
 */
 
function module_getParams(id){
	// no consants, all should be here
	var dataSheet = GetSheet(RAW,id);
	var data = {
		team: dataSheet.getRange(1, 2).getValue(),
		problem: dataSheet.getRange(2, 2).getValue()
	};
	
	return data;
}

function module_getTeamnames(id){
	var repacked_teamArray = [];
	var maxTeams = module_getParams(id).team;
	var teamArray = GetSheet(TEAMS, id).getRange(1, 2, maxTeams).getValues();
	for(i in teamArray){
		repacked_teamArray.push(teamArray[i][0]);
	}
	Logger.log(repacked_teamArray);
	return repacked_teamArray;
}

function fetchJudgeResults(id){
  var modelSheet = GetSheet(RAW,id);
  var modelSize = modelSheet.getLastRow() - MODEL_START  + CONST_MORE_THAN_JUDGIES;
  return modelSheet.getRange(MODEL_START, 1, modelSize, 2).getValues();
}

function GetHumanReadableCaption(value) {
  if (value[0] == "+")
    return "Уже сдана (" + value + ")";
	Logger.log(value);
  switch(value) {
  	case -1:
  		return "Была 1 попытка";
  	case -2:
  		return "Были 2 попытки";
  	case -3:
  		return "Были 3 попытки";
  	default:
  		return "Не сдавалась ранее";	
  }
}

function getTeamResults(team, problem, id){
  var face = GetSheet(VIEW, id);
  var faceCell = face.getRange(VIEW_START_X + team, VIEW_START_Y - 1 + problem);
  return GetHumanReadableCaption(faceCell.getValue());
}