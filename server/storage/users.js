const { datastore, checkForDisallowedChanges, forbiddenUsernames } = require('./shared');
const { ForbiddenError } = require('../errors');
const tools = require('../lib/tools');
const LOCAL_STORAGE_SPECIAL_USER = 'lima@local';

/**
 * @param {string} user
 * @return {Promise<User>}
 */
async function getUser(user) {
  if (!user) {
    throw new Error('user parameter required');
  }

  if (forbiddenUsernames.indexOf(user) !== -1) {
    throw new ForbiddenError('provided username is a reserved word');
  }

  let query;

  if (user.includes('@')) {
    // user is an email
    query = datastore.createQuery('User').filter('email', '=', user);
  } else {
    query = datastore.createQuery('User').filter('username', '=', user);
  }

  try {
    const [retval] = await datastore.runQuery(query);
    if (retval.length > 0) {
      return retval[0];
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    throw new Error('User not found');
  }
}

async function saveUser(email, user, options) {
  options = options || {};
  // todo do we want to keep a Log of users?
  if (!email || !user) {
    throw new Error('email/user parameters required');
  }

  if (email === LOCAL_STORAGE_SPECIAL_USER) {
    throw new Error('must not add the user ' + LOCAL_STORAGE_SPECIAL_USER);
  }

  if (!user.ctime) { // new user
    user.ctime = tools.uniqueNow();
  }

  const original = await getUser(email);
  // reject the save if we're restoring from another datastore and we already have this user
  if (options.restoring && original) {
    throw new Error(`user ${user.email} already exists`);
  }
  checkForDisallowedChanges(user, original);
  const key = datastore.key(['User', email]);
  console.log('saveUser making a datastore request');
  try {
    await datastore.save({
      key,
      data: user,
    });
    // then return the user
    return user;
  } catch (err) {
    console.error('error saving user', err);
    throw err;
  }
}

// Take either the email address, or username and return the email address
async function getEmailAddressOfUser(user) {
  if (user.indexOf('@') !== -1) return user;

  const query = datastore.createQuery('User').filter('username', '=', user);

  try {
    const [emails] = await datastore.runQuery(query);
    if (emails.length > 0) {
      return emails[0].email;
    } else {
      throw new Error('No email found');
    }
  } catch (error) {
    return null;
  }
}

// Take either the email address, or username and return the username (or null if there is none)
async function getUsernameOfUser(user) {
  if (user.indexOf('@') === -1) return user;
  const retval = await getUser(user);
  return retval.username;
}

module.exports = {
  getUser,
  saveUser,
  getEmailAddressOfUser,
  getUsernameOfUser,
  forbiddenUsernames,
};

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
  * @typedef {Object} User
  * @property {number} ctime
  * @property {number} mtime The user last 'registered' i.e. agreed to t&c's (may have changed username)
  * @property {string} email
  * @property {string} displayName
  * @property {string} username See regex for exact allowed names
  * @property {[{value: string}]} photos
  * @todo add favourites
*/
