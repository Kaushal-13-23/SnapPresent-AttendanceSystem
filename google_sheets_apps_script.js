/**
 * SnapPresent 24/7 Google Sheets Two-Way Attendance Sync
 * Sheet URL: https://docs.google.com/spreadsheets/d/1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc/edit?usp=sharing
 * Target Tab: "Main"
 *
 * HOW TO INSTALL IN 30 SECONDS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc/edit?usp=sharing
 * 2. Click "Extensions" in top menu -> "Apps Script"
 * 3. Replace all existing text with this file content
 * 4. Click "Deploy" (blue button top right) -> "New deployment"
 * 5. Select type: "Web app"
 *    - Description: SnapPresent Live Sync
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Click "Deploy", authorize access, and COPY the Web App URL!
 * 7. Add this URL to your Vercel Environment Variables as GOOGLE_SHEETS_WEBHOOK_URL
 */

const TARGET_SHEET_NAME = "Main";

function getOrCreateMainSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TARGET_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET_NAME);
  }

  // Create header row if empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Timestamp",
      "Date",
      "Time",
      "Enrollment / Student ID",
      "Student Name",
      "Department",
      "Year",
      "Division",
      "Subject",
      "Status",
      "Verification Method",
      "Confidence (%)"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E8F8F0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Handle Incoming Attendance from SnapPresent (POST)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateMainSheet();
    const rows = data.rows || [data];
    const now = new Date();

    rows.forEach(function(item) {
      sheet.appendRow([
        now.toISOString(),
        item.date || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        item.time || Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"),
        item.studentId || "",
        item.studentName || "",
        item.department || "",
        item.year || "",
        item.division || "",
        item.subject || "",
        item.status || "Present",
        item.verificationType || "AI Face Recognition",
        item.confidence ? item.confidence.toFixed(1) + "%" : "95.0%"
      ]);
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Synced " + rows.length + " attendance records to 'Main' tab",
      timestamp: now.toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow reading records from Google Sheet back to SnapPresent (GET)
function doGet(e) {
  try {
    const sheet = getOrCreateMainSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: 0, records: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0];
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const entry = {};
      for (let j = 0; j < headers.length; j++) {
        entry[headers[j]] = row[j];
      }
      records.push(entry);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: records.length,
      records: records
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
