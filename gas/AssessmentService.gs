/**
 * AssessmentService.gs - Registration, KS Model Likert Assessment, Flag Routing & Parent Journey
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
      Village: sanitizeInput(data.village),
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
