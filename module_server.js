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
	var teamArray = GetSheet(TEAMS, id).getRange(1, 1, maxTeams).getValues();
	for(i in teamArray){
		repacked_teamArray.push(teamArray[i][0]);
	}
	Logger.log(repacked_teamArray);
	return repacked_teamArray;
}