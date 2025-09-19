import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test if Socket.IO server is reachable
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const healthData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Socket.IO server is reachable',
      serverHealth: healthData,
      timestamp: new Date().toISOString(),
      tests: {
        httpReachable: true,
        port3001Available: true,
        serverRunning: true
      }
    })
    
  } catch (error) {
    console.error('Socket.IO server test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Socket.IO server test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      tests: {
        httpReachable: false,
        port3001Available: false,
        serverRunning: false
      },
      troubleshooting: {
        checkServer: 'Run: ps aux | grep "node server.js"',
        checkPort: 'Run: lsof -i :3001',
        restartServer: 'Run: export $(cat .env.local | xargs) && node server.js',
        checkLogs: 'Check server console for errors'
      }
    }, { status: 500 })
  }
}

