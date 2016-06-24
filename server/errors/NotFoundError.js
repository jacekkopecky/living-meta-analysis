'use strict';

const NotFoundError = function (message, error) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'NotFoundError';
  this.message = message;
  this.status = 404;
  if (error) this.inner = error;
};

NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

module.exports = NotFoundError;
