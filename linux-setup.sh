#!/bin/bash

# VideoPlanet Linux Environment Setup Script
# This script sets up the project in a Linux environment

echo "🚀 VideoPlanet Linux Setup Starting..."

# 1. Check Node.js and npm
echo "📦 Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

# 2. Install dependencies
echo "📦 Installing project dependencies..."
npm install

# 3. Install additional Linux-specific packages
echo "📦 Installing Linux-specific packages..."
npm install sharp --force  # Image optimization for Next.js

# 4. Set environment variables
echo "🔧 Setting up environment variables..."
cat > .env.local << EOF
# Linux Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NODE_ENV=development
EOF

# 5. Build the project
echo "🏗️ Building the project..."
npm run build

# 6. Create systemd service (optional)
echo "📝 Creating systemd service file..."
cat > videoplanet.service << EOF
[Unit]
Description=VideoPlanet Next.js Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production: npm start"
echo ""
echo "To install as a service:"
echo "  sudo cp videoplanet.service /etc/systemd/system/"
echo "  sudo systemctl enable videoplanet"
echo "  sudo systemctl start videoplanet"