const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const electronCommand = process.platform === 'win32' ? 'electron.cmd' : 'electron';
const electronArgs = ['.', ...process.argv.slice(2)];
const children = new Set();
let shuttingDown = false;

function stopChildren(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function track(child) {
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}

async function buildVue() {
  return new Promise((resolve, reject) => {
    const build = spawn(npmCommand, ['run', 'build:vue'], {
      stdio: 'inherit',
      env: process.env,
    });

    build.once('error', reject);
    build.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Vue build terminated by ${signal}.`));
      } else if (code !== 0) {
        reject(new Error(`Vue build exited with code ${code}.`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  await buildVue();

  const environment = {
    ...process.env,
    SIGNBOARD_DEV_WATCH: '1',
  };
  const watcher = track(spawn(npmCommand, ['run', 'watch:vue:changes'], {
    stdio: 'inherit',
    env: environment,
  }));
  const electron = track(spawn(electronCommand, electronArgs, {
    stdio: 'inherit',
    env: environment,
  }));

  watcher.once('error', (error) => {
    console.error('Vue watcher failed to start.', error);
    stopChildren();
  });
  watcher.once('exit', (code, signal) => {
    if (!shuttingDown && (signal || code !== 0)) {
      stopChildren();
    }
  });
  electron.once('error', (error) => {
    console.error('Electron failed to start.', error);
    stopChildren();
  });

  const exitCode = await new Promise((resolve) => {
    electron.once('exit', (code, signal) => resolve(signal ? 1 : (code || 0)));
  });

  shuttingDown = true;
  stopChildren();
  process.exitCode = exitCode;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopChildren(signal);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
