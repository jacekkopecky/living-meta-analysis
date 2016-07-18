'use strict';

const ValidationError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'ValidationError';
  this.message = message;
  this.status = 409;
  if (error) this.inner = error;
};

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

module.exports = ValidationError;
