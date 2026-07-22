/**
 * AssessmentService.gs - Registration, PreTest, KS Model Likert Assessment, PostTest & Flag Routing
 */

function registerParentAndChild(data) {
  return withLock(function() {
    var recordId = generateId('REC');
    var now = new Date().toISOString();
    var birthDate = new Date(data.birthDate);
    var ageMonths = calculateAgeMonths(birthDate);

    var record = {
      RecordID: recordId,
      SessionID: data.sessionId || 'DEFAULT',
      CreatedAt: now,
      ParentName: sanitizeInput(data.parentName),
      Relationship: sanitizeInput(data.relationship || 'มารดา'),
      Phone: validatePhone(data.phone),
      LineID: sanitizeInput(data.lineId || ''),
      ChildName: sanitizeInput(data.childName),
      BirthDate: data.birthDate,
      AgeMonths: ageMonths,
      Gender: sanitizeInput(data.gender || 'ไม่ระบุ'),
      HouseNo: sanitizeInput(data.houseNo || ''),
      Village: sanitizeInput(data.village || ''),
      Subdistrict: sanitizeInput(data.subdistrict || ''),
      District: sanitizeInput(data.district || ''),
      VolunteerName: sanitizeInput(data.volunteerName || ''),
      HasVaccineBook: data.hasVaccineBook ? 'YES' : 'NO',
      Consent: data.consent ? 'YES' : 'NO',
      VaccineStatus: 'PENDING_CHECK',
      MissingVaccine: '',
      StaffNote: '',
      LastUpdated: now
    };

    appendSheetRow('Children', record);
    writeAuditLog({ UserID: 'PARENT', Role: 'PARENT', Action: 'REGISTER_CHILD', RecordID: recordId, Detail: 'Registered child ' + data.childName });

    return standardResponse(true, 'ลงทะเบียนสำเร็จ', record);
  });
}

function savePreTest(data) {
  return withLock(function() {
    var responseId = generateId('PRE');
    var now = new Date().toISOString();

    var record = {
      ResponseID: responseId,
      SessionID: data.sessionId || 'DEFAULT',
      RecordID: data.recordId,
      SubmittedAt: now,
      Q1: data.q1 || '', Q2: data.q2 || '', Q3: data.q3 || '', Q4: data.q4 || '', Q5: data.q5 || '',
      Q6: data.q6 || '', Q7: data.q7 || '', Q8: data.q8 || '', Q9: data.q9 || '', Q10: data.q10 || '',
      TotalScore: Number(data.totalScore || 0)
    };

    appendSheetRow('PreTest', record);
    writeAuditLog({ UserID: 'PARENT', Role: 'PARENT', Action: 'SUBMIT_PRETEST', RecordID: data.recordId, Detail: 'Submitted PreTest score: ' + data.totalScore });

    return standardResponse(true, 'บันทึกแบบประเมินก่อนเรียนสำเร็จ', record);
  });
}

function savePostTest(data) {
  return withLock(function() {
    var responseId = generateId('PST');
    var now = new Date().toISOString();

    var record = {
      ResponseID: responseId,
      SessionID: data.sessionId || 'DEFAULT',
      RecordID: data.recordId,
      SubmittedAt: now,
      Q1: data.q1 || '', Q2: data.q2 || '', Q3: data.q3 || '', Q4: data.q4 || '', Q5: data.q5 || '',
      Q6: data.q6 || '', Q7: data.q7 || '', Q8: data.q8 || '', Q9: data.q9 || '', Q10: data.q10 || '',
      TotalScore: Number(data.totalScore || 0),
      ConfidenceScoreAfter: Number(data.confidenceScoreAfter || 5)
    };

    appendSheetRow('PostTest', record);
    writeAuditLog({ UserID: 'PARENT', Role: 'PARENT', Action: 'SUBMIT_POSTTEST', RecordID: data.recordId, Detail: 'Submitted PostTest score: ' + data.totalScore });

    return standardResponse(true, 'บันทึกแบบประเมินหลังเรียนสำเร็จ', record);
  });
}

function saveAcceptanceAssessment(data) {
  return withLock(function() {
    var assessmentId = generateId('KSM');
    var now = new Date().toISOString();

    var q1 = Number(data.q1);
    var q2 = Number(data.q2);
    var q3 = Number(data.q3);
    var q4 = Number(data.q4);
    var q5 = Number(data.q5);
    var q6 = Number(data.q6);
    var q7 = Number(data.q7);
    var q8 = Number(data.q8);

    // Calculate Routing Flags without cutoff/scoring sum
    var flagSafety = q5 >= 4 ? 'YES' : 'NO';
    var flagReligious = q6 >= 4 ? 'YES' : 'NO';
    var flagAccess = q7 >= 4 ? 'YES' : 'NO';
    var flagSocialMedia = q8 >= 4 ? 'YES' : 'NO';
    var flagLowAppt = q4 <= 2 ? 'YES' : 'NO';
    var flagLowConfidence = (q1 <= 2 || q2 <= 2) ? 'YES' : 'NO';

    var record = {
      AssessmentID: assessmentId,
      SessionID: data.sessionId || 'DEFAULT',
      RecordID: data.recordId,
      SubmittedAt: now,
      Q1: q1, Q2: q2, Q3: q3, Q4: q4, Q5: q5, Q6: q6, Q7: q7, Q8: q8,
      Suggestion: sanitizeInput(data.suggestion || ''),
      FlagSafetyConcern: flagSafety,
      FlagReligiousBelief: flagReligious,
      FlagAccessBarrier: flagAccess,
      FlagSocialMedia: flagSocialMedia,
      FlagLowAppointmentIntention: flagLowAppt,
      FlagLowConfidence: flagLowConfidence,
      ClassificationStatus: 'รอเจ้าหน้าที่ประเมิน',
      ClassificationResult: '',
      ScoringVersion: CONFIG.SCORING_VERSION,
      ReviewedBy: '',
      ReviewedAt: '',
      ReviewNote: '',
      LastUpdated: now
    };

    appendSheetRow('AcceptanceAssessment', record);
    generateAssessmentFlags(record);
    writeAuditLog({ UserID: 'PARENT', Role: 'PARENT', Action: 'SUBMIT_KS_MODEL', RecordID: data.recordId, Detail: 'Submitted KS Model assessment' });

    return standardResponse(true, 'บันทึกแบบประเมินเรียบร้อยแล้ว', {
      assessment: record,
      personalizedFlags: {
        safety: flagSafety === 'YES',
        religious: flagReligious === 'YES',
        access: flagAccess === 'YES',
        socialMedia: flagSocialMedia === 'YES',
        lowAppointment: flagLowAppt === 'YES',
        lowConfidence: flagLowConfidence === 'YES'
      }
    });
  });
}

function generateAssessmentFlags(assessment) {
  var flagsToCreate = [];
  if (assessment.FlagSafetyConcern === 'YES') {
    flagsToCreate.push({ type: 'SAFETY_CONCERN', label: 'ต้องการข้อมูลความปลอดภัยและผลข้างเคียง' });
  }
  if (assessment.FlagReligiousBelief === 'YES') {
    flagsToCreate.push({ type: 'RELIGIOUS_BELIEF_CONCERN', label: 'ต้องการปรึกษาข้อสงสัยทางศาสนาและฮาลาล' });
  }
  if (assessment.FlagAccessBarrier === 'YES') {
    flagsToCreate.push({ type: 'ACCESS_BARRIER', label: 'มีอุปสรรคการเดินทางหรือเวลาทำงาน' });
  }
  if (assessment.FlagSocialMedia === 'YES') {
    flagsToCreate.push({ type: 'SOCIAL_MEDIA_INFLUENCE', label: 'ต้องการข่าวสารวัคซีนที่ถูกต้อง' });
  }
  if (assessment.FlagLowAppointmentIntention === 'YES') {
    flagsToCreate.push({ type: 'LOW_APPOINTMENT_INTENTION', label: 'ต้องการการสนับสนุนวันนัด' });
  }
  if (assessment.FlagLowConfidence === 'YES') {
    flagsToCreate.push({ type: 'LOW_CONFIDENCE', label: 'ต้องการข้อมูลเสริมสร้างความเชื่อมั่น' });
  }

  flagsToCreate.forEach(function(item) {
    var flagId = generateId('FLG');
    appendSheetRow('AssessmentFlags', {
      FlagID: flagId,
      SessionID: assessment.SessionID,
      AssessmentID: assessment.AssessmentID,
      RecordID: assessment.RecordID,
      FlagType: item.type,
      FlagLabel: item.label,
      FlagStatus: 'OPEN',
      CreatedAt: new Date().toISOString(),
      AssignedTo: '',
      FollowUpStatus: 'PENDING',
      ResolvedAt: '',
      ResolutionNote: ''
    });
  });
}

function getDashboardAnalytics(data) {
  var filterStartDate = data && data.startDate ? data.startDate : '';
  var filterEndDate = data && data.endDate ? data.endDate : '';
  var filterVillage = data && data.village ? data.village : 'ALL';
  var filterSubdistrict = data && data.subdistrict ? data.subdistrict.trim().toLowerCase() : 'ALL';
  var filterSessionId = data && data.sessionId ? data.sessionId : '';

  // Get Children map
  var children = getSheetData('Children') || [];
  var childMap = {};
  children.forEach(function(c) {
    if (c.RecordID) childMap[c.RecordID] = c;
  });

  // Get KS Model Assessments
  var ksRecords = getSheetData('AcceptanceAssessment') || [];
  var filteredKs = ksRecords.filter(function(row) {
    var record = childMap[row.RecordID] || {};
    var dateStr = row.SubmittedAt ? row.SubmittedAt.substring(0, 10) : '';

    if (filterSessionId && row.SessionID !== filterSessionId && filterSessionId !== 'ALL') {
      return false;
    }
    if (filterStartDate && dateStr < filterStartDate) return false;
    if (filterEndDate && dateStr > filterEndDate) return false;
    if (filterVillage && filterVillage !== 'ALL' && record.Village !== filterVillage) return false;
    if (filterSubdistrict && filterSubdistrict !== 'all' && filterSubdistrict !== '') {
      var sub = (record.Subdistrict || '').toLowerCase();
      if (sub.indexOf(filterSubdistrict) === -1) return false;
    }
    return true;
  });

  // Get PreTest Assessments
  var preRecords = getSheetData('PreTest') || [];
  var filteredPre = preRecords.filter(function(row) {
    var record = childMap[row.RecordID] || {};
    var dateStr = row.SubmittedAt ? row.SubmittedAt.substring(0, 10) : '';

    if (filterSessionId && row.SessionID !== filterSessionId && filterSessionId !== 'ALL') {
      return false;
    }
    if (filterStartDate && dateStr < filterStartDate) return false;
    if (filterEndDate && dateStr > filterEndDate) return false;
    if (filterVillage && filterVillage !== 'ALL' && record.Village !== filterVillage) return false;
    if (filterSubdistrict && filterSubdistrict !== 'all' && filterSubdistrict !== '') {
      var sub = (record.Subdistrict || '').toLowerCase();
      if (sub.indexOf(filterSubdistrict) === -1) return false;
    }
    return true;
  });

  // Compute KS Model Item Averages Q1..Q8
  var ksItemSums = [0, 0, 0, 0, 0, 0, 0, 0];
  var ksTotalScoreSum = 0;
  var ksCount = filteredKs.length;

  filteredKs.forEach(function(row) {
    var sumRow = 0;
    for (var i = 1; i <= 8; i++) {
      var val = Number(row['Q' + i] || 0);
      ksItemSums[i - 1] += val;
      sumRow += val;
    }
    ksTotalScoreSum += sumRow;
  });

  var ksItemAverages = ksItemSums.map(function(sum) {
    return ksCount > 0 ? (sum / ksCount).toFixed(2) : 0;
  });
  var ksOverallAvg = ksCount > 0 ? (ksTotalScoreSum / (ksCount * 8)).toFixed(2) : 0;

  // Compute PreTest Averages
  var preTotalScoreSum = 0;
  var preCount = filteredPre.length;
  filteredPre.forEach(function(row) {
    preTotalScoreSum += Number(row.TotalScore || 0);
  });
  var preOverallAvg = preCount > 0 ? (preTotalScoreSum / preCount).toFixed(2) : 0;

  return standardResponse(true, 'ดึงข้อมูล analytics สำเร็จ', {
    totalRespondents: ksCount,
    preTestCount: preCount,
    preTestAvgScore: preOverallAvg,
    ksOverallAvg: ksOverallAvg,
    ksItemAverages: ksItemAverages,
    filterApplied: {
      startDate: filterStartDate,
      endDate: filterEndDate,
      village: filterVillage,
      subdistrict: filterSubdistrict
    }
  });
}

