/**
 * SessionService.gs - Multi-session Management for Trainers and Facilities
 */

function createTrainingSession(data) {
  return withLock(function() {
    var sessionCode = data.sessionCode || ('EPI-' + Math.floor(100000 + Math.random() * 900000));
    var sessionId = generateId('SES');
    var now = new Date().toISOString();

    var sessionData = {
      SessionID: sessionId,
      SessionCode: sessionCode,
      FacilityName: sanitizeInput(data.facilityName || 'รพ.สต.ประจัน'),
      FacilityType: sanitizeInput(data.facilityType || 'รพ.สต.'),
      Province: sanitizeInput(data.province || 'ปัตตานี'),
      District: sanitizeInput(data.district || 'มายอ'),
      Subdistrict: sanitizeInput(data.subdistrict || 'ประจัน'),
      TrainingDate: data.trainingDate || now.split('T')[0],
      StartTime: data.startTime || '09:00',
      EndTime: data.endTime || '12:00',
      TrainerName: sanitizeInput(data.trainerName || 'วิทยากรสาธารณสุข'),
      CoordinatorName: sanitizeInput(data.coordinatorName || 'เจ้าหน้าที่ผู้ประสานงาน'),
      CoordinatorPhone: sanitizeInput(data.coordinatorPhone || '073-xxx-xxx'),
      ClinicDay: sanitizeInput(data.clinicDay || 'ทุกวันพุธ'),
      ClinicTime: sanitizeInput(data.clinicTime || '08:30 - 12:00'),
      ClinicPhone: sanitizeInput(data.clinicPhone || '073-xxx-xxx'),
      EmergencyPhone: sanitizeInput(data.emergencyPhone || '1669'),
      ExpectedParticipants: data.expectedParticipants || 30,
      ParticipatingVillages: JSON.stringify(data.participatingVillages || CONFIG.DEFAULT_VILLAGES),
      DeckID: data.deckID || 'DEFAULT_EPI_DECK',
      SessionStatus: 'OPEN',
      AcceptingResponses: 'YES',
      DataRetentionPolicy: 'KEEP_IDENTIFIABLE_TEMPORARILY',
      CreatedAt: now,
      CreatedBy: sanitizeInput(data.createdBy || 'SYSTEM'),
      OpenedAt: now,
      ClosedAt: '',
      ClosedBy: '',
      ExportedAt: '',
      ExportedBy: '',
      ArchivedAt: '',
      Note: sanitizeInput(data.note || '')
    };

    appendSheetRow('TrainingSessions', sessionData);
    writeAuditLog({ UserID: data.createdBy || 'SYSTEM', Role: 'TRAINER', Action: 'CREATE_SESSION', RecordID: sessionId, Detail: 'Created session code ' + sessionCode });

    return standardResponse(true, 'สร้างรอบการสอนใหม่สำเร็จ', sessionData);
  });
}

function getTrainingSessions(filters) {
  var sessions = getSheetData('TrainingSessions');
  if (filters && filters.status) {
    sessions = sessions.filter(function(s) { return s.SessionStatus === filters.status; });
  }
  return standardResponse(true, 'ดึงรายการรอบการสอนสำเร็จ', sessions);
}

function getTrainingSession(sessionIdOrCode) {
  var sessions = getSheetData('TrainingSessions');
  var match = sessions.find(function(s) {
    return s.SessionID === sessionIdOrCode || s.SessionCode === sessionIdOrCode;
  });
  if (!match) {
    return standardResponse(false, 'ไม่พบรอบการสอนที่ระบุ', null, 'SESSION_NOT_FOUND');
  }
  return standardResponse(true, 'ค้นหารอบการสอนสำเร็จ', match);
}

function closeTrainingSession(sessionId, closedBy) {
  return withLock(function() {
    var ss = getDb();
    var sheet = ss.getSheetByName('TrainingSessions');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('SessionID');
    var statusIndex = headers.indexOf('SessionStatus');
    var acceptIndex = headers.indexOf('AcceptingResponses');
    var closedAtIndex = headers.indexOf('ClosedAt');
    var closedByIndex = headers.indexOf('ClosedBy');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === sessionId) {
        var now = new Date().toISOString();
        sheet.getRange(i + 1, statusIndex + 1).setValue('CLOSED');
        sheet.getRange(i + 1, acceptIndex + 1).setValue('NO');
        sheet.getRange(i + 1, closedAtIndex + 1).setValue(now);
        sheet.getRange(i + 1, closedByIndex + 1).setValue(closedBy || 'TRAINER');
        writeAuditLog({ UserID: closedBy || 'TRAINER', Role: 'TRAINER', Action: 'CLOSE_SESSION', RecordID: sessionId, Detail: 'Closed session ' + sessionId });
        return standardResponse(true, 'ปิดรอบการสอนเรียบร้อยแล้ว');
      }
    }
    return standardResponse(false, 'ไม่พบ SessionID ที่ระบุ');
  });
}
