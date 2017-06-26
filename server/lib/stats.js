// adopted from https://github.com/spreaker/nodejs-statsd-client
'use strict';

const dgram = require('dgram');
const execSync = require('child_process').execSync;

module.exports.init = () => {
  if (process.env.TESTING) return;

  const options = getStatsdConfig();
  if (!options || !options.host || !options.port) return;

  const host = options.host;
  const port = options.port;
  const prefix = options.prefix || '';

  // Create socket (ignore errors)
  const socket = dgram.createSocket('udp4');
  socket.on('error', (e) => { console.error('udp error', e); });

  send = function (bucket, value) {
    const buffer = new Buffer(prefix + bucket + ':' + value);

    // Send (ignore errors)
    socket.send(buffer, 0, buffer.length, port, host);
  };
};

function timing(bucket, value) {
  send(bucket, value + '|ms');
}

function count(bucket, value, sampling) {
  if (value == null) value = 1;
  if (sampling == null) sampling = 1;
  send(bucket, value + '|c|@' + sampling);
}

function increment(bucket) {
  count(bucket, 1);
}

function decrement(bucket) {
  count(bucket, -1);
}

function gauge(bucket, value) {
  send(bucket, value + '|g');
}

module.exports.timing = timing;
module.exports.count = count;
module.exports.increment = increment;
module.exports.decrement = decrement;
module.exports.gauge = gauge;

// don't send stats until initialized
let send = () => {};

function getStatsdConfig() {
  try {
    const json = execSync(__dirname + '/../../deployment/shared/monitoring-os-scripts/config-to-json.sh');
    return JSON.parse(json);
  } catch (e) {
    console.error('failed getting statsd config');
    return null;
  }
}
