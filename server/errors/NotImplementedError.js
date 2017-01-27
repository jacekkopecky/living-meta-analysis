'use strict';

const NotImplementedError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'NotImplementedError';
  this.message = message;
  this.status = 501;
  if (error) this.inner = error;
};

NotImplementedError.prototype = Object.create(Error.prototype);
NotImplementedError.prototype.constructor = NotImplementedError;

module.exports = NotImplementedError;
