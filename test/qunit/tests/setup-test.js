/* global QUnit */
const server = require('../../../server');
let stopServer = null;

QUnit.begin(() => {
  return server.serverReady.then(server => {
    stopServer = server;
  });
});

QUnit.done(() => {
  stopServer();
});
