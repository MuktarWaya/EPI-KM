/**
 * ExportService.gs - Handover & Export Engine for Facility Handover
 */

function generateSessionHandoverSummary(sessionId) {
  var sessionRes = getTrainingSession(sessionId);
  if (!sessionRes.success) return sessionRes;

  var session = sessionRes.data;
  var children = getSheetData('Children').filter(function(c) { return c.SessionID === sessionId; });
  var flags = getSheetData('AssessmentFlags').filter(function(f) { return f.SessionID === sessionId; });
  var appointments = getSheetData('Appointments').filter(function(a) { return a.SessionID === sessionId; });
  var questions = getSheetData('Questions').filter(function(q) { return q.SessionID === sessionId && q.Status === 'PENDING'; });

  var summary = {
    sessionCode: session.SessionCode,
    facilityName: session.FacilityName,
    trainingDate: session.TrainingDate,
    trainerName: session.TrainerName,
    totalParticipants: children.length,
    totalChildren: children.length,
    openFlagsCount: flags.filter(function(f) { return f.FlagStatus === 'OPEN'; }).length,
    pendingAppointmentsCount: appointments.filter(function(a) { return a.Status === 'REQUESTED'; }).length,
    pendingQuestionsCount: questions.length,
    generatedAt: new Date().toISOString()
  };

  writeAuditLog({ UserID: 'SYSTEM', Role: 'TRAINER', Action: 'GENERATE_HANDOVER_SUMMARY', RecordID: sessionId, Detail: 'Generated handover report for ' + session.FacilityName });

  return standardResponse(true, 'สร้างรายงานสรุปการส่งมอบสำเร็จ', summary);
}

function exportSessionFollowUpCsv(sessionId) {
  var children = getSheetData('Children').filter(function(c) { return c.SessionID === sessionId; });
  var flags = getSheetData('AssessmentFlags').filter(function(f) { return f.SessionID === sessionId; });

  var csvRows = [
    ['RecordID', 'ChildName', 'ParentName', 'Phone', 'Village', 'VolunteerName', 'VaccineStatus', 'FlagLabels']
  ];

  children.forEach(function(c) {
    var childFlags = flags.filter(function(f) { return f.RecordID === c.RecordID; }).map(function(f) { return f.FlagLabel; }).join(' | ');
    csvRows.push([
      c.RecordID,
      c.ChildName,
      c.ParentName,
      c.Phone,
      c.Village,
      c.VolunteerName,
      c.VaccineStatus,
      childFlags
    ]);
  });

  var csvString = csvRows.map(function(row) {
    return row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');

  return standardResponse(true, 'Export CSV ติดตามงานสำเร็จ', { csvData: csvString });
}
