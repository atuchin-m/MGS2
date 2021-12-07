/**
 *spreadsheet configurator NOT integrated
 */

/**
   * key functions
   */

var kCanAdd = "Успешно добавлено";
var kAlreadyAccepted = "Ошибка: задача уже зачтена";
var kLimitExceeded = "Ошибка: кол-во попыток превышено";
var spreadsheetID = ""
var protocol_link = ""
var student_list_link = ""

function addParamsAndEval(t) {
  t.spreadsheetID = spreadsheetID;
  t.protocol_link = protocol_link;
  t.student_list_link = student_list_link;
  return t.evaluate();
}
function include(filename) {
  t = HtmlService.createTemplateFromFile(filename);
  return addParamsAndEval(t).getContent();
}

function doGet(e) {
  //init of app
  spreadsheetID = ""
  var t = HtmlService.createTemplateFromFile('client_Page');
  if (e.parameter.class == "6") {
    spreadsheetID = "1-W8BkGYfN_80Dh1W1PBMYGaBE38d34rnPgiKeuGfkE0";
    protocol_link = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQM1HyVDQLwKEMIvxzVc-QFD2vMrvDXkCvT7lYxQKpUWtlQsi2HZsvOaQhGF7TMnYRrkBkdV_gcJCax/pubhtml?gid=940596466&single=true";
    student_list_link = "https://script.google.com/macros/s/AKfycbzZimQIpJ1Sf_lyDqe6dAmawOItLuIXD1MmAaE-QzXTfQqKwTR8KGQkoEQcwsZ0mtf8pg/exec"
  }
  if (e.parameter.class == "7") {
    spreadsheetID = "13EU4M3F6mpXXFgZDQ-2iuaVnPnFBuvqktnVN3ZdERBs"
    protocol_link = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHC-xlVanKW-3isXzr1rvoShtucV4rphzwERs0PkHrMeQu1iSe3OvN9dunrxT2K1EYzwPsKhF7NvrR/pubhtml?gid=940596466&single=true"
    student_list_link = "https://script.google.com/macros/s/AKfycbzXl-Ywy_GT3TdI-1rDvDyT3xo3UMOYiGZq5vsipkXcbPFzAcoArkAEK1i5B5GbOKKjQQ/exec"
  }
  if (e.parameter.class == "8") {
    spreadsheetID = "1h4IgGG9N_K0xLpGgcCI5EVpdZLZQs7lLdQpiJxZms2c"
    protocol_link = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdxaklGFpZUp54PARzHe9DkaXKe_3JyrgRXrwGP6YCgtDORJQ4G8Gc7OLn57kGDDsfsHImU8HkQwS1/pubhtml?gid=940596466&single=true"
    student_list_link = "https://script.google.com/macros/s/AKfycbzYUK2QcPcWz4SOX_nB5heSuDdcET1OOizuO2cgAsMD3MmRPR3wc-xZHdGPszeqcWM/exec"
  }

  html = addParamsAndEval(t);
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