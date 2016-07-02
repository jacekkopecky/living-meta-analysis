'use strict';

const InternalError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'InternalError';
  this.message = message;
  this.status = 500;
  if (error) this.inner = error;
};

InternalError.prototype = Object.create(Error.prototype);
InternalError.prototype.constructor = InternalError;

module.exports = InternalError;
