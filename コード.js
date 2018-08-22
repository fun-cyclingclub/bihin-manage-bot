//* デバッグ関数 *//
function debugFunc(){
  var ss = SpreadsheetApp.getActiveSheet();
  //var range = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getValues();
  Logger.log(doReturn(ss,  {"id": "U012A1BCD", "name": "musik"}, 2));
  //Logger.log(doLent(ss,  {"id": "U012A1BCD", "name": "musik"}, 2));
}


//* SpreadSheetをjson List化して返却 *//
function _getInfo(range) {
  var keys = range[0];
  var data = range.slice(1);
  var result = [];
  data.forEach(function(values){
    var obj = new Object();
    values.forEach(function(value, index){
      obj[keys[index]] = value;
    });
    result.push(obj);
  });
  Logger.log(result);
  return result;
}


//* 名前からヘッダーインデックスを検索 *//
function _getColumnIndexByName(range, name){
  var result = -1;
  Logger.log(range);
  range.getValues()[0].forEach(function(value, index){
    Logger.log(value);
    Logger.log(name);
    if(value == name){
      Logger.log("helloaa");
      result = index + 1;
    }
  });
  return result ;
}


//* 備品リスト一覧 -1:貸出中 0:一覧 1:貸出可能 *//
function showItemText(range, mode_num){
  var data = _getInfo(range);
  var text = "";
  var actions = [];
  var available_text = "";
  var unavailable_text = "";
  data.forEach(function(values){
    if(values.available){
      available_text += "・" + values.item + "\n";
      if(mode_num > 0){
        var action = {};
        action["name"] = "lend";
        action["type"] = "button";
        action["text"] = values.item;
        action["value"] = values.item_id;
        actions.push(action);
      }
    }else{
      unavailable_text += "・" + values.item + "\n"; 
      unavailable_text += "→「" + values.name + "」が" + values.loan_date + "から持ち出し中です。\n";
      if(mode_num < 0){
        var action = {};
        action["name"] = "lend";
        action["type"] = "button";
        action["text"] = values.item;
        action["value"] = values.item_id;
        actions.push(action);
      }
    }
  });
  text += "○現在貸出可能\n" + available_text + "\n";
  if(available_text == ""){
    text += "貸出可能な備品はありません。\n";
  }
  text += "○現在持ち出し中\n" + unavailable_text + "\n";
  if(unavailable_text == ""){
    text += "持ち出し中の備品はありません。\n";
  }
  if(mode_num > 0){
    text += "\n借りる備品を選んでください。";
  }else if(mode_num < 0){
    text += "\n返却する備品を選んでください。";
  }
  return [text, actions];
}


//* 貸出操作 *//
function doLent(ss, user, item_id){
  var target = ss.getRange(item_id, 1, 1, ss.getLastColumn());
  var keys = ss.getRange(1, 1, 1, ss.getLastColumn());
  if(target.getCell(1, _getColumnIndexByName(keys, "available")).getValue()){
    target.getCell(1, _getColumnIndexByName(keys, "available")).setValue(false);
    target.getCell(1, _getColumnIndexByName(keys, "name")).setValue(user.name);
    target.getCell(1, _getColumnIndexByName(keys, "account")).setValue(user.id);
    target.getCell(1, _getColumnIndexByName(keys, "loan_date")).setValue(Utilities.formatDate(new Date(), "JST","yyyy-MM-dd"));
  }else{
    return "貸出中です。";
  }
  return "持ち出しました。";
}


//* 返却操作 *//
function doReturn(ss, user, item_id){
  var target = ss.getRange(item_id, 1, 1, ss.getLastColumn());
  var keys = ss.getRange(1, 1, 1, ss.getLastColumn());
  if(!target.getCell(1, _getColumnIndexByName(keys, "available")).getValue()){
    if(target.getCell(1, _getColumnIndexByName(keys, "account")).getValue() == user.id){
      target.getCell(1, _getColumnIndexByName(keys, "available")).setValue(true);
      target.getCell(1, _getColumnIndexByName(keys, "name")).clear();
      target.getCell(1, _getColumnIndexByName(keys, "account")).clear();
      target.getCell(1, _getColumnIndexByName(keys, "loan_date")).clear();
    }else{
      return "持ち出したアカウントとが異なります。持ち出した人が操作してください。";
    }
  }else{
    return "既に返却済です。";
  }
  return "返却しました。";
}


//* POSTを受けた際の処理 *//
function doPost(e) {
  Logger.log(e);
  var text = "";
  var actions = [];
  var callback_id = "";
  var parameter = e.parameter;
  
  //* Interactive Messageを操作したときのレスポンス *//
  if ("payload" in parameter){
    parameter = JSON.parse(e.parameter.payload);
    var ss = SpreadsheetApp.getActiveSheet();
    if(parameter.callback_id == "mode_select"){
      var range = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getValues();
      switch(parameter.actions[0].value){
        case "list":
          [text, actions] = showItemText(range, 0);
          callback_id = "list";
          break;
        case "available_list":
          [text, actions] = showItemText(range, 1);
          callback_id = "rent";
          break;
        case "unabailavle_list":
          [text, actions] = showItemText(range, -1);
          callback_id = "return";
          break;
      }
    }else if(parameter.callback_id == "rent"){
      text = doLent(ss, parameter.user, parameter.actions[0].value);
    }else if(parameter.callback_id == "return"){
      text = doReturn(ss, parameter.user, parameter.actions[0].value);
    }
    var response = {
      "attachments": [
        {
          "text": text,
          "fallback": "知らんけどエラーでた",
          "callback_id": callback_id,
          "color": "#334500",
          "attachment_type": "default",
          "actions": actions
        }
      ]
    };
  //* Slach commandを操作したときのレスポンス *//
  }else{
    var response = {
      "text": text,
      "attachments": [
        {
          "text": "作業を選んでください。",
          "fallback": "知らんけどエラーでた",
          "callback_id": "mode_select",
          "color": "#000000",
          "attachment_type": "default",
          "actions": [
            {
              "name": "mode",
              "text": "貸出",
              "type": "button",
              "value": "available_list"
            },
            {
              "name": "mode",
              "text": "返却",
              "type": "button",
              "value": "unabailavle_list"
            },
            {
              "name": "mode",
              "text": "貸出品一覧",
              "type": "button",
              "value": "list"
            }
          ]
        }
      ]
    };
  }
  
  var output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(response));
  return output;
}