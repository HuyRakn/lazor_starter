const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Tạo thư mục .cert nếu chưa có
const certDir = path.join(__dirname, 'apps', 'web', '.cert');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✅ Đã tạo thư mục .cert');
}

// Kiểm tra xem certificates đã tồn tại chưa
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('⚠️  Certificates đã tồn tại!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  process.exit(0);
}

console.log('🔐 Đang tạo SSL certificates cho localhost...');

// Tạo self-signed certificate bằng OpenSSL command
// Nếu không có OpenSSL, sẽ hướng dẫn cài đặt
try {
  // Tạo private key
  execSync(
    `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=VN/ST=Hanoi/L=Hanoi/O=Local/OU=Dev/CN=localhost"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Đã tạo SSL certificates thành công!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
} catch (error) {
  console.error('❌ Lỗi: OpenSSL không được tìm thấy!');
  console.log('\n📝 Có 2 cách để tạo certificates:');
  console.log('\n1. Cài đặt OpenSSL:');
  console.log('   - Tải từ: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   - Hoặc cài qua Chocolatey: choco install openssl');
  console.log('\n2. Cài đặt mkcert (khuyến nghị):');
  console.log('   - Tải từ: https://github.com/FiloSottile/mkcert/releases');
  console.log('   - Sau đó chạy: mkcert -install');
  console.log('   - Và: mkcert localhost');
  console.log('\n3. Hoặc tạo thủ công bằng PowerShell script');
  process.exit(1);
}

