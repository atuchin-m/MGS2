/**
 *spreadsheet configurator NOT integrated
 */

/**
   * key functions
   */

var kCanAdd = "Успешно добавлено";
var kAlreadyAccepted = "Ошибка: задача уже зачтена";
var kLimitExceeded = "Ошибка: кол-во попыток превышено";

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
  var modelSheet = GetSheet(RAW, FormResponse.tableid);

  // we will choose size really bigger than actual and then wait for lock
  // because of very slow getlastrow
  var modelSize = modelSheet.getLastRow() - MODEL_START  + CONST_MORE_THAN_JUDGIES; 
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch(err){
    FormResponse.serverResponse = "Превышено время ожидания";
    return JSON.stringify(FormResponse);
  }

  //tokens stuff
  var modelData = modelSheet.getRange(MODEL_START, 1, modelSize, 2).getValues();
  for(i in modelData){
    if(modelData[i][1] == FormResponse.token){
      FormResponse.serverResponse = "Копия предыдущей формы";
      lock.releaseLock();
      return JSON.stringify(FormResponse);
    }
  }

  // check for exceeding attempts count
  var checkResult = canMarkAttempt(FormResponse.team, FormResponse.problem, FormResponse.result, modelData);
  if (checkResult == kCanAdd)
  {
    // run some module checks
    var d = new Date();
    FormResponse.time = d.toLocaleTimeString();
    SaveRes(FormResponse);
    modelData.push([JSON.stringify(FormResponse)]);
  } else {
    FormResponse.serverResponse = checkResult;
  }
  lock.releaseLock();

  FormResponse.isExtrasNeeded = view_refreshTeamView(FormResponse.team, modelData,
     module_getParams(FormResponse.tableid).problem, GetSheet(VIEW, FormResponse.tableid));

  var serverVersion = module_getParams(FormResponse.tableid).team;
  if(serverVersion != FormResponse.version){
    FormResponse.uptodate = false;
  }

  return JSON.stringify(FormResponse);
}

// Checks if we could add the attempt {team, problem, result} to the |list|.
function canMarkAttempt(team, problem, result, list){
  // checks for simular formmessages
  var attempts = 0;
  for(cell in list){
    try{
      var item = JSON.parse(list[cell][0]);
      if(team == item.team && problem == item.problem){
        if (item.result)
          return kAlreadyAccepted;
        attempts++;
      }
    }catch(err){
      continue;
    }
  }
  if(attempts >= ATTEMPTS){
    return kLimitExceeded;
  }
  return kCanAdd;
}

function SaveRes(message){
  var sheet = GetSheet(RAW, message.tableid);
  //customization starts 
  var pack = [
    JSON.stringify(message),
    message.token,
    message.team,
    message.problem,
    message.result,
    message.judge,
    message.time,
    message.comment
  ];
  //ends
  sheet.appendRow(pack);
}

function deleteForm(token, link, id){
  var modelSheet = GetSheet(RAW,id);
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  var modelSize = modelSheet.getLastRow() - MODEL_START  + 2;
  var modelRange = modelSheet.getRange(MODEL_START, 1, modelSize);
  var modelData = modelRange.getValues();
  for(i in modelData){
    try{
      var item = JSON.parse(modelData[i][0]);
      var team = item.team;
      if(item.token == token){
        modelData[i][0] = "";
        view_refreshTeamView(team, modelData,
          module_getParams(id).problem, GetSheet(VIEW, id));
        modelRange.setValues(modelData);
        lock.releaseLock();
        return link;
      }
    } catch(err){
      continue;
    }
  }
  lock.releaseLock();
  throw "Не удалено";
}