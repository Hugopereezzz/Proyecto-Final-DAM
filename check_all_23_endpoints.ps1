# Script de Auditoría Total (24 Endpoints) - VERSIÓN CON LISTA DE ERRORES
$BaseUrl = "http://localhost:8080/api"
$AdminUser = "middleware_admin"
$AdminPass = "admin1234"

$Global:OkCount = 0
$Global:TotalCount = 0
$Global:FailedEndpoints = @()

function Test-Endpoint($Method, $Path, $Body = $null, $Header = $null) {
    $Global:TotalCount++
    try {
        $params = @{ Uri = "$BaseUrl$Path"; Method = $Method; ContentType = "application/json"; TimeoutSec = 5 }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json) }
        if ($Header) { $params.Headers = $Header }
        
        $res = Invoke-RestMethod @params
        Write-Host "[ OK ] $Method $Path" -ForegroundColor Green
        $Global:OkCount++
        return $res
    } catch {
        $ErrorMsg = "[ FAIL ] $Method $Path ($($_.Exception.Message))"
        Write-Host $ErrorMsg -ForegroundColor Red
        $Global:FailedEndpoints += $ErrorMsg
        return $null
    }
}

Write-Host "`n--- INICIANDO AUDITORÍA ---" -ForegroundColor Cyan

# --- AUTH ---
$LoginRes = Test-Endpoint "Post" "/auth/login" @{ username=$AdminUser; password=$AdminPass }
$Token = $LoginRes.token
$Auth = @{ "Authorization" = "Bearer $Token" }
Test-Endpoint "Post" "/auth/reset-middleware-password" @{ newPassword="admin1234" } $Auth

# --- USUARIOS ---
$TestUser = @{ nombre="Test"; apellidos="App"; nombreUsuario="testuser_$(Get-Random)"; contrasena="test1234"; email="test@test.com" }
$NewUser = Test-Endpoint "Post" "/usuarios/registro" $TestUser
$UserId = $NewUser.id
Test-Endpoint "Put" "/usuarios/$UserId" @{ monedas=1000 } $Auth
Test-Endpoint "Post" "/usuarios/login" @{ nombreUsuario=$TestUser.nombreUsuario; contrasena="test1234" }
Test-Endpoint "Get" "/usuarios/ranking" $null $Auth
Test-Endpoint "Get" "/usuarios" $null $Auth
Test-Endpoint "Get" "/usuarios/$UserId" $null $Auth
Test-Endpoint "Put" "/usuarios/$UserId" @{ nombre="Test Modificado" } $Auth
Test-Endpoint "Post" "/usuarios/incrementar-victorias/$($TestUser.nombreUsuario)" $null $Auth
Test-Endpoint "Get" "/usuarios/$UserId/facciones" $null $Auth
Test-Endpoint "Post" "/usuarios/comprarFaccion/$UserId" @{ nombre="NuevaAlianza"; tipo="Alliance" } $Auth

# --- FACCIONES ---
$NewFac = Test-Endpoint "Post" "/facciones" @{ usuarioId=$UserId; nombre="Fac Test"; tipo="shadow_cult" } $Auth
$FacId = $NewFac.id
Test-Endpoint "Get" "/facciones" $null $Auth
Test-Endpoint "Get" "/facciones/ranking" $null $Auth
Test-Endpoint "Put" "/facciones/$FacId" @{ nombre="Fac Modificada" } $Auth
Test-Endpoint "Delete" "/facciones/$FacId" $null $Auth

# --- ESTADÍSTICAS ---
Test-Endpoint "Post" "/estadisticas/copiar" $null $Auth
Test-Endpoint "Get" "/estadisticas/partidas" $null $Auth
Test-Endpoint "Get" "/estadisticas/usuario-top" $null $Auth
Test-Endpoint "Get" "/estadisticas/tipo-faccion-top" $null $Auth
Test-Endpoint "Get" "/estadisticas/rankingUsuarios" $null $Auth
Test-Endpoint "Get" "/estadisticas/rankingTiposFaccion" $null $Auth

# --- LIMPIEZA ---
Test-Endpoint "Delete" "/usuarios/$UserId" $null $Auth

Write-Host "`n--- RESUMEN FINAL ---" -ForegroundColor Cyan
Write-Host "Total Endpoints: $Global:TotalCount"
Write-Host "Exitosos: $Global:OkCount" -ForegroundColor Green
Write-Host "Fallidos: $($Global:FailedEndpoints.Count)" -ForegroundColor Red

if ($Global:FailedEndpoints.Count -gt 0) {
    Write-Host "`nLISTADO DE ERRORES:" -ForegroundColor Red
    foreach ($Err in $Global:FailedEndpoints) {
        Write-Host "  - $Err"
    }
} else {
    Write-Host "`n¡FELICIDADES! Todos los endpoints funcionan correctamente (100%)." -ForegroundColor Green
}
Write-Host "---------------------`n"
