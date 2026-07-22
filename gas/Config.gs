/**
 * Config.gs - Configuration and Global Settings for EPI-KM Platform
 */

var CONFIG = {
  SPREADSHEET_ID: '1x3mtDHUeg0LGRn9g5P-q7v0JzLsCsbGghWOlu0-KBqI',
  APP_NAME: 'คลินิกวัคซีนเด็ก 0-5 ปี (EPI-KM)',
  SCORING_VERSION: 'PENDING_ACADEMIC_GUIDE',
  CACHE_EXPIRATION_SECONDS: 300, // 5 minutes cache
  DEFAULT_VILLAGES: [
    'หมู่ที่ 1 บ้านประจัน',
    'หมู่ที่ 2 บ้านประจันตะวันตก',
    'หมู่ที่ 3 บ้านควน',
    'หมู่ที่ 4 บ้านเกาะ',
    'หมู่ที่ 5 บ้านกาแป๊ะ'
  ],
  ROLES: {
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
    VOLUNTEER: 'VOLUNTEER',
    TRAINER: 'TRAINER'
  }
};

function getAppSettings() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  var clinicPhone = props.getProperty('CLINIC_PHONE') || '073-xxx-xxx';
  var emergencyPhone = props.getProperty('EMERGENCY_PHONE') || '1669';
  
  return {
    spreadsheetId: spreadsheetId,
    clinicPhone: clinicPhone,
    emergencyPhone: emergencyPhone,
    appName: CONFIG.APP_NAME,
    scoringVersion: CONFIG.SCORING_VERSION,
    villages: CONFIG.DEFAULT_VILLAGES
  };
}
