/**
 * Code.gs - Main Google Apps Script Controller and WebApp API Gateway
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PING';
  var payload = e && e.parameter ? e.parameter : {};

  try {
    var response = handleApiRoute(action, payload);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errMsg = err && err.message ? err.message : err.toString();
    return ContentService.createTextOutput(JSON.stringify(standardResponse(false, 'เกิดข้อผิดพลาดในการประมวลผล: ' + errMsg, null, errMsg)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    var action = postData.action || (e && e.parameter && e.parameter.action) || 'PING';
    var response = handleApiRoute(action, postData);

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errMsg = err && err.message ? err.message : err.toString();
    return ContentService.createTextOutput(JSON.stringify(standardResponse(false, 'เกิดข้อผิดพลาดในการประมวลผล: ' + errMsg, null, errMsg)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiRoute(action, data) {
  switch (action) {
    case 'PING':
      return standardResponse(true, 'EPI-KM GAS API Service Ready', { timestamp: new Date().toISOString() });

    case 'SETUP_SPREADSHEET':
      return setupSpreadsheet();

    case 'MIGRATE_SPREADSHEET':
      return migrateSpreadsheet();

    case 'CREATE_SESSION':
      return createTrainingSession(data);

    case 'GET_SESSIONS':
      return getTrainingSessions(data);

    case 'GET_SESSION':
      return getTrainingSession(data.sessionId || data.sessionCode);

    case 'CLOSE_SESSION':
      return closeTrainingSession(data.sessionId, data.closedBy);

    case 'REGISTER_PARTICIPANT':
      return registerParentAndChild(data);

    case 'SUBMIT_PRETEST':
      return savePreTest(data);

    case 'SUBMIT_POSTTEST':
      return savePostTest(data);

    case 'SUBMIT_KS_MODEL':
      return saveAcceptanceAssessment(data);

    case 'GET_PRESENTER_STATE':
      return getPresenterState(data.sessionId);

    case 'GET_AUDIENCE_SLIDE':
      return getAudienceSlide(data.sessionId);

    case 'OPEN_LIVE_ACTIVITY':
      return openLiveActivity(data.activityId);

    case 'GENERATE_HANDOVER':
      return generateSessionHandoverSummary(data.sessionId);

    case 'EXPORT_FOLLOWUP_CSV':
      return exportSessionFollowUpCsv(data.sessionId);

    case 'GET_DASHBOARD_ANALYTICS':
      return getDashboardAnalytics(data);

    default:
      return standardResponse(false, 'ไม่พบ Action ที่ระบุ: ' + action, null, 'INVALID_ACTION');
  }
}

/**
 * Utility Functions
 */
function standardResponse(success, message, data, error) {
  return {
    success: success,
    message: message || (success ? 'สำเร็จ' : 'ล้มเหลว'),
    data: data || null,
    error: error || null
  };
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function validatePhone(phone) {
  if (!phone) return '';
  var cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && (cleaned.startsWith('06') || cleaned.startsWith('08') || cleaned.startsWith('09') || cleaned.startsWith('07'))) {
    return cleaned;
  }
  return cleaned || phone;
}

function calculateAgeMonths(birthDate) {
  var today = new Date();
  var months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
}

function generateId(prefix) {
  return (prefix || 'ID') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000).toString(36);
}

function writeAuditLog(data) {
  try {
    appendSheetRow('Logs', {
      LogID: generateId('LOG'),
      Timestamp: new Date().toISOString(),
      UserID: data.UserID || 'SYSTEM',
      Role: data.Role || 'SYSTEM',
      Action: data.Action || 'UNSPECIFIED',
      RecordID: data.RecordID || '',
      Detail: data.Detail || ''
    });
  } catch (e) {
    Logger.log('Error writing audit log: ' + e.toString());
  }
}
