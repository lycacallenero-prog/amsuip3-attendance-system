const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple self-signed certificate generation
const { execSync } = require('child_process');

function generateSelfSignedCert() {
  const certDir = path.join(__dirname, '.certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');

  // Generate self-signed certificate using OpenSSL
  try {
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    console.log('✅ Self-signed certificate generated successfully!');
    return { keyPath, certPath };
  } catch (error) {
    console.log('⚠️  Could not generate certificate with OpenSSL. Using basic HTTPS...');
    return null;
  }
}

function startHttpsServer() {
  const certFiles = generateSelfSignedCert();
  
  const options = certFiles ? {
    key: fs.readFileSync(certFiles.keyPath),
    cert: fs.readFileSync(certFiles.certPath)
  } : {};

  const server = https.createServer(options, (req, res) => {
    // Simple proxy to Vite dev server
    const proxyReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    req.pipe(proxyReq);
  });

  const port = 8080;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 HTTPS Server running on https://localhost:${port}`);
    console.log(`🌐 Network: https://192.168.254.100:${port}`);
    console.log('📱 Access from your phone using the Network URL above');
    console.log('⚠️  Accept the security warning in your browser (safe for development)');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ Port ${port} is already in use. Please stop other servers first.`);
    } else {
      console.log('❌ Server error:', err.message);
    }
  });
}

// Start the server
startHttpsServer();