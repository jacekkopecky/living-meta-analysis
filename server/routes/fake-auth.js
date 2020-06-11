module.exports = (req, res, next) => {
  if (req.user) {
    next();
    return;
  }

  let token;

  // adapted from
  // https://github.com/auth0/express-jwt/blob/4861bbb9d906f8fbd8c494fe2dbc4fda0d7865c6/lib/index.js#L62-70
  // uses "Fake" rather than "Bearer" for the auth token
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (scheme === 'Fake') {
        token = credentials;
      }
    }
  }


  if (token) {
    // remove @ signs
    token = token.split('@').join('');
  }

  // check again in case the token was only composed of '@' signs
  if (token) {
    const profile = {};
    profile.displayName = `Fake user ${token}`;
    profile.name = {
      familyName: 'Fake user',
      givenName: token,
    };

    profile.emails = [{ value: `${token}@fake.example.org` }];

    profile.id = token;
    profile.provider = 'fake authentication module';

    req.user = profile;
    next();
  } else {
    next();
  }
};
