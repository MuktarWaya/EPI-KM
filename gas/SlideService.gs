/**
 * SlideService.gs - HTML Slide Deck Management & Live Activity State Engine
 */

function getPresenterState(sessionId) {
  var sessionRes = getTrainingSession(sessionId);
  if (!sessionRes.success) return sessionRes;

  var session = sessionRes.data;
  var liveActivities = getSheetData('LiveActivities').filter(function(a) { return a.SessionID === sessionId; });
  var activeActivity = liveActivities.find(function(a) { return a.Status === 'OPEN' || a.Status === 'PAUSED' || a.Status === 'REVEALED'; });

  // Compute live metrics
  var children = getSheetData('Children').filter(function(c) { return c.SessionID === sessionId; });
  var ksAssessments = getSheetData('AcceptanceAssessment').filter(function(k) { return k.SessionID === sessionId; });
  var appointments = getSheetData('Appointments').filter(function(ap) { return ap.SessionID === sessionId; });

  return standardResponse(true, 'ดึงสถานะ Presenter สำเร็จ', {
    session: session,
    participantCount: children.length,
    ksCompletedCount: ksAssessments.length,
    appointmentCount: appointments.length,
    activeActivity: activeActivity || null
  });
}

function getAudienceSlide(sessionId) {
  var stateRes = getPresenterState(sessionId);
  if (!stateRes.success) return stateRes;

  var data = stateRes.data;

  // Filter aggregate stats only - ABSOLUTELY NO PII
  var ksAssessments = getSheetData('AcceptanceAssessment').filter(function(k) { return k.SessionID === sessionId; });
  var ksDistribution = { Q1: [0,0,0,0,0], Q2: [0,0,0,0,0], Q3: [0,0,0,0,0], Q4: [0,0,0,0,0], Q5: [0,0,0,0,0], Q6: [0,0,0,0,0], Q7: [0,0,0,0,0], Q8: [0,0,0,0,0] };

  ksAssessments.forEach(function(k) {
    for (var i = 1; i <= 8; i++) {
      var score = Number(k['Q' + i]);
      if (score >= 1 && score <= 5) {
        ksDistribution['Q' + i][score - 1]++;
      }
    }
  });

  return standardResponse(true, 'ดึงสไลด์ Audience สำเร็จ', {
    sessionCode: data.session.SessionCode,
    facilityName: data.session.FacilityName,
    participantCount: data.participantCount,
    ksCompletedCount: data.ksCompletedCount,
    appointmentCount: data.appointmentCount,
    activeActivity: data.activeActivity,
    ksDistribution: ksDistribution
  });
}

function openLiveActivity(activityId) {
  return withLock(function() {
    var ss = getDb();
    var sheet = ss.getSheetByName('LiveActivities');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ActivityID');
    var statusIndex = headers.indexOf('Status');
    var startedAtIndex = headers.indexOf('StartedAt');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === activityId) {
        sheet.getRange(i + 1, statusIndex + 1).setValue('OPEN');
        sheet.getRange(i + 1, startedAtIndex + 1).setValue(new Date().toISOString());
        return standardResponse(true, 'เปิดรับคำตอบกิจกรรมสดเรียบร้อยแล้ว');
      }
    }
    return standardResponse(false, 'ไม่พบ ActivityID ที่ระบุ');
  });
}
