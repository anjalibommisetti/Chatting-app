import { spawn } from 'child_process';
import http from 'http';

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/users`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function runDev() {
  const isServerRunning = await checkPort(5000);
  let serverProcess = null;

  if (!isServerRunning) {
    console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Backend Server (Express + WebSockets on port 5000)...');
    serverProcess = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ Backend Server is already running on port 5000.');
  }

  console.log('\x1b[35m%s\x1b[0m', '⚡ Starting Frontend Dev Server (Vite on port 3000)...');
  const viteProcess = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

  const onExit = () => {
    if (serverProcess) {
      try { serverProcess.kill(); } catch (e) {}
    }
    if (viteProcess) {
      try { viteProcess.kill(); } catch (e) {}
    }
    process.exit();
  };

  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
  process.on('exit', onExit);
}

runDev();
