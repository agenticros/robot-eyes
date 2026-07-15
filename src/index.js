#!/usr/bin/env node
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execFileSync } from 'child_process';
import { WebSocketServer } from 'ws';

const require = createRequire(import.meta.url);
const rclnodejs = require('rclnodejs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const PORT = Number(process.env.PORT || 8765);
const TOPIC = process.env.CMD_VEL_TOPIC || '/cmd_vel';
const ANGULAR_DEADZONE = Number(process.env.ANGULAR_DEADZONE || 0.05);
const CMD_TIMEOUT_MS = Number(process.env.CMD_TIMEOUT_MS || 300);
const NO_BROWSER = process.argv.includes('--no-browser');

/** @type {{ gazeX: number, driving: boolean, lastCmdAt: number }} */
const state = {
  gazeX: 0,
  driving: false,
  lastCmdAt: 0,
};

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

function createHttpServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? '/index.html' : urlPath;
    const filePath = path.normalize(path.join(PUBLIC_DIR, rel));

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeType(filePath) });
      res.end(data);
    });
  });
}

function broadcast(wss, payload) {
  const raw = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(raw);
    }
  }
}

function gazeFromTwist(msg) {
  const z = msg?.angular?.z ?? 0;
  if (Math.abs(z) < ANGULAR_DEADZONE) {
    return { gazeX: 0, driving: false };
  }
  // ROS: +angular.z = CCW / left turn → eyes look left (negative X)
  return { gazeX: z > 0 ? -1 : 1, driving: true };
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    'firefox',
    'chromium-browser',
    'chromium',
    'google-chrome',
    'google-chrome-stable',
  ].filter(Boolean);

  for (const bin of candidates) {
    try {
      execFileSync('which', [bin], { stdio: 'ignore' });
      return bin;
    } catch {
      // try next
    }
  }
  return null;
}

function launchKiosk(url) {
  const bin = findBrowser();
  if (!bin) {
    console.warn('No browser found. Open this URL fullscreen manually:', url);
    return null;
  }

  const args =
    bin.includes('firefox')
      ? ['--kiosk', url]
      : ['--kiosk', '--noerrdialogs', '--disable-infobars', `--app=${url}`, url];

  console.log(`Launching ${bin} in kiosk mode → ${url}`);
  const child = spawn(bin, args, {
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' },
  });
  child.unref();
  child.on('error', (err) => {
    console.warn(`Failed to launch ${bin}:`, err.message);
    console.warn('Open this URL fullscreen manually:', url);
  });
  return child;
}

async function main() {
  await rclnodejs.init();
  const node = rclnodejs.createNode('robot_eyes');

  const server = createHttpServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.send(
      JSON.stringify({
        type: 'gaze',
        gazeX: state.gazeX,
        driving: state.driving,
      }),
    );
  });

  node.createSubscription('geometry_msgs/msg/Twist', TOPIC, (msg) => {
    const next = gazeFromTwist(msg);
    state.gazeX = next.gazeX;
    state.driving = next.driving;
    state.lastCmdAt = Date.now();
    broadcast(wss, {
      type: 'gaze',
      gazeX: state.gazeX,
      driving: state.driving,
    });
  });

  // Recentering when teleop stops publishing
  setInterval(() => {
    if (!state.driving) return;
    if (Date.now() - state.lastCmdAt < CMD_TIMEOUT_MS) return;
    state.gazeX = 0;
    state.driving = false;
    broadcast(wss, {
      type: 'gaze',
      gazeX: 0,
      driving: false,
    });
  }, 50);

  server.listen(PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${PORT}/`;
    console.log(`robot-eyes listening on ${url}`);
    console.log(`Subscribed to ${TOPIC} (deadzone=${ANGULAR_DEADZONE})`);
    if (!NO_BROWSER) {
      launchKiosk(url);
    } else {
      console.log('--no-browser: open the URL yourself for fullscreen');
    }
  });

  rclnodejs.spin(node);

  const shutdown = async () => {
    console.log('\nShutting down…');
    try {
      wss.close();
      server.close();
      node.destroy();
      await rclnodejs.shutdown();
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
