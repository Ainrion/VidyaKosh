# 🚀 Development Setup Guide

This guide explains how to run the Vidyakosh application with both the Next.js frontend and Socket.IO backend servers.

## ✅ **Single Command Setup (Recommended)**

Now you can run everything with just **one command**:

```bash
npm run dev
```

This will:
- ✅ Load environment variables from `.env.local`
- ✅ Start Socket.IO server on port 3001
- ✅ Start Next.js app on port 3000
- ✅ Display color-coded logs for both servers
- ✅ Handle graceful shutdown with Ctrl+C

## 🔧 **Alternative Commands**

### Option 1: Bash Script (Unix/Mac)
```bash
npm run dev:bash
```

### Option 2: Manual with Concurrently
```bash
npm run dev:manual
```

### Option 3: Individual Servers
```bash
# Terminal 1: Socket.IO Server
npm run dev:socket

# Terminal 2: Next.js App
npm run dev:next
```

## 📋 **Requirements**

1. **Environment File**: Ensure `.env.local` exists with your Supabase configuration:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Email Configuration (optional)
   RESEND_API_KEY=your_resend_key
   ```

2. **Dependencies**: Run `npm install` if you haven't already.

## 🌐 **Access Points**

After running `npm run dev`, you can access:

- **🖥️ Main Application**: http://localhost:3000
- **💬 Messages/Chat**: http://localhost:3000/messages
- **📊 Dashboard**: http://localhost:3000/dashboard
- **👥 Admin Panel**: http://localhost:3000/admin
- **🔌 Socket.IO Health**: http://localhost:3001/health

## 🎨 **Log Colors**

The dev server uses color-coded logs:
- 🔵 **[SOCKET]** - Socket.IO server logs (blue)
- 🟢 **[NEXT]** - Next.js app logs (green)
- 🟡 **[MAIN]** - Startup/shutdown messages (yellow)
- 🔴 **[ERROR]** - Error messages (red)

## 🛑 **Stopping Servers**

Press `Ctrl+C` in the terminal to gracefully stop both servers.

## 🔍 **Troubleshooting**

### Port Already in Use
If you get "EADDRINUSE" errors:
```bash
# Kill processes on ports 3000 and 3001
pkill -f "next dev"
pkill -f "node server.js"
```

### Environment Variables Not Loading
- Check that `.env.local` exists in the project root
- Verify the file has proper formatting (no spaces around `=`)
- Restart the dev server after making changes

### WebSocket Connection Issues
- Ensure both servers are running (check logs for startup messages)
- Verify Socket.IO server health: `curl http://localhost:3001/health`
- Check browser console for WebSocket connection errors

## 📁 **Files Created**

This setup includes:
- `dev-server.js` - Cross-platform Node.js dev server launcher
- `start-dev.sh` - Bash script for Unix/Mac systems
- Updated `package.json` with new scripts

## ⚡ **Performance**

The unified dev server:
- ✅ Automatically loads environment variables
- ✅ Handles both servers in one process
- ✅ Provides clean, organized logging
- ✅ Supports graceful shutdown
- ✅ Works across platforms (Windows, Mac, Linux)

