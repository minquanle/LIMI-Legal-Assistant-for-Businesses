$ErrorActionPreference='Stop'
$taskReport=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../outputs/B16-rollback-drill.json'))
$taskOverride=Join-Path $PSScriptRoot '.rollback-drill.yml'
Push-Location (Join-Path $PSScriptRoot '..')
$timer=[Diagnostics.Stopwatch]::StartNew()
try {
 $before=(& docker inspect limi-staging-web-1 --format '{{.Image}}').Trim()
 if($LASTEXITCODE -ne 0){throw 'Staging web must already be running'}
 @'
services:
  web:
    command: [node, -e, "process.exit(42)"]
    restart: 'no'
'@ | Set-Content -LiteralPath $taskOverride -Encoding ascii
 & docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/.rollback-drill.yml up -d --no-deps --force-recreate web
 if($LASTEXITCODE -ne 0){throw 'Failure simulation could not start'}
 Start-Sleep -Seconds 2
 $state=(& docker inspect limi-staging-web-1 --format '{{.State.ExitCode}}').Trim()
 if($state -ne '42'){throw 'Expected simulated bad startup was not observed'}
} finally {
 & docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml up -d --no-deps --force-recreate web
 if($LASTEXITCODE -ne 0){throw 'Application rollback failed'}
 Pop-Location
}
$after=(& docker inspect limi-staging-web-1 --format '{{.Image}}').Trim()
if($after -ne $before){throw 'Rollback did not return to saved image'}
$env:LIMI_VERIFY_URL='https://localhost:8443'
$env:LIMI_CA_FILE=Join-Path $PSScriptRoot 'localhost-root.crt'
try {
 & node (Join-Path $PSScriptRoot 'verify-local.mjs')
 if($LASTEXITCODE -ne 0){throw 'Post-rollback HTTPS verification failed'}
 @{status='passed';createdAt=[DateTime]::UtcNow.ToString('o');scenario='Simulated bad web startup config, restored saved application image';savedImage=$before;restoredImage=$after;elapsedSeconds=$timer.Elapsed.TotalSeconds;databaseRollbackPerformed=$false;productionSchemaBackwardCompatibilityConfirmed=$false} | ConvertTo-Json | Set-Content -LiteralPath $taskReport -Encoding utf8
} finally {Remove-Item Env:\LIMI_VERIFY_URL -ErrorAction SilentlyContinue;Remove-Item Env:\LIMI_CA_FILE -ErrorAction SilentlyContinue}
