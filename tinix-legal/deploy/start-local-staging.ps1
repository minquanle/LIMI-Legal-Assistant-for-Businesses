param([string]$BackupFolder)
$ErrorActionPreference='Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
 function Compose([string[]]$Arguments) {
   & docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml @Arguments
   if($LASTEXITCODE -ne 0){throw 'Staging Docker operation failed'}
 }
 if(!(Test-Path -LiteralPath (Join-Path $PSScriptRoot '.staging.env'))){& node deploy/init-staging.mjs; if($LASTEXITCODE -ne 0){throw 'Initialization failed'}}
 Compose @('build','api','web','migrate')
 Compose @('up','-d','--wait','postgres','redis','minio')
 if($BackupFolder){
   $taskBackupPath=[IO.Path]::GetFullPath($BackupFolder)
   if(!(Test-Path -LiteralPath (Join-Path $taskBackupPath 'manifest.json'))){throw 'Missing backup manifest'}
   $tables=& docker exec limi-staging-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema=''public''"'
   if($LASTEXITCODE -ne 0 -or [int]$tables -ne 0){throw 'Restore requires an empty staging database. Existing data is never reset.'}
   & docker cp (Join-Path $taskBackupPath 'database.dump') 'limi-staging-postgres-1:/tmp/limi-backup.dump'
   if($LASTEXITCODE -ne 0){throw 'Copy failed'}
   & docker exec limi-staging-postgres-1 sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --exit-on-error --no-owner --no-acl /tmp/limi-backup.dump'
   if($LASTEXITCODE -ne 0){throw 'Restore failed'}
   Compose @('run','--rm','--no-deps','-e','LIMI_RESTORE_NEW_ENVIRONMENT=true','-v',"${taskBackupPath}:/backup:ro",'storage-init','node','deploy/restore-objects.mjs','/backup')
 }
 Compose @('run','--rm','migrate')
 Compose @('run','--rm','storage-init')
 Compose @('up','-d','--wait','api','worker','scheduler','web','gateway')
 Write-Output 'Local HTTPS staging is at https://localhost:8443/workspace. Existing port 3000 remains independent.'
} finally {Pop-Location}
