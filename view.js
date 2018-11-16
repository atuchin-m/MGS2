/// functions for interface list
//raw
function view_SaveRawRes(message){
  var sheet = GetSheet(RAW,message.tableid);
  //pushes data to the all-messages sheet
  var d = new Date();
  //customization starts 
  var pack = [
    JSON.stringify(message),
    message.token,
  	message.team,
  	message.problem,
  	message.result,
  	message.judge,
  	d.toLocaleTimeString()
  ];
  //ends
  sheet.appendRow(pack);
  return sheet.getLastRow(); ///integer, but not Range object
}