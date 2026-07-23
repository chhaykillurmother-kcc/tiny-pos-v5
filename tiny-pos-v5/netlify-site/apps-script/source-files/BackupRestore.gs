/** Tiny POS v3.6 automated backup and controlled restore. */
function backupFolder_() {
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty('BACKUP_FOLDER_ID');
  if(id){try{return DriveApp.getFolderById(id);}catch(error){}}
  const folder=DriveApp.createFolder('Tiny POS Backups');
  props.setProperty('BACKUP_FOLDER_ID',folder.getId());
  return folder;
}

function createTinyPosBackup_(user, type, note) {
  const ss=getSpreadsheet_(),stamp=Utilities.formatDate(new Date(),POS.TIME_ZONE,'yyyyMMdd-HHmmss');
  const folder=backupFolder_();
  const source=DriveApp.getFileById(ss.getId());
  const copy=source.makeCopy(ss.getName()+' Backup '+stamp,folder);
  const now=new Date();
  appendObject_(POS.SHEETS.BACKUPS,{BackupID:uuid_('BKP'),DateTime:now,FileID:copy.getId(),FileName:copy.getName(),FileURL:copy.getUrl(),BackupType:String(type||'MANUAL'),CreatedByID:user?user.UserID:'SYSTEM',CreatedByName:user?user.Name:'SYSTEM',Note:sanitizeText_(note,250),Status:'AVAILABLE',CreatedAt:now});
  pruneTinyPosBackups_();
  return {fileId:copy.getId(),fileName:copy.getName(),url:copy.getUrl(),dateTime:now.toISOString()};
}

function createManualBackup(sessionToken, note) {
  const user=requireSession_(sessionToken);requirePermission_(user,'BACKUP');
  return createTinyPosBackup_(user,'MANUAL',note);
}

function runScheduledTinyPosBackup() {
  try{return createTinyPosBackup_(null,'AUTOMATIC','Scheduled backup');}
  catch(error){console.error('Scheduled backup failed:',error&&error.stack?error.stack:error);throw error;}
}

function pruneTinyPosBackups_() {
  const retention=Math.max(1,Math.min(365,Math.floor(number_(settingValueV38_('BACKUP_RETENTION_COUNT')||30))));
  const rows=getRows_(POS.SHEETS.BACKUPS).filter(function(row){return String(row.Status||'AVAILABLE')==='AVAILABLE';}).sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);});
  rows.slice(retention).forEach(function(row){
    try{DriveApp.getFileById(String(row.FileID)).setTrashed(true);}catch(error){}
    updateRowObject_(POS.SHEETS.BACKUPS,row._row,{Status:'TRASHED'});
  });
}

function configureBackupSchedule(sessionToken, payload) {
  const user=requireSession_(sessionToken);requireRole_(user,[POS.ROLES.ADMIN]);requirePermission_(user,'BACKUP');payload=payload||{};
  const enabled=payload.enabled===true;const frequency=['DAILY','WEEKLY'].indexOf(String(payload.frequency||'DAILY').toUpperCase())>=0?String(payload.frequency).toUpperCase():'DAILY';const hour=Math.max(0,Math.min(23,Math.floor(number_(payload.hour,2))));const retention=Math.max(1,Math.min(365,Math.floor(number_(payload.retention,30))));
  setSetting_('AUTO_BACKUP_ENABLED',enabled?'TRUE':'FALSE','BOOLEAN');setSetting_('AUTO_BACKUP_FREQUENCY',frequency,'STRING');setSetting_('AUTO_BACKUP_HOUR',String(hour),'NUMBER');setSetting_('BACKUP_RETENTION_COUNT',String(retention),'NUMBER');
  ScriptApp.getProjectTriggers().forEach(function(trigger){if(trigger.getHandlerFunction()==='runScheduledTinyPosBackup')ScriptApp.deleteTrigger(trigger);});
  if(enabled){let builder=ScriptApp.newTrigger('runScheduledTinyPosBackup').timeBased().atHour(hour);if(frequency==='WEEKLY')builder=builder.onWeekDay(ScriptApp.WeekDay.SUNDAY);else builder=builder.everyDays(1);builder.create();}
  audit_(user.UserID,'CONFIGURE_BACKUP','Backup','',{enabled:enabled,frequency:frequency,hour:hour,retention:retention});
  return getBackupManagerData(sessionToken);
}

function getBackupManagerData(sessionToken) {
  const user=requireSession_(sessionToken);requirePermission_(user,'BACKUP');
  return {settings:{enabled:bool_(settingValueV38_('AUTO_BACKUP_ENABLED')),frequency:String(settingValueV38_('AUTO_BACKUP_FREQUENCY')||'DAILY'),hour:number_(settingValueV38_('AUTO_BACKUP_HOUR'),2),retention:number_(settingValueV38_('BACKUP_RETENTION_COUNT'),30)},backups:getRows_(POS.SHEETS.BACKUPS).filter(function(row){return String(row.Status||'AVAILABLE')==='AVAILABLE';}).sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);}).slice(0,100).map(function(row){return {backupId:String(row.BackupID),dateTime:row.DateTime?new Date(row.DateTime).toISOString():'',fileName:String(row.FileName),url:String(row.FileURL),type:String(row.BackupType),createdBy:String(row.CreatedByName),note:String(row.Note)};})};
}

function restoreTinyPosBackup(sessionToken, backupId, confirmation) {
  const user=requireSession_(sessionToken);requireRole_(user,[POS.ROLES.ADMIN]);requirePermission_(user,'BACKUP');
  if(String(confirmation||'').trim().toUpperCase()!=='RESTORE')throw new Error('Type RESTORE to confirm.');
  const backup=findRowBy_(POS.SHEETS.BACKUPS,'BackupID',backupId);if(!backup||String(backup.Status||'AVAILABLE')!=='AVAILABLE')throw new Error('Backup not found.');
  return withScriptLock_(function(){
    const safety=createTinyPosBackup_(user,'PRE_RESTORE','Automatic safety backup before restoring '+backup.FileName);
    const source=SpreadsheetApp.openById(String(backup.FileID)),target=getSpreadsheet_();
    Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName){
      const sourceSheet=source.getSheetByName(sheetName);if(!sourceSheet)return;
      let targetSheet=target.getSheetByName(sheetName);if(!targetSheet)targetSheet=target.insertSheet(sheetName);
      const values=sourceSheet.getDataRange().getValues();targetSheet.clearContents();
      if(values.length&&values[0].length){if(values[0].length>targetSheet.getMaxColumns())targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(),values[0].length-targetSheet.getMaxColumns());if(values.length>targetSheet.getMaxRows())targetSheet.insertRowsAfter(targetSheet.getMaxRows(),values.length-targetSheet.getMaxRows());targetSheet.getRange(1,1,values.length,values[0].length).setValues(values);targetSheet.setFrozenRows(1);}
    });
    installTinyPOSCompleteSilent_();
    audit_(user.UserID,'RESTORE_BACKUP','Backup',backupId,{fileName:backup.FileName,safetyBackup:safety.fileName});
    return {success:true,restoredFile:String(backup.FileName),safetyBackup:safety};
  });
}

function installTinyPOSCompleteSilent_() {
  const ss=getSpreadsheet_(),report=[];
  Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName){ensureTinyPosSheet_(ss,sheetName,TINY_POS_SCHEMA[sheetName],report);});
  Object.keys(DEFAULT_SETTINGS).forEach(function(key){if(!findRowBy_(POS.SHEETS.SETTINGS,'Key',key))setSetting_(key,DEFAULT_SETTINGS[key],'STRING');});
  ensureDefaultBranch_();syncMainBranchInventory_();
  return report;
}
