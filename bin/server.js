// @flow

const net = require('net');
const fs = require('fs');
const commands = require('../lib/cli');

fs.unlink('/tmp/factorX.sock', () => {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const parsedData = JSON.parse(data.toString());
      const fn = commands[parsedData.args[2]];
      let response;
      if (fn) {
        response = JSON.stringify(fn(parsedData.file, parsedData.args.slice(3)));
      } else {
        response = JSON.stringify({ status: 'error', error: { name: 'Function not found.' } });
      }
      socket.write(response);
    });
  });
  server.listen('/tmp/factorX.sock');
});
