# Script de prueba para la API de Pulso Global
$BaseUrl = "http://localhost:8080/api"
$AdminUser = "middleware_admin"
$AdminPass = "admin1234"

function Write-Result($Name, $Status) {
    if ($Status) {
        Write-Host "[ OK ] $Name" -ForegroundColor Green
    } else {
        Write-Host "[ FAIL ] $Name" -ForegroundColor Red
    }
}

Write-Host "--- Iniciando Test de API ---" -ForegroundColor Cyan

# 1. Test de Login (Obtener Token)
try {
    $LoginBody = @{ username = $AdminUser; password = $AdminPass } | ConvertTo-Json
    $Response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $LoginBody -ContentType "application/json"
    $Token = $Response.token
    Write-Result "Login de Administrador (JWT)" $true
} catch {
    Write-Result "Login de Administrador (JWT)" $false
    Write-Host "No se puede continuar sin token." -ForegroundColor Red
    return
}

$Headers = @{ "Authorization" = "Bearer $Token" }

# 2. Test Usuarios
try {
    $Users = Invoke-RestMethod -Uri "$BaseUrl/usuarios/ranking" -Method Get -Headers $Headers
    Write-Result "Listar Ranking de Usuarios" $true
} catch {
    Write-Result "Listar Ranking de Usuarios" $false
}

# 3. Test Facciones
try {
    $Factions = Invoke-RestMethod -Uri "$BaseUrl/facciones/ranking" -Method Get -Headers $Headers
    Write-Result "Listar Ranking de Facciones" $true
} catch {
    Write-Result "Listar Ranking de Facciones" $false
}

# 4. Test Estadísticas (MongoDB)
try {
    $Stats = Invoke-RestMethod -Uri "$BaseUrl/estadisticas/partidas" -Method Get -Headers $Headers
    Write-Result "Consultar Historial (MongoDB)" $true
} catch {
    Write-Result "Consultar Historial (MongoDB)" $false
}

Write-Host "--- Test Finalizado ---" -ForegroundColor Cyan
