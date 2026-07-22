/**
 * Database.gs - Database Schema, Migration, and Access Layer for Google Sheets
 */

function getDb() {
  var id = getAppSettings().spreadsheetId;
  return SpreadsheetApp.openById(id);
}

function withLock(callback) {
  var lock = LockService.getScriptLock();
  try {
    var success = lock.waitLock(10000);
    if (!success) {
      throw new Error('ไม่สามารถเข้าถึงฐานข้อมูลได้เนื่องจากมีผู้ใช้งานอื่นกำลังบันทึกข้อมูล โปรดลองอีกครั้ง');
    }
    return callback();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Setup Spreadsheet Sheets and Headers if they do not exist
 */
function setupSpreadsheet() {
  return withLock(function() {
    var ss = getDb();
    var schemas = getSheetSchemas();

    for (var sheetName in schemas) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      var headers = schemas[sheetName];
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F6EFDC');
        sheet.setFrozenRows(1);
      }
    }
    return standardResponse(true, 'สร้างและตรวจสอบโครงสร้าง Google Sheets เรียบร้อยแล้ว');
  });
}

function getSheetSchemas() {
  return {
    'Settings': ['Key', 'Value', 'Description', 'UpdatedAt', 'UpdatedBy'],
    'Users': ['UserID', 'Username', 'PasswordHash', 'FullName', 'Role', 'Village', 'Active', 'CreatedAt', 'LastLogin'],
    'TrainingSessions': [
      'SessionID', 'SessionCode', 'FacilityName', 'FacilityType', 'Province', 'District', 'Subdistrict',
      'TrainingDate', 'StartTime', 'EndTime', 'TrainerName', 'CoordinatorName', 'CoordinatorPhone',
      'ClinicDay', 'ClinicTime', 'ClinicPhone', 'EmergencyPhone', 'ExpectedParticipants', 'ParticipatingVillages',
      'DeckID', 'SessionStatus', 'AcceptingResponses', 'DataRetentionPolicy', 'CreatedAt', 'CreatedBy',
      'OpenedAt', 'ClosedAt', 'ClosedBy', 'ExportedAt', 'ExportedBy', 'ArchivedAt', 'Note'
    ],
    'Children': [
      'RecordID', 'SessionID', 'CreatedAt', 'ParentName', 'Relationship', 'Phone', 'LineID', 'ChildName',
      'BirthDate', 'AgeMonths', 'Gender', 'Village', 'VolunteerName', 'HasVaccineBook', 'Consent',
      'VaccineStatus', 'MissingVaccine', 'StaffNote', 'LastUpdated'
    ],
    'PreTest': ['ResponseID', 'SessionID', 'RecordID', 'SubmittedAt', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'TotalScore'],
    'AcceptanceAssessment': [
      'AssessmentID', 'SessionID', 'RecordID', 'SubmittedAt', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8',
      'Suggestion', 'FlagSafetyConcern', 'FlagReligiousBelief', 'FlagAccessBarrier', 'FlagSocialMedia',
      'FlagLowAppointmentIntention', 'FlagLowConfidence', 'ClassificationStatus', 'ClassificationResult',
      'ScoringVersion', 'ReviewedBy', 'ReviewedAt', 'ReviewNote', 'LastUpdated'
    ],
    'AssessmentFlags': [
      'FlagID', 'SessionID', 'AssessmentID', 'RecordID', 'FlagType', 'FlagLabel', 'FlagStatus',
      'CreatedAt', 'AssignedTo', 'FollowUpStatus', 'ResolvedAt', 'ResolutionNote'
    ],
    'Quizzes': ['ResponseID', 'SessionID', 'RecordID', 'SubmittedAt', 'QuizType', 'QuestionNumber', 'SelectedAnswer', 'CorrectAnswer', 'IsCorrect'],
    'PostTest': ['ResponseID', 'SessionID', 'RecordID', 'SubmittedAt', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'TotalScore', 'ConfidenceScoreAfter'],
    'Appointments': [
      'AppointmentID', 'SessionID', 'RecordID', 'RequestedDate', 'RequestedTime', 'ConfirmedDate', 'ConfirmedTime',
      'Status', 'Reminder3Days', 'Reminder1Day', 'Attended', 'MissedReason', 'StaffNote', 'LastUpdated'
    ],
    'Questions': [
      'QuestionID', 'SessionID', 'RecordID', 'SubmittedAt', 'Anonymous', 'Category', 'QuestionText', 'Status',
      'StaffAnswer', 'AnsweredBy', 'AnsweredAt'
    ],
    'FollowUp': [
      'FollowUpID', 'SessionID', 'RecordID', 'AppointmentID', 'FollowUpDate', 'FollowUpBy', 'FollowUpRole',
      'FollowUpMethod', 'Result', 'Barrier', 'ParentConfirmed', 'NeedStaffCallback', 'Note'
    ],
    'SlideDecks': ['DeckID', 'DeckName', 'DeckVersion', 'Description', 'Active', 'CreatedAt', 'UpdatedAt', 'UpdatedBy'],
    'Slides': [
      'SlideID', 'DeckID', 'SlideOrder', 'SlideType', 'Title', 'Subtitle', 'BodyHtml', 'SpeakerNotes',
      'MediaUrl', 'Icon', 'AccentColor', 'DataSource', 'DataQueryKey', 'ActivityID', 'ShowQrCode',
      'AutoRefreshSeconds', 'DurationMinutes', 'ContentVersion', 'ReviewedBy', 'ReviewedAt', 'SourceNote',
      'Active', 'UpdatedAt', 'UpdatedBy'
    ],
    'LiveActivities': [
      'ActivityID', 'SessionID', 'SlideID', 'ActivityType', 'QuestionText', 'ResponseOptions', 'Status',
      'AcceptingResponses', 'ShowResults', 'StartedAt', 'ClosedAt', 'CreatedBy'
    ],
    'Logs': ['LogID', 'Timestamp', 'UserID', 'Role', 'Action', 'RecordID', 'Detail']
  };
}

/**
 * Helper to read sheet rows into Array of Objects
 */
function getSheetData(sheetName) {
  var ss = getDb();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Helper to append object to sheet
 */
function appendSheetRow(sheetName, dataObject) {
  var ss = getDb();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName(sheetName);
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = headers.map(function(h) {
    var val = dataObject[h];
    if (val === undefined || val === null) return '';
    // Prevent formula injection
    if (typeof val === 'string' && (val.indexOf('=') === 0 || val.indexOf('+') === 0 || val.indexOf('-') === 0 || val.indexOf('@') === 0)) {
      return "'" + val;
    }
    return val;
  });

  sheet.appendRow(rowValues);
}

/**
 * Migration helper to ensure legacy sheets acquire SessionID
 */
function migrateSpreadsheet() {
  return withLock(function() {
    setupSpreadsheet();
    writeAuditLog({ UserID: 'SYSTEM', Role: 'SYSTEM', Action: 'MIGRATE_DATABASE', Detail: 'Ran migrateSpreadsheet successfully' });
    return standardResponse(true, 'ย้ายและอัปเดตโครงสร้างข้อมูลสำเร็จ');
  });
}
