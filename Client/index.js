#!/usr/bin/env node

const net = require('net');
const getStdin = require('get-stdin');

let connectionTries = 0;
let connecting;

const spawnServer = (file) => {
  // eslint-disable-next-line global-require
  const spawn = require('child_process').spawn;
  // eslint-disable-next-line global-require
  const path = require('path');
  // eslint-disable-next-line global-require
  const fs = require('fs');
  const out = fs.openSync(path.join(__dirname, '..', 'Server', 'out.log'), 'a');
  const err = fs.openSync(path.join(__dirname, '..', 'Server', 'err.log'), 'a');
  const child = spawn('node', [path.join(__dirname, '..', 'Server')], {
    detached: true,
    stdio: ['ignore', out, err],
  });

  child.unref();
  connecting = setTimeout(() => {
    if (connectionTries <= 5) {
      connect(file);
    } else {
      clearInterval(connecting);
    }
  }, 300);
};

const connect = (file) => {
  connectionTries += 1;
  const client = net.createConnection('/tmp/factorX.sock', () => {
    clearInterval(connecting);
    const args = process.argv;
    client.write(JSON.stringify({ args, file }));
  });
  client.on('data', (data) => {
    process.stdout.write(data.toString());
    client.end();
  });
  client.on('error', (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOENT') {
      spawnServer(file);
    }
  });
};

getStdin().then(connect);
