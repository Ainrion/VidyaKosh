#!/bin/bash

echo "🔧 Fixing Real-Time Messaging System..."

# Backup original files
echo "📦 Creating backups..."
cp server.js server.js.backup
cp src/hooks/useSocket.tsx src/hooks/useSocket.tsx.backup

# Replace with fixed versions
echo "🔄 Replacing files with fixed versions..."
cp server-fixed.js server.js
cp src/hooks/useSocket-fixed.tsx src/hooks/useSocket.tsx

# Update package.json scripts
echo "📝 Updating package.json scripts..."
sed -i.bak 's/"dev": "next dev --turbopack"/"dev": "concurrently \"node server.js\" \"next dev --turbopack --port 3000\""/' package.json

# Install concurrently if not already installed
echo "📦 Installing concurrently for running multiple processes..."
npm install --save-dev concurrently

echo "✅ Real-time messaging system has been fixed!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "📋 Changes made:"
echo "   - Fixed Socket.IO server configuration"
echo "   - Updated useSocket hook with proper Socket.IO client"
echo "   - Added connection status monitoring"
echo "   - Improved error handling and reconnection logic"
echo "   - Added typing indicators"
echo "   - Created enhanced chat interface component"
echo ""
echo "🔍 Files modified:"
echo "   - server.js (Socket.IO server)"
echo "   - src/hooks/useSocket.tsx (Socket.IO client hook)"
echo "   - package.json (dev script updated)"
echo ""
echo "💡 The messaging system now uses proper Socket.IO real-time communication!"
