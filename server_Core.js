/**
 *spreadsheet configurator NOT integrated
 */

/**
   * key functions
   */

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  //init of app
  var html = HtmlService.createTemplateFromFile('client_Page').evaluate();
  html.setTitle(FORM_TITLE);                                 
  return html; 
}

function GetSheet(sheet_name, tableid) {
  //returns sheet of a lable
  try{
    var spreadsheet = SpreadsheetApp.openById(tableid);
  }catch(err){
    throw new Error("Failed to open table " + tableid);
  }
  try{
    var sheet = spreadsheet.getSheetByName(sheet_name);
  }catch(err){
    throw new Error("Failed to open sheet named " + sheet_name + " in table " + tableid);
  }
  return sheet;
}

function getTeamnames(id){
  //exctracts numbers-to-names map for client
  return JSON.stringify(module_getTeamnames(id)); 
}

function getParams(id){
  //extracts params from model
  return JSON.stringify(module_getParams(id));
}

function getHeader(){
  return HEADER;
}



/**
   * functions for communication with client
   */

function notCollided(team, problem, list){
  // checks for simular formmessages
  if(list[team][problem].length < ATTEMPTS){
    return true;
  }
  return false;
}

function handleClientForm(FormResponse){
  var modelRange = GetSheet(RAW,FormResponse.tableid).getRange(MODEL_X,MODEL_Y);
  //JSON because of "Range value can be numeric, string, boolean or date."
  if(modelRange.isBlank()){
    modelRange.setValue(JSON.stringify(initModel(FormResponse.tableid)));   
  }
  var model_data = JSON.parse(modelRange.getValue()); // correspondence team-problem

  var serverVersion = module_getParams(FormResponse.tableid).team;
  if(serverVersion != FormResponse.version){
    FormResponse.uptodate = false;
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  // check for exceeding attempts count
  if(notCollided(FormResponse.team,FormResponse.problem, model_data)){
    // run some module checks

    // and then write to model
    model_data[FormResponse.team][FormResponse.problem].push(FormResponse); 
    modelRange.setValue(JSON.stringify(model_data));
  }else{
    FormResponse.serverResponse = "Error";
  }
  lock.releaseLock();

  // then add some human-readable logs
  FormResponse.formLink = view_SaveRawRes(FormResponse); 
  // and more useful for teams 
  //...soon.

  //then send whole message for logs
  return JSON.stringify(FormResponse);

}

// function initModel(id){
//   var arr = [];
//   for(var i = 0;i < module_getParams(id).team;i++){
//     arr.push([]);
//       for(var j = 0;j < module_getParams(id).problem;j++){
//         arr[i].push([]);
//       }
//   }  
//   return arr;
// }