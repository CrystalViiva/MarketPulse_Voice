param([ValidateSet('start','stop','status')][string]$Action='status')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$data=Join-Path $root '.local\postgres'
if (!(Test-Path -LiteralPath (Join-Path $data 'PG_VERSION'))) { throw 'Local cluster missing. Follow README setup.' }
if($Action -eq 'start') { Start-Process -FilePath 'pg_ctl.exe' -ArgumentList @('-D',('"'+$data+'"'),'-l',('"'+(Join-Path $root '.local\postgres.log')+'"'),'-o','"-h 127.0.0.1 -p 5434"','start') -WindowStyle Hidden }
elseif($Action -eq 'stop') { & pg_ctl -D $data -m fast stop }
else { & pg_isready -h 127.0.0.1 -p 5434 }
