# Script tạo SSL certificates cho localhost
$certDir = Join-Path $PSScriptRoot "apps\web\.cert"

# Tạo thư mục .cert nếu chưa có
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    Write-Host "✅ Đã tạo thư mục .cert" -ForegroundColor Green
}

$keyPath = Join-Path $certDir "localhost-key.pem"
$certPath = Join-Path $certDir "localhost.pem"

# Kiểm tra xem certificates đã tồn tại chưa
if ((Test-Path $keyPath) -and (Test-Path $certPath)) {
    Write-Host "⚠️  Certificates đã tồn tại!" -ForegroundColor Yellow
    Write-Host "   Key: $keyPath"
    Write-Host "   Cert: $certPath"
    exit 0
}

Write-Host "🔐 Đang tạo SSL certificates cho localhost..." -ForegroundColor Cyan

try {
    # Tạo self-signed certificate bằng .NET
    $cert = New-SelfSignedCertificate `
        -DnsName "localhost", "127.0.0.1" `
        -CertStoreLocation "cert:\CurrentUser\My" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "Localhost Development Certificate"
    
    # Export certificate và private key
    $certPassword = ConvertTo-SecureString -String "localhost" -Force -AsPlainText
    
    # Export certificate (PEM format)
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certBase64 = [System.Convert]::ToBase64String($certBytes)
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    for ($i = 0; $i -lt $certBase64.Length; $i += 64) {
        $certPem += $certBase64.Substring($i, [Math]::Min(64, $certBase64.Length - $i)) + "`n"
    }
    $certPem += "-----END CERTIFICATE-----`n"
    [System.IO.File]::WriteAllText($certPath, $certPem)
    
    # Export private key (PEM format) - cần OpenSSL hoặc công cụ khác
    # Tạm thời tạo key bằng cách khác
    Write-Host "⚠️  PowerShell không thể export private key trực tiếp sang PEM format" -ForegroundColor Yellow
    Write-Host "📝 Đang tạo private key bằng cách khác..." -ForegroundColor Cyan
    
    # Sử dụng certutil để export
    $pfxPath = Join-Path $env:TEMP "localhost-temp.pfx"
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $certPassword | Out-Null
    
    # Chuyển đổi PFX sang PEM (cần OpenSSL)
    Write-Host "❌ Cần OpenSSL để chuyển đổi private key sang PEM format" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Giải pháp:" -ForegroundColor Yellow
    Write-Host "1. Cài đặt OpenSSL:" -ForegroundColor White
    Write-Host "   - Tải từ: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Gray
    Write-Host "   - Hoặc: winget install OpenSSL.OpenSSL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Sau đó chạy lệnh:" -ForegroundColor White
    Write-Host "   openssl pkcs12 -in `"$pfxPath`" -nocerts -nodes -out `"$keyPath`" -passin pass:localhost" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Hoặc sử dụng mkcert (khuyến nghị):" -ForegroundColor White
    Write-Host "   - Tải từ: https://github.com/FiloSottile/mkcert/releases" -ForegroundColor Gray
    Write-Host "   - Chạy: mkcert -install" -ForegroundColor Gray
    Write-Host "   - Chạy: mkcert -key-file `"$keyPath`" -cert-file `"$certPath`" localhost" -ForegroundColor Gray
    
    # Xóa certificate tạm
    Remove-Item $pfxPath -ErrorAction SilentlyContinue
    Remove-Item "cert:\CurrentUser\My\$($cert.Thumbprint)" -ErrorAction SilentlyContinue
    
    exit 1
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

