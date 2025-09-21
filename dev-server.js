#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function loadEnvFile() {
  try {
    const envPath = join(__dirname, '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    
    // Parse .env.local file
    const envVars = {};
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    // Set environment variables
    Object.assign(process.env, envVars);
    
    log(colors.green, 'ENV', '✅ Environment variables loaded from .env.local');
    return true;
  } catch (error) {
    log(colors.red, 'ENV', '❌ Failed to load .env.local file');
    log(colors.yellow, 'ENV', 'Please create .env.local with your Supabase configuration');
    return false;
  }
}

function startServer(name, command, args, color) {
  return new Promise((resolve, reject) => {
    log(color, name, `🚀 Starting ${name}...`);
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      env: process.env,
      shell: true
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(color, name, line));
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(colors.red, name, line));
    });

    child.on('error', (error) => {
      log(colors.red, name, `❌ Error: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(colors.green, name, `✅ ${name} exited successfully`);
      } else {
        log(colors.red, name, `❌ ${name} exited with code ${code}`);
      }
      resolve(code);
    });

    return child;
  });
}

async function main() {
  log(colors.blue, 'MAIN', '🚀 Starting Riven Development Servers...');
  
  // Load environment variables
  if (!loadEnvFile()) {
    process.exit(1);
  }

  // Start both servers
  const processes = [];

  try {
    // Start Socket.IO server
    const socketProcess = spawn('node', ['server.js'], {
      stdio: 'pipe',
      env: process.env
    });

    socketProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(colors.blue, 'SOCKET', line));
    });

    socketProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(colors.red, 'SOCKET', line));
    });

    processes.push(socketProcess);

    // Start Next.js server
    const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
      stdio: 'pipe',
      env: process.env
    });

    nextProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(colors.green, 'NEXT', line));
    });

    nextProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => log(colors.red, 'NEXT', line));
    });

    processes.push(nextProcess);

    log(colors.cyan, 'MAIN', '🌟 Both servers started successfully!');
    log(colors.cyan, 'MAIN', '📱 Next.js: http://localhost:3000');
    log(colors.cyan, 'MAIN', '🔌 Socket.IO: http://localhost:3001');
    log(colors.yellow, 'MAIN', '⏹️  Press Ctrl+C to stop all servers');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log(colors.yellow, 'MAIN', '🛑 Shutting down servers...');
      processes.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGINT');
        }
      });
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log(colors.yellow, 'MAIN', '🛑 Shutting down servers...');
      processes.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGTERM');
        }
      });
      process.exit(0);
    });

  } catch (error) {
    log(colors.red, 'MAIN', `❌ Failed to start servers: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  log(colors.red, 'MAIN', `❌ Fatal error: ${error.message}`);
  process.exit(1);
});

