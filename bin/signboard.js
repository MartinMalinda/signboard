#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

function printRunHelp() {
  process.stdout.write([
    'Usage: signboard run [board-path]',
    '',
    'Open the Signboard desktop app, optionally opening a board directory.',
    '',
  ].join('\n'));
}

function runDesktopApp(args) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const projectRoot = path.resolve(__dirname, '..');
  const child = spawn(npmCommand, ['run', 'start', '--', ...args], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  child.once('error', (error) => {
    process.stderr.write(`${error.message || error}\n`);
    process.exitCode = 1;
  });

  child.once('exit', (code, signal) => {
    if (signal) {
      process.exitCode = 1;
    } else {
      process.exitCode = Number.isInteger(code) ? code : 0;
    }
  });
}

const args = process.argv.slice(2);

if (args[0] === 'run') {
  if (args.includes('--help') || args.includes('-h')) {
    printRunHelp();
  } else {
    runDesktopApp(args.slice(1));
  }
} else {
  const { runCli } = require('../lib/cliApp');

  runCli(args, { commandName: 'signboard' })
    .then((exitCode) => {
      process.exitCode = Number.isInteger(exitCode) ? exitCode : 0;
    })
    .catch((error) => {
      process.stderr.write(`${error.message || error}\n`);
      process.exitCode = 1;
    });
}
