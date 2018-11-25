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

function handleClientForm(FormResponse){
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  var modelSheet = GetSheet(RAW, FormResponse.tableid);
  var countRange = modelSheet.getRange(C_X, C_Y);
  var modelSize = countRange.getValue();

  //tokens stuff
  if(modelSize > 0){
    var tokensData = modelSheet.getRange(MODEL_START, 2, modelSize).getValues();
    for(i in tokensData){
      if(tokensData[i][0] == FormResponse.token){
        FormResponse.serverResponse = "same token exists";
        lock.releaseLock();
        return JSON.stringify(FormResponse);
      }
    }
    var modelData = modelSheet.getRange(MODEL_START, 1, modelSize).getValues();
  }else{
    var modelData = [];
  }

  // check for exceeding attempts count
  if(notCollided(FormResponse.team, FormResponse.problem, modelData)){
    // run some module checks
    SaveRes(FormResponse);
    countRange.setValue(modelSize + 1);
  }else{
    FormResponse.serverResponse = "same modeldata exists";
  }

  lock.releaseLock();

  var serverVersion = module_getParams(FormResponse.tableid).team;
  if(serverVersion != FormResponse.version){
    FormResponse.uptodate = false;
  }
 
  // view refresh
  view_refreshTeamView(FormResponse.team, modelData, module_getParams(FormResponse.tableid).problem);

  return JSON.stringify(FormResponse);
}

function notCollided(team, problem, list){
  // checks for simular formmessages
  var attempts = 0;
  for(cell in list){
    var item = JSON.parse(list[cell][0]);
    if(team == item.team && problem == item.problem){
      attempts++;
    }
  }
  if(attempts < ATTEMPTS){
    return true;
  }
  return false;
}

function SaveRes(message){
  var sheet = GetSheet(RAW, message.tableid);
  //pushes data to the model sheet
  var d = new Date();
  //customization starts 
  var pack = [
    JSON.stringify(message),
    message.token,
    message.team,
    message.problem,
    message.result,
    message.judge,
    d.toLocaleTimeString(),
    message.comment
  ];
  //ends
  sheet.appendRow(pack);
}