var TARGET_SHEET = "Main";

function getOrCreateMainSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TARGET_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET);
  }
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp",
      "Date",
      "Time",
      "Student ID",
      "Student Name",
      "Department",
      "Year",
      "Division",
      "Subject",
      "Status",
      "Verification Method",
      "Confidence"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E8F8F0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateMainSheet();
    var rows = data.rows || [data];
    var now = new Date();
    
    rows.forEach(function(item) {
      sheet.appendRow([
        now.toISOString(),
        item.date || "",
        item.time || "",
        item.studentId || "",
        item.studentName || "",
        item.department || "",
        item.year || "",
        item.division || "",
        item.subject || "",
        item.status || "Present",
        item.verificationType || "AI Face",
        item.confidence ? (item.confidence + "%") : "95%"
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = getOrCreateMainSheet();
  var values = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify({ success: true, count: values.length, rows: values }))
    .setMimeType(ContentService.MimeType.JSON);
}
