/// functions for interface list
//raw
function view_SaveRawRes(sheet,message){
  //pushes data to the all-messages sheet
  var d = new Date();
  //customization starts 
  var pack = [
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