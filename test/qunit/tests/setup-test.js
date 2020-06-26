/* global QUnit */
const server = require('../../../server');

QUnit.begin(() => {
  return server.serverReady;
});
