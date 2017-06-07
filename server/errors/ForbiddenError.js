'use strict';

const ForbiddenError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'ForbiddenError';
  this.message = message;
  this.status = 403;
  if (error) this.inner = error;
};

ForbiddenError.prototype = Object.create(Error.prototype);
ForbiddenError.prototype.constructor = ForbiddenError;

module.exports = ForbiddenError;
