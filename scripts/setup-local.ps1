$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$envPath=Join-Path $root '.env'
if(Test-Path -LiteralPath $envPath){throw '.env already exists. Use the documented existing database; this script will not overwrite configuration.'}
foreach($binary in @('initdb','pg_ctl','createdb','psql')){if(!(Get-Command $binary -ErrorAction SilentlyContinue)){throw "Missing PostgreSQL command: $binary"}}
$data=Join-Path $root '.local\postgres'
if(Test-Path -LiteralPath $data){throw 'A local cluster path already exists. Inspect it; it will not be reset.'}
if(Get-NetTCPConnection -LocalPort 5434 -State Listen -ErrorAction SilentlyContinue){throw 'Port 5434 is occupied. Configure a separate database using .env.example.'}
New-Item -ItemType Directory -Path (Join-Path $root '.local') -Force | Out-Null
$bytes=New-Object byte[] 32
$rng=[Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$password=[Convert]::ToBase64String($bytes)
$pwFile=Join-Path $root '.local\pg-password'
try{
 [IO.File]::WriteAllText($pwFile,$password)
 & initdb -D $data -U marketpulse --pwfile=$pwFile --auth=scram-sha-256 --encoding=UTF8 --locale=C
 if($LASTEXITCODE -ne 0){throw 'Database initialization failed.'}
}finally{if(Test-Path -LiteralPath $pwFile){Remove-Item -LiteralPath $pwFile}}
$dbPass=[Uri]::EscapeDataString($password)
$rng.GetBytes($bytes)
$authSecret=[Convert]::ToBase64String($bytes)
[IO.File]::WriteAllLines($envPath,@("DATABASE_URL=postgresql://marketpulse:${dbPass}@127.0.0.1:5434/marketpulse_dev","TEST_DATABASE_URL=postgresql://marketpulse:${dbPass}@127.0.0.1:5434/marketpulse_test","DEMO_DATABASE_URL=postgresql://marketpulse:${dbPass}@127.0.0.1:5434/marketpulse_demo","BETTER_AUTH_SECRET=$authSecret",'BETTER_AUTH_URL=http://localhost:3000','APP_ENV=development','TRANSCRIPTION_MODE=disabled'))
Start-Process -FilePath 'pg_ctl.exe' -ArgumentList @('-D',('"'+$data+'"'),'-l',('"'+(Join-Path $root '.local\postgres.log')+'"'),'-o','"-h 127.0.0.1 -p 5434"','start') -WindowStyle Hidden
for($attempt=0;$attempt -lt 20;$attempt++){& pg_isready -h 127.0.0.1 -p 5434 | Out-Null;if($LASTEXITCODE -eq 0){break};Start-Sleep -Seconds 1}
$env:PGPASSWORD=$password
try{foreach($dbName in @('marketpulse_dev','marketpulse_test','marketpulse_demo')){& createdb -h 127.0.0.1 -p 5434 -U marketpulse $dbName;if($LASTEXITCODE -ne 0){throw 'Database creation failed; inspect the local cluster without resetting it.'}}}finally{Remove-Item Env:PGPASSWORD}
Write-Output 'Local databases configured. Secrets saved in ignored .env. Run npm.cmd ci, db:generate, db:deploy, then dev.'
