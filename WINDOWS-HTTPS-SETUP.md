# Windows HTTPS Setup Guide

## Quick Solution (Recommended)

### Step 1: Install mkcert for Windows

1. **Download mkcert for Windows:**
   - Go to: https://github.com/FiloSottile/mkcert/releases
   - Download the latest Windows release (e.g., `mkcert-v1.4.4-windows-amd64.exe`)
   - Rename it to `mkcert.exe`

2. **Install mkcert:**
   - Move `mkcert.exe` to a folder in your PATH (e.g., `C:\Windows\System32\` or create a folder like `C:\Tools\` and add it to PATH)
   - Or run it directly from the download folder

3. **Run mkcert setup:**
   ```cmd
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

4. **Move certificates to project:**
   ```cmd
   mkdir .certificates
   move localhost+2.pem .certificates\localhost.pem
   move localhost+2-key.pem .certificates\localhost-key.pem
   ```

### Step 2: Start HTTPS Development Server

```cmd
npm run dev:https
```

## Alternative Solution (If mkcert doesn't work)

### Option 1: Use ngrok (Easiest)

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Extract and add to PATH

2. **Start your app normally:**
   ```cmd
   npm run dev
   ```

3. **Create HTTPS tunnel:**
   ```cmd
   ngrok http 8080
   ```

4. **Use the ngrok URL on your phone** (e.g., `https://abc123.ngrok.io`)

### Option 2: Use localhost.run

1. **Start your app:**
   ```cmd
   npm run dev
   ```

2. **Create tunnel:**
   ```cmd
   npx localhost.run 8080
   ```

3. **Use the provided URL on your phone**

## Troubleshooting

### SSL Protocol Error
If you get "ERR_SSL_VERSION_OR_CIPHER_MISMATCH":

1. **Try a different browser** (Chrome, Firefox, Edge)
2. **Clear browser cache and cookies**
3. **Accept the security warning** when prompted
4. **Use ngrok** (most reliable solution)

### Certificate Issues
- Accept all security warnings for development
- Make sure you're using `https://` not `http://`
- Try accessing from incognito/private mode

### Network Issues
- Ensure Windows Firewall allows port 8080
- Check that both devices are on the same network
- Try using your computer's IP address

## Recommended Approach

For the most reliable experience, I recommend using **ngrok**:

1. `npm run dev` (start normal development server)
2. `ngrok http 8080` (create HTTPS tunnel)
3. Use the ngrok URL on your phone

This bypasses all local certificate issues and provides a secure HTTPS connection that works reliably on mobile devices.