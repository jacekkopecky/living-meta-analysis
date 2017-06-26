// adopted from https://github.com/spreaker/nodejs-statsd-client
'use strict';

const dgram = require('dgram');

const config = require('./../config');

function StatsDClient(options) {
  options = options || {};
  this.host = options.host || 'localhost';
  this.port = options.port || 8125;
  this.prefix = options.prefix || '';

  // Create socket (ignore errors)
  this.socket = dgram.createSocket('udp4');
  this.socket.on('error', (e) => { console.error('udp error', e); });
}

StatsDClient.prototype.timing = function (bucket, value) {
  this.send(bucket, value + '|ms');
};

StatsDClient.prototype.count = function (bucket, value, sampling) {
  if (value == null) value = 1;
  if (sampling == null) sampling = 1;
  this.send(bucket, value + '|c|@' + sampling);
};

StatsDClient.prototype.increment = function (bucket) {
  this.count(bucket, 1);
};

StatsDClient.prototype.decrement = function (bucket) {
  this.count(bucket, -1);
};

StatsDClient.prototype.gauge = function (bucket, value) {
  this.send(bucket, value + '|g');
};

StatsDClient.prototype.send = function (bucket, value) {
  const buffer = new Buffer(this.prefix + bucket + ':' + value);

  // Send (ignore errors)
  this.socket.send(buffer, 0, buffer.length, this.port, this.host);
};

// don't send stats if we're running for tests
if (process.env.TESTING) {
  StatsDClient.prototype.send = function () {};
}


module.exports = StatsDClient;
module.exports.instance = new StatsDClient(config.statsdConfig);
