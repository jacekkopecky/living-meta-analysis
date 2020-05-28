const metaanalyses = require('./metaanalyses');
const papers = require('./papers');
const users = require('./users');

/* closed beta
 *
 *
 *    ####  #       ####   ####  ###### #####     #####  ###### #####   ##
 *   #    # #      #    # #      #      #    #    #    # #        #    #  #
 *   #      #      #    #  ####  #####  #    #    #####  #####    #   #    #
 *   #      #      #    #      # #      #    #    #    # #        #   ######
 *   #    # #      #    # #    # #      #    #    #    # #        #   #    #
 *    ####  ######  ####   ####  ###### #####     #####  ######   #   #    #
 *
 *
 */

function setupClosedBeta() {
  // a hash keyed on invite codes for closed beta users
  module.exports.betaCodes = { 'app-engine': {} };

  // // load the invitation codes from a file for now
  // // every line has an invite code and after # possibly a comment
  // // to generate an invite, there are instructions in the README
  // // todo load the codes from the data store and have a management interface, update the README
  // (function () {
  //   let invites;
  //   try {
  //     invites = fs.readFileSync('./invites.txt', 'utf8');
  //   } catch (e) {
  //     // let it crash
  //     throw new Error('BETA: need the file ./invites.txt to allow anybody in the server');
  //   }
  //   const lines = invites.split(/\n/);
  //   lines.forEach((line) => {
  //     const code = line.split('#')[0].trim();
  //     if (code) module.exports.betaCodes[code] = {};
  //   });
  //   if (Object.keys(module.exports.betaCodes).length === 0) {
  //     throw new Error('BETA: need invite codes in ./invites.txt to allow anybody in the server');
  //   }
  //   console.log(`BETA: got ${Object.keys(module.exports.betaCodes).length} invites`);
  // }());

  // // when we touch a beta code (someone uses it in a request), store:
  // //   last access (trigger a save if more than 24h after the last one)
  // //   logged-in email address if available (triggers a save if a new address there)
  // //   access count per email address per day for the last 7 days
  module.exports.touchBetaCode = (code, email) => void email;
}

module.exports = {
  metaanalyses,
  papers,
  users,
}