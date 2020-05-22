const { datastore, checkForDisallowedChanges } = require('./index');
const { ForbiddenError } = require('../errors');
const tools = require('../lib/tools');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const USERNAME_REXP = new RegExp(`^${config.USERNAME_RE}$`);
const LOCAL_STORAGE_SPECIAL_USER = 'lima@local';
const LOCAL_STORAGE_SPECIAL_USERNAME = 'local';

// const userCache = getAllUsers();

/**
 * @return {Promise<User>}
 */
async function getAllUsers() {
  console.log('getAllUsers: making a datastore request');
  try {
    const [retval] = await datastore.createQuery('User').run();
    retval.forEach(user => {
      // SUGGESTION: is this needed anymore?
      user = migrateUser(user);
      if (user.username) {
        allUsernames.push(user.username.toLowerCase());
      }
      try {
        retval[user.email] = user;
      } catch (err) {
        console.error('error in a user entity (ignoring)');
        console.error(err);
      }
    });
    console.log(`getAllUsers: ${retval.length} done`);
    // add a special user for local storage
    // - after all other users are loaded so datastore never overrides this one
    // - we expect our auth providers never go issue this email address so no user can use it
    retval[LOCAL_STORAGE_SPECIAL_USER] = {
      email: LOCAL_STORAGE_SPECIAL_USER,
      username: LOCAL_STORAGE_SPECIAL_USERNAME,
    };
    return retval;
  } catch (error) {
    console.error('error retrieving users', error);
    setTimeout(getAllUsers, 60 * 1000); // try loading again in a minute
    throw error;
  }
}

/*
 * change user from an old format to the new one on load from datastore, if need be
 */
function migrateUser(user) {
  // 2017-06-08: Only store limited user information
  //     when all is migrated: just remove this code
  if (user.emails) {
    user.email = user.emails[0].value;
    delete user.emails;
    delete user.CHECKid;
    delete user.id;
    delete user.name;
    delete user.provider;
    user.migrated = true;
  }
  return user;
}

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

  const users = await getAllUsers();
  const email = await getEmailAddressOfUser(user);

  try {
    return users[email];
  } catch (error) {
    throw new Error(`user ${email} not found`);
  }
}

function listUsers() {
  return getAllUsers();
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

  const users = await getAllUsers();

  const original = users[email];
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
    // update the local cache of users
    users[email] = user;
    if (original && original.username) {
      const index = allUsernames.indexOf(original.username.toLowerCase());
      if (index !== -1) {
        allUsernames.splice(index, 1);
      }
    }
    if (user.username) allUsernames.push(user.username.toLowerCase());
    // then return the user
    return user;
  } catch (err) {
    console.error('error saving user', err);
    throw err;
  }
}

// on start of web server put all file names in /webpages into this list, with and without filename extensions
const forbiddenUsernames = [];

function getForbiddenUsernames() {
  // start initially with those defined in config
  const retval = [].concat(config.FORBIDDEN_USERNAMES);

  // then populate the rest by taking a look at /webpages
  const files = fs.readdirSync(path.join(__dirname, '..', 'webpages'));

  files.forEach((name) => {
    addUsernameIfNotThere(retval, name);
    addUsernameIfNotThere(retval, name.replace(/\..*$/, ''));
  });

  function addUsernameIfNotThere(arr, name) {
    // don't add usernames that wouldn't be allowed anyway
    if (!name) return;
    if (!name.match(USERNAME_REXP)) return;

    if (arr.indexOf(name) === -1) arr.push(name.toLowerCase());
  }

  // push all the found forbidden usernames into the global array
  forbiddenUsernames.push(...retval);
  allUsernames.push(...forbiddenUsernames);
}

// all the forbidden usernames will be treated as taken
const allUsernames = [LOCAL_STORAGE_SPECIAL_USERNAME];

// Take either the email address, or username and return the email address
async function getEmailAddressOfUser(user) {
  if (user.indexOf('@') !== -1) return user;

  const users = await getAllUsers();

  for (const email of Object.keys(users)) {
    if (users[email].username === user) {
      return email;
    }
  }

  return null;
}

// Take either the email address, or username and return the username (or null if there is none)
async function getUsernameOfUser(user) {
  if (user.indexOf('@') === -1) return user;
  const users = await getAllUsers();
  return users[user].username;
}

module.exports = {
  migrateUser,
  getUser,
  listUsers,
  saveUser,
  getEmailAddressOfUser,
  getUsernameOfUser,
  allUsernames,
  getForbiddenUsernames,
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
