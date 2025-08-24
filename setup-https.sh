#!/bin/bash

# Setup script for local HTTPS development
echo "Setting up local HTTPS development environment..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Installing..."
    
    # Detect OS and install mkcert
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing mkcert on Linux..."
        sudo apt update
        sudo apt install -y mkcert
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Installing mkcert on macOS..."
        brew install mkcert
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        echo "Installing mkcert on Windows..."
        choco install mkcert
    else
        echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert"
        exit 1
    fi
fi

# Install local CA
echo "Installing local CA..."
mkcert -install

# Create certificates for localhost
echo "Creating certificates for localhost..."
mkcert localhost 127.0.0.1 ::1

# Move certificates to project directory
echo "Setting up certificates..."
mkdir -p .certificates
mv localhost+2.pem .certificates/localhost.pem
mv localhost+2-key.pem .certificates/localhost-key.pem

echo "✅ HTTPS setup complete!"
echo "You can now run: npm run dev:https"