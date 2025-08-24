# HTTPS Development Setup

This guide will help you set up HTTPS for local development so you can test camera features on mobile devices.

## Quick Start (Recommended)

### Option 1: Simple HTTPS (No Setup Required)
```bash
npm run dev:https
```
This will start the development server with Vite's built-in HTTPS certificate.

### Option 2: Secure Local HTTPS (Recommended for Production-like Testing)
```bash
# Setup mkcert certificates (one-time setup)
npm run setup:https

# Start development server with secure certificates
npm run dev:https
```

## Detailed Setup

### Prerequisites
- Node.js and npm installed
- For Option 2: mkcert (will be installed automatically)

### Step-by-Step Instructions

#### Option 1: Vite's Built-in HTTPS
1. Run the development server:
   ```bash
   npm run dev:https
   ```
2. Access your app at: `https://localhost:8080`
3. Accept the security warning in your browser (it's safe for development)

#### Option 2: mkcert (More Secure)
1. Run the setup script:
   ```bash
   npm run setup:https
   ```
2. Start the development server:
   ```bash
   npm run dev:https
   ```
3. Access your app at: `https://localhost:8080`
4. No security warnings (trusted local certificate)

## Accessing from Mobile Devices

### Find Your Computer's IP Address
- **Windows**: Run `ipconfig` in Command Prompt
- **macOS/Linux**: Run `ifconfig` or `ip addr` in Terminal
- Look for your local IP (usually starts with `192.168.` or `10.0.`)

### Access from Mobile
1. Make sure your phone is on the same WiFi network as your computer
2. Open your mobile browser
3. Navigate to: `https://YOUR_COMPUTER_IP:8080`
   - Example: `https://192.168.1.100:8080`

## Troubleshooting

### Certificate Issues
- If you see certificate warnings, accept them for development
- For mkcert setup, make sure the certificates were created in `.certificates/` folder

### Network Issues
- Ensure your firewall allows connections on port 8080
- Check that both devices are on the same network
- Try using your computer's IP address instead of localhost

### Camera Access
- HTTPS is required for camera access on mobile devices
- Make sure you're using `https://` not `http://`
- Accept camera permissions when prompted

## Security Notes
- These certificates are for development only
- Never use development certificates in production
- The setup creates trusted local certificates that won't show security warnings