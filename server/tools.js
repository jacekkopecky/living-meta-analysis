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
