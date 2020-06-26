const metaanalyses = require('./metaanalyses');
const papers = require('./papers');
const users = require('./users');
const shared = require('./shared');

function setup() {
  shared.getForbiddenUsernames();
}

module.exports = {
  setup,
  metaanalyses,
  papers,
  users,
  shared,
};
