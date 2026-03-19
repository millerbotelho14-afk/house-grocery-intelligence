$root = "C:\Users\mille\Documents\New project"

Write-Host "Abrindo link publico para http://localhost:3000 ..."
Set-Location $root
npx.cmd localtunnel --port 3000
