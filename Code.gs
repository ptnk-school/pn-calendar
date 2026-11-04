/**
 * Google Apps Script สำหรับเชื่อมต่อระบบปฏิทินปฏิบัติงาน โรงเรียนพัฒนานิคม กับ Google Sheets
 *
 * วิธีติดตั้ง:
 * 1. สร้างไฟล์ Google Sheets ใหม่
 * 2. ไปที่เมนู ส่วนขยาย (Extensions) > Apps Script
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ลงไป กดบันทึก (Save)
 * 4. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. เลือกประเภทเป็น "เว็บแอป" (Web app)
 *    - ดำเนินการในฐานะ (Execute as): ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)
 * 6. กดทำให้ใช้งานได้ แล้วคัดลอก Web App URL ไปวางในหน้าตั้งค่าของเว็บปฏิทินโรงเรียนพัฒนานิคม
 */

const SHEET_NAME = 'SchoolEvents';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // สร้างหัวตาราง (Header Row) รองรับคอลัมน์ isSubmission (งานที่ต้องส่ง)
    sheet.appendRow([
      'id',
      'title',
      'department',
      'academicYear',
      'startDate',
      'endDate',
      'time',
      'location',
      'description',
      'isSubmission',
      'updatedBy',
      'updatedAt'
    ]);
    sheet.getRange('A1:L1').setFontWeight('bold').setBackground('#e2e8f0');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ดึงรายการกิจกรรมและงานที่ต้องส่งทั้งหมดจาก Google Sheets ส่งกลับไปยังหน้าเว็บ (GET)
function doGet(e) {
  const sheet = getOrCreateSheet();
  const rows = sheet.getDataRange().getValues();
  const events = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] && !row[1]) continue;

    const rawSub = row[9];
    const isSubmission =
      rawSub === true ||
      String(rawSub).toLowerCase() === 'true' ||
      String(rawSub).trim() === 'ส่งงาน' ||
      String(rawSub).trim() === '1';

    events.push({
      id: String(row[0] || 'evt-' + i),
      title: String(row[1] || ''),
      department: String(row[2] || 'academic'),
      academicYear: String(row[3] || '2569'),
      startDate: formatSheetDate(row[4]),
      endDate: formatSheetDate(row[5]),
      time: String(row[6] || ''),
      location: String(row[7] || ''),
      description: String(row[8] || ''),
      isSubmission: isSubmission,
      updatedBy: String(row[10] || '')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', events }))
    .setMimeType(ContentService.MimeType.JSON);
}

// รับคำสั่งเพิ่ม / แก้ไข / ลบ กิจกรรมหรือกำหนดส่งงานจากหน้าเว็บบันทึกลง Google Sheets (POST)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const evt = body.event;
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (action === 'create') {
      sheet.appendRow([
        evt.id,
        evt.title,
        evt.department,
        evt.academicYear,
        evt.startDate,
        evt.endDate,
        evt.time,
        evt.location,
        evt.description,
        evt.isSubmission ? true : false,
        evt.updatedBy,
        new Date().toISOString()
      ]);
    } else if (action === 'update') {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(evt.id)) {
          sheet.getRange(i + 1, 1, 1, 12).setValues([[
            evt.id,
            evt.title,
            evt.department,
            evt.academicYear,
            evt.startDate,
            evt.endDate,
            evt.time,
            evt.location,
            evt.description,
            evt.isSubmission ? true : false,
            evt.updatedBy,
            new Date().toISOString()
          ]]);
          break;
        }
      }
    } else if (action === 'delete') {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(evt.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatSheetDate(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val).substring(0, 10);
}
