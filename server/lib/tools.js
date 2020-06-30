'use strict';

let lastTime = 0;
/*
 * Return a unique-enough timestamp.
 * We ensure uniqueness in these ways:
 * 1) at first, return the current Date.now()
 * 2) if Date.now() returns the same value as the last timestamp we created, return that value + 1;
 * 3) if the above has happened, Date.now() can actually return a lower value than the last time,
 *    in which case we simply return the next greater number;
 * 4) the above only works while the app is running, so if many timestamps are needed quickly,
 *    the timestamps get into the future, then if the app restarts quickly enough, it can start
 *    generating non-unique times, but generating timestamps is unlikely to happen a lot in a
 *    short time, and a quick restart followed by further generating of timestamps is very unlikely.
 */
module.exports.uniqueNow = function uniqueNow() {
  let currTime = Date.now();
  if (lastTime >= currTime) {
    currTime = lastTime + 1;
  }
  lastTime = currTime;
  return currTime;
};

module.exports.string = function string(val) {
  if (val === undefined || val === null) return val;

  if (typeof val === 'object' || typeof val === 'function') {
    console.error(`not a string: ${val}`);
    console.error(new Error());
    return undefined;
  }

  return '' + val;
};

module.exports.number = function number(val) {
  if (val === undefined || val === null) return val;

  if (val === '' || typeof val === 'object' || typeof val === 'function' || isNaN(val)) {
    console.error(`not a number: ${val}`);
    console.error(new Error());
    return undefined;
  }

  return +val;
};

module.exports.bool = function bool(val) {
  if (val === undefined || val === null) return val;

  if (typeof val === 'object' || typeof val === 'function') {
    console.error(`not a boolean: ${val}`);
    console.error(new Error());
    return undefined;
  }

  return !!val;
};

module.exports.array = function array(val, f) {
  if (val === undefined || val === null) return val;

  if (Array.isArray(val)) {
    return val.map(f).filter(defined);
  }

  console.error(`not an array: ${val}`);
  console.error(new Error());
  return undefined;
};

module.exports.assoc = function assoc(val, f) {
  if (val === undefined || val === null) return val;

  if (typeof val === 'object') {
    const retval = {};
    for (const k of Object.keys(val)) {
      retval[k] = f(val[k]);
    }
    return retval;
  }

  console.error(`not an object: ${val}`);
  console.error(new Error());
  return undefined;
};

function defined(x) { return x !== undefined; }

module.exports.deleteCHECKvalues = function deleteCHECKvalues(obj) {
  if (obj !== null && (typeof obj === 'object' || typeof obj === 'function')) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('CHECK')) delete obj[key];
      else deleteCHECKvalues(obj[key]);
    }
  }
};
