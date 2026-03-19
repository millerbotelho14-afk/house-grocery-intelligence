$root = "C:\Users\mille\Documents\New project"
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*'
} | Select-Object -First 1 -ExpandProperty IPAddress)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root'; npm.cmd run dev:api"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root'; npm.cmd run dev:web"
)

Write-Host "API iniciada em http://localhost:4000"
Write-Host "Frontend iniciado em http://localhost:3000"
if ($ip) {
  Write-Host "Na mesma rede Wi-Fi, voce pode abrir tambem em http://$ip`:3000"
}
