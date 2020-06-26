const { UnauthorizedError, NotFoundError, InternalError } = require('../errors');
const storage = require('../storage');
const tools = require('../lib/tools');

/* -------------------------------------------------------------------------- */
/*                               Route Handlers                               */
/* -------------------------------------------------------------------------- */

async function saveUser(req, res, next) {
  const user = extractReceivedUser(req.user);
  user.mtime = Date.now(); // update modification time - this is the last time the user agreed to T&C&PP
  user.username = tools.string(req.body.username);
  try {
    const storageUser = await storage.users.saveUser(user.email, user);
    res.json(extractUserForSending(storageUser));
  } catch (err) {
    next(err instanceof Error ? err : new InternalError(err));
  }
}

// Check that the user is known to LiMA and that LiMA has up-to-date values from the identity provider.
async function checkUser(req, res, next) {
  const email = req.user.emails[0].value;
  try {
    const storageUser = await storage.users.getUser(email);
    // Check whether there are any changes to the Google Object
    const strippedGoogleUser = extractReceivedUser(req.user);
    if (strippedGoogleUser.displayName !== storageUser.displayName ||
      strippedGoogleUser.email !== storageUser.email ||
      JSON.stringify(strippedGoogleUser.photos) !== JSON.stringify(storageUser.photos)) {
      Object.assign(storageUser, strippedGoogleUser);
      try {
        const savedUser = await storage.users.saveUser(storageUser.email, storageUser);
        res.json(extractUserForSending(savedUser));
      } catch (err) {
        next(new InternalError(err));
      }
    } else {
      res.json(extractUserForSending(storageUser));
    }
  } catch (error) {
    // User is not known to LiMA, return 401 to be caught by caller
    next(new UnauthorizedError('Please register with LiMA at /register'));
  }
}

async function returnUserProfile(req, res, next) {
  try {
    const user = await storage.users.getUser(req.params.user);
    res.json(extractUserForSending(user));
  } catch (err) {
    if (err && err.status) {
      next(err);
    } else {
      next(new NotFoundError());
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Middleware                                 */
/* -------------------------------------------------------------------------- */

async function SAME_USER(req, res, next) {
  const email = req.user.emails[0].value;
  try {
    const user = await storage.users.getUser(email);
    if (user.email === req.params.user || user.username === req.params.user) {
      next();
    } else {
      throw new Error();
    }
  } catch (error) {
    next(new UnauthorizedError('Please register with LiMA at /register'));
  }
}

async function EXISTS_USER(req, res, next) {
  try {
    await storage.users.getUser(req.params.user);
    next();
  } catch (error) {
    next(new NotFoundError());
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function extractReceivedUser(receivedUser) {
  // expecting receivedUser to be a Javascript object
  const retval = {
    displayName: tools.string(receivedUser.displayName),
    email: tools.string(receivedUser.emails[0].value),
    photos: tools.array(receivedUser.photos, extractReceivedPhoto),
  };

  return retval;
}

function extractReceivedPhoto(recPhoto) {
  const retval = {
    value: tools.string(recPhoto.value),
  };
  return retval;
}

/**
 * @param {User} user
 */
function extractUserForSending(user) {
  const retval = {
    displayName: user.displayName,
    name: user.name,
    email: user.email,
    photos: user.photos,
    joined: user.ctime,
    username: user.username,
  };
  return retval;
}

module.exports = {
  SAME_USER,
  EXISTS_USER,
  saveUser,
  checkUser,
  returnUserProfile,
};
