'use strict';

const UnauthorizedError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'UnauthorizedError';
  this.message = message;
  this.status = 401;
  if (error) this.inner = error;
};

UnauthorizedError.prototype = Object.create(Error.prototype);
UnauthorizedError.prototype.constructor = UnauthorizedError;

module.exports = UnauthorizedError;
