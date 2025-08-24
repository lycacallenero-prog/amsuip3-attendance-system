@echo off
echo Setting up local HTTPS development environment for Windows...

REM Check if mkcert is installed
where mkcert >nul 2>nul
if %errorlevel% neq 0 (
    echo mkcert is not installed. Installing...
    
    REM Try to install using chocolatey
    where choco >nul 2>nul
    if %errorlevel% equ 0 (
        echo Installing mkcert using Chocolatey...
        choco install mkcert -y
    ) else (
        echo Chocolatey not found. Please install mkcert manually:
        echo 1. Download from: https://github.com/FiloSottile/mkcert/releases
        echo 2. Add to PATH or run from the downloaded location
        pause
        exit /b 1
    )
)

REM Install local CA
echo Installing local CA...
mkcert -install

REM Create certificates for localhost
echo Creating certificates for localhost...
mkcert localhost 127.0.0.1 ::1

REM Create certificates directory and move files
echo Setting up certificates...
if not exist .certificates mkdir .certificates
move localhost+2.pem .certificates\localhost.pem
move localhost+2-key.pem .certificates\localhost-key.pem

echo ✅ HTTPS setup complete!
echo You can now run: npm run dev:https
pause