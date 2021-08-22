const key = 'KEY';
const domainKey = 'DOMAIN';
const emailKey = 'email';
const templatesKey = 'templates';

export const onInstall = () => {
  onOpen();
}

export const onOpen = () => {
  SpreadsheetApp.getUi().createAddonMenu().addItem("Start Mailman", 'startMerge').addToUi(); 
};

export const startMerge = () => {
  const userProperties = PropertiesService.getUserProperties();
  var email = Session.getActiveUser().getEmail();
  userProperties.setProperty(emailKey, email);
  registerUser(email);

  var title = 'Mailman';
  var html = HtmlService.createTemplateFromFile('modal');
  var htmlOutput = html.evaluate();
  htmlOutput.setTitle(title).setWidth(730).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
};

// registerUser registers a user
export const registerUser = (email) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'followRedirects': true,
    'muteHttpExceptions': true,
    'contentType': 'application/json',
    'payload': {
      'email': email,
      'key': scriptProperties.getProperty(key),
    },
  };
  options.payload = JSON.stringify(options.payload);
  var response = UrlFetchApp.fetch(scriptProperties.getProperty(domainKey)+'/user/register', options).getContentText();
  return JSON.parse(response); 
}

// getTemplates gets a user's saved templates
export const getTemplates = () => {
  const userProperties = PropertiesService.getUserProperties();
  var templates = userProperties.getProperty(templatesKey);
  if (templates){
    return {'response': JSON.parse(templates)}
  }
}

// saveTemplates saves a user's email templates
export const saveTemplates = (templates) => {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(templatesKey, JSON.stringify(templates));
  return {'response': templates};
}

// email validation that accepts unicode characters
// https://stackoverflow.com/a/46181/522962
const reEmail = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export const getSheetData = () => {
  var activeSheet = SpreadsheetApp.getActiveSheet();
  var data = {
    'data': getData(activeSheet, activeSheet.getDataRange()),
    'recipients': 0,
    //'senders': [Session.getActiveUser().getEmail(), ...GmailApp.getAliases()],
    'senders': [Session.getActiveUser().getEmail()],
  }

  // Get the recipients. Need at least one valid email to send to
  for (var i=1; i<data.data.length; i++){ // first row is the header
    if (reEmail.test(data.data[i]['emailAddress'])){
      data.recipients++;
    }
  }

  return data;
}
export const insertNewSheetTemplate = () => {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var cnt = 0;
  var inserted = false;
  // execute a loop until we find a free name
  while (!inserted){
    var name = "Mail Merge";
    if (cnt > 0){
      name = name + " " + cnt; // Mail Merge1, Mail Merge2, Mail Merge3, Mail Merge4, etc.
    }

    if(activeSpreadsheet.getSheetByName(name) == null){
      var newSheet = activeSpreadsheet.insertSheet(name, activeSpreadsheet.getSheets().length);
      var values = [
        ["Email Address", "Grade"],
        [Session.getActiveUser().getEmail(), 'A+'],
      ];
      
      var range = newSheet.getRange("A1:B2");
      range.setValues(values);
      SpreadsheetApp.flush();
      inserted=true;
    }
    cnt++
  }

  return;
}

const sent = "EMAIL_SENT"; // TODO
function sendEmails(data){
  var cnt = 0;
  // For every row object, create a personalized email from a template and send
  // it to the appropriate person.
  var template = data.template;
  for (var i = 1; i < data.data.length; i++){
    var row = data.data[i];
    var recipient = data.test ? Session.getActiveUser().getEmail() : row.emailAddress;
    if (!reEmail.test(recipient)){
      continue
    }

    var email = fillInTemplateFromObject(template, row);
    MailApp.sendEmail({
      to: recipient,
      subject: email.subject,
      htmlBody: '<!DOCTYPE html><html><body>'+email.body+'</body></html>',
    });
    cnt++
    if (data.test){
      return cnt;
    }    
  }
  return cnt;
}

// Replaces markers in a template string with values define in a JavaScript data object.
// Arguments:
//   - template: string containing markers, for instance {{Column name}}
//   - data: JavaScript object with values to that will replace markers. For instance
//           data.columnName will replace marker {{Column name}}
// Returns a string without markers. If no data is found to replace a marker, it is
// simply removed.
function fillInTemplateFromObject(template, data){
  var email = {...template};
  // Search for all the variables to be replaced, for instance {{First name}}
  var bodyTemplateVars = template.body.match(/\{{2}(.*?)\}{2}/g);
  var subjectTemplateVars = template.subject.match(/\{{2}(.*?)\}{2}/g);
  // Replace variables from the template with the actual values from the data object.
  // If no value is available, replace with the empty string.
  // normalizeHeader ignores {{}} so we can call it directly here.
  if(bodyTemplateVars){
    for (var i = 0; i < bodyTemplateVars.length; i++){
      var variableData = data[normalizeHeader(bodyTemplateVars[i])];
      email.body = email.body.replace(bodyTemplateVars[i], variableData || "");
    }
  }
  if(subjectTemplateVars){
    for (var i = 0; i < subjectTemplateVars.length; i++){
      var variableData = data[normalizeHeader(subjectTemplateVars[i])];
      email.subject = email.subject.replace(subjectTemplateVars[i], variableData || "");
    }
  }

  return email;
}

export const closeModal = () => {
  var output = HtmlService.createHtmlOutput('<script>google.script.host.close();</script>');
  SpreadsheetApp.getUi().showModalDialog(output, 'Loading...');
}

//////////////////////////////////////////////////////////////////////////////////////////
//
// The code below is reused from https://script.google.com/d/1zZVi_E3lcpVreIDO11mupQ4hn0bTyuobVAjJutpcG98Yml81U4HcaV8J/edit?mid=ACjPJvElO5b7QemLUY29SUeuadxbaoqkdXnEdeyNG53h9DJ833tDcZP-JHrpUWcYrPBdQ5ukBK2NCIdt_CdO5NZHzoDhbt4m8LOC2Z42NABH_Gp-5-YgZp_E58f7QUf826vKTPTwIbuoDBM&uiv=2, which reuses it from somewhere else
//////////////////////////////////////////////////////////////////////////////////////////
// getData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//  - sheet: the sheet object that contains the data to be processed
//  - range: the exact range of cells where the data is stored
// Returns an Array of objects.
function getData(sheet, range){
  var numColumns = range.getEndColumn() - range.getColumn() + 1;
  var headersRange = sheet.getRange(1, range.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects(range.getValues(), normalizeHeaders(headers));
}

// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//  - data: JavaScript 2d array
//  - keys: Array of Strings that define the property names for the objects to create
function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; i++) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; j++) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

// Returns an Array of normalized Strings.
// Arguments:
//  - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; i++) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//  - header: string to normalize
// Examples:
//  "First Name" -> "firstName"
//  "Market Cap (millions) -> "marketCapMillions
//  "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; i++) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//  - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}

global.onInstall = onInstall;
global.onOpen = onOpen;
global.startMerge = startMerge;
global.getSheetData = getSheetData;
global.insertNewSheetTemplate = insertNewSheetTemplate;
global.saveTemplates = saveTemplates;
global.sendEmails = sendEmails;
global.closeModal = closeModal;
global.getTemplates = getTemplates;
