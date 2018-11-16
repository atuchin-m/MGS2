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
  var attempts = 0;
  for(cell in list){
    if(team == JSON.parse(cell).team && problem == JSON.parse(cell).problem){
      attempts++;
    }
  }
  if(attempts < ATTEMPTS){
    return true;
  }
  return false;
}

function handleClientForm(FormResponse){
  var countRange = GetSheet(RAW,FormResponse.tableid).getRange(C_X,C_Y);
  var modelSize = countRange.getValue();

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  if(modelSize > 0){
    //tokens check
    var tokens_data = GetSheet(RAW,FormResponse.tableid).getRange(6,2,modelSize).getValues();
    Logger.log(tokens_data.indexOf([FormResponse.token]));
    if(tokens_data.indexOf([FormResponse.token]) != -1){
      FormResponse.serverResponse = "same form exists";
      lock.releaseLock();
      return JSON.stringify(FormResponse);
    }

    var model_data = GetSheet(RAW,FormResponse.tableid).getRange(6,1,modelSize).getValues();
  }else{
    var model_data = [];
  }

  // check for exceeding attempts count
  if(notCollided(FormResponse.team,FormResponse.problem, model_data)){
    // run some module checks

    // and then write to model
    FormResponse.formLink = view_SaveRawRes(FormResponse);
    countRange.setValue(modelSize + 1);
  }else{
    FormResponse.serverResponse = "Error";
  }
  lock.releaseLock();

  var serverVersion = module_getParams(FormResponse.tableid).team;
  if(serverVersion != FormResponse.version){
    FormResponse.uptodate = false;
  }
 
  // logs  more useful for teams 
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