//configurator integrated (no)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  //init of app
  var html = HtmlService.createTemplateFromFile('build/clientMainPage').evaluate();
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

function getTeamnames(){
  //exctracts numbers-to-names map for client
  
  //return module_getTeamnames(); for special situations
}

function getParams(){
  //extracts params from model
  return module_getParams();
}

function notCollided(team, problem, list){
  // checks for simular formmessages
  if(list[team][problem].length < ATTEMPTS){
    return true;
  }
  return false;
}

function handleClientForm(FormResponse){
  //does smth with data?  checking and calls view methods
  var modelRange = GetSheet(RAW,FormResponse.tableid).getRange(MODEL_X,MODEL_Y);
  var model_JSON = modelRange.getValue();
  var model_data = JSON.parse(model_JSON); // correspondence team-problem

  //checking for teamnames changes
  if(ServerVersion != FormResponse.version){
    FormResponse.uptodate = false;
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  Logger.log("1",model_data);
  // check for exceeding attempts count
  if(notCollided(FormResponse.team,FormResponse.problem, model_data)){

    // run some module checks

    // and then write to model
    model_data[team][problem].push[FormResponse]; 
    modelRange.setValue(JSON.stringify(model_data));
    
  }else{
    FormResponse.serverResponse = "error";
  }
  lock.releaseLock();

  Logger.log("2", model_data);

  // then add some human-readable logs
  FormResponse.formLink = view_SaveRawRes(); 
  // and more useful for teams 
  //...soon.

  //then send whole message for logs
  return JSON.stringify(FormResponse);

}