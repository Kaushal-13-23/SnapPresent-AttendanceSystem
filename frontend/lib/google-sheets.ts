/**
 * Google Sheets 24/7 Live Sync Utility for SnapPresent
 * Sheet ID: 1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc
 * Tab Name: "Main"
 * URL: https://docs.google.com/spreadsheets/d/1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc/edit?usp=sharing
 */

export const GOOGLE_SHEET_CONFIG = {
  SHEET_ID: '1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc',
  SHEET_NAME: 'Main',
  VIEW_URL: 'https://docs.google.com/spreadsheets/d/1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc/edit?usp=sharing',
  DEFAULT_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycby-sOZcU_CkIoJ9f1676JNBKgaL0xAegYpzoqHr-UEgOI-6v9DFfVN-YD6E3QsPEVAkSA/exec',
};

export interface SheetAttendanceRow {
  date: string;
  time: string;
  studentId: string;
  studentName: string;
  department: string;
  year: string;
  division: string;
  subject: string;
  status: 'Present' | 'Absent';
  verificationType?: string;
  confidence?: number;
}

/**
 * Synchronize attendance records to Google Sheets "Main" tab in real time.
 * Non-blocking: will never crash or delay the facial recognition loop.
 */
export async function syncToGoogleSheets(rows: SheetAttendanceRow[]): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || GOOGLE_SHEET_CONFIG.DEFAULT_WEBHOOK_URL;
  if (!webhookUrl || rows.length === 0) {
    return false;
  }

  try {
    const payload = {
      sheetId: GOOGLE_SHEET_CONFIG.SHEET_ID,
      sheetName: GOOGLE_SHEET_CONFIG.SHEET_NAME,
      rows,
      syncedAt: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000), // non-blocking 4s timeout
    });

    return res.ok;
  } catch (err) {
    console.warn('Google Sheets non-blocking sync notice:', err);
    return false;
  }
}
