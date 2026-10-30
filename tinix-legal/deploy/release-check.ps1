$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
function Invoke-Check([string]$Directory, [string[]]$Arguments) {
    Push-Location $Directory
    try { & npm @Arguments; if ($LASTEXITCODE -ne 0) { throw "Check failed: npm $($Arguments -join ' ')" } }
    finally { Pop-Location }
}
# Stop owned local API/worker/scheduler before build if Prisma's Windows DLL is locked.
Invoke-Check "$taskRoot/tinix-legal" @('-w','@tinix-legal/backend','run','build:mvp')
Invoke-Check "$taskRoot/tinix-legal" @('-w','@tinix-legal/backend','run','test:mvp')
Invoke-Check "$taskRoot/tinix-legal" @('-w','@limi/compliance-core','test')
Invoke-Check "$taskRoot/limi-product" @('run','lint')
Invoke-Check "$taskRoot/limi-product" @('run','build')
# These checks require local Redis/MinIO and the imported corpus; fixtures use disposable databases.
Invoke-Check "$taskRoot/tinix-legal" @('-w','@tinix-legal/backend','run','test:mvp:workspace')
Invoke-Check "$taskRoot/tinix-legal" @('-w','@tinix-legal/backend','run','test:mvp:alerts')
Invoke-Check "$taskRoot/tinix-legal" @('-w','@tinix-legal/backend','run','test:mvp:legal')
Push-Location "$taskRoot/tinix-legal"
try { & node node_modules/tsx/dist/cli.mjs packages/backend/scripts/verify-production-auth.ts; if($LASTEXITCODE -ne 0){throw 'Production authentication verification failed'} }
finally { Pop-Location }
Invoke-Check "$taskRoot/tinix-legal/deploy/runtime" @('audit','--omit=dev','--audit-level=high')
Invoke-Check "$taskRoot/limi-product" @('audit','--omit=dev','--audit-level=high')
Write-Output 'Release checks passed. Human legal approval and real pilot acceptance are separate gates.'
