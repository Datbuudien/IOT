/**
 * Script helper để chạy HTTP server phục vụ firmware file
 * 
 * Cách sử dụng:
 * 1. Đặt file firmware.bin vào thư mục này
 * 2. Chạy: node scripts/serveFirmware.js
 * 3. Copy URL hiển thị và dùng trong Admin Panel
 * 
 * Hoặc chỉ định file:
 * node scripts/serveFirmware.js --file path/to/firmware.bin
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function findFirmwareFile() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const filePath = args[fileIndex + 1];
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Tìm file .bin trong thư mục hiện tại
  const currentDir = __dirname;
  const files = fs.readdirSync(currentDir);
  const binFiles = files.filter(f => f.endsWith('.bin'));
  
  if (binFiles.length === 0) {
    console.error('❌ No .bin file found in current directory');
    console.log('\nCách sử dụng:');
    console.log('  1. Đặt file firmware.bin vào thư mục scripts/');
    console.log('  2. Chạy: node scripts/serveFirmware.js');
    console.log('\nHoặc chỉ định file:');
    console.log('  node scripts/serveFirmware.js --file path/to/firmware.bin');
    process.exit(1);
  }
  
  // Lấy file mới nhất
  const binFile = binFiles.map(f => ({
    name: f,
    path: path.join(currentDir, f),
    mtime: fs.statSync(path.join(currentDir, f)).mtime
  })).sort((a, b) => b.mtime - a.mtime)[0];
  
  return binFile.path;
}

const firmwarePath = findFirmwareFile();
const firmwareName = path.basename(firmwarePath);
const firmwareStats = fs.statSync(firmwarePath);

console.log('\n📦 Firmware Server');
console.log('==================');
console.log(`File: ${firmwareName}`);
console.log(`Size: ${(firmwareStats.size / 1024).toFixed(2)} KB (${firmwareStats.size} bytes)`);
console.log(`Modified: ${firmwareStats.mtime.toLocaleString()}`);

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === `/${firmwareName}`) {
    const fileStream = fs.createReadStream(firmwarePath);
    
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${firmwareName}"`,
      'Content-Length': firmwareStats.size
    });
    
    fileStream.pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 8000;
const IP = getLocalIP();

server.listen(PORT, () => {
  console.log('\n✅ Server started!');
  console.log('\n📡 URLs:');
  console.log(`   Local:  http://localhost:${PORT}/${firmwareName}`);
  console.log(`   Network: http://${IP}:${PORT}/${firmwareName}`);
  console.log('\n💡 Copy URL "Network" và dùng trong Admin Panel');
  console.log('\n⚠️  Lưu ý:');
  console.log('  - ESP32 và máy tính phải cùng mạng WiFi');
  console.log('  - Firewall có thể chặn, cần mở port 8000');
  console.log('  - Nhấn Ctrl+C để dừng server\n');
});

