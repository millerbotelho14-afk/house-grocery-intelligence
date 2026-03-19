$root = "C:\Users\mille\Documents\New project"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psql)) {
  Write-Error "Nao encontrei o psql em $psql"
  exit 1
}

$password = Read-Host "Digite a senha do usuario postgres"
$env:PGPASSWORD = $password

& $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE house_grocery;" 2>$null
& $psql -U postgres -h localhost -p 5432 -d house_grocery -f "$root\database\schema.sql"

$envFile = "$root\apps\api\.env"
@"
PORT=4000
DATABASE_URL=postgresql://postgres:$password@localhost:5432/house_grocery
"@ | Set-Content -Path $envFile

Write-Host "Banco configurado e arquivo .env atualizado em $envFile"
