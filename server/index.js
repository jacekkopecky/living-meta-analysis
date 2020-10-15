/*
 * Living Meta-Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

console.log('LiMA server starting at ' + new Date());
const express = require('express');
const googleOpenID = require('simple-google-openid');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const config = require('./config');

const apiRoutes = require('./routes');
const redirectApi = require('./routes/redirected-api');
const storage = require('./storage');
const NotFoundError = require('./errors/NotFoundError');

const api = process.env.REDIRECT_API ? redirectApi : apiRoutes;

storage.setup();

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID || config.googleClientID));
app.use(cookieParser());

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

// in closed beta, restrict access to HTML pages:
// if we don't get a valid closed-beta code in the lima-beta-code cookie,
// we will redirect to a coming-soon page

if (!process.env.TESTING) {
  // regex for quickly checking for selected paths to be allowed: /css, /js, /img, /api, /version
  const closedBetaAllowedURLs = /^\/(css|js|img|api|version|\.well-known)\//;

  app.use('/', async (req, res, next) => {
    if (req.url.match(closedBetaAllowedURLs)) {
      next();
    } else if (await isValidBetaCode(req.cookies['lima-beta-code'])) {
      next();
    } else if (req.url === '/') {
      res.sendFile('coming-soon.html', { root: './webpages/' });
    } else {
      res.redirect('/');
    }
  });
}

async function isValidBetaCode(betaCodeCookies) {
  if (betaCodeCookies) {
    const codeKey = storage.shared.datastore.key(['BetaCode', betaCodeCookies]);
    const codes = await storage.shared.datastore.get(codeKey);
    if (codes[0]) return true;
    return false;
  } else {
    return false;
  }
}

/* routes
 *
 *
 *        #####   ####  #    # ##### ######  ####
 *        #    # #    # #    #   #   #      #
 *        #    # #    # #    #   #   #####   ####
 *        #####  #    # #    #   #   #           #
 *        #   #  #    # #    #   #   #      #    #
 *        #    #  ####   ####    #   ######  ####
 *
 *
 */

if (config.demoApiDelay) {
  // this is a delay for demonstration purposes so the server seems slow
  app.use((req, res, next) => setTimeout(next, config.demoApiDelay));
}

// allow local testing of pages
app.use(cors({ origin: 'http://localhost:8080' }));

app.use('/api', api.router);

app.get('/version', oneLineVersion);
app.get('/version/', oneLineVersion);
app.get('/version/log',
  (req, res) => res.redirect('https://github.com/jacekkopecky/living-meta-analysis/commits/master'));

app.get(['/profile', '/profile/*'],
  (req, res) => res.sendFile('profileRedirect.html', { root: './webpages/' }));

app.use('/', express.static('webpages', { extensions: ['html'] }));

// the routes below would catch any of the above so need to come last

app.use(`/:user(${config.USER_RE})/`, SLASH_URL);
app.get(`/:user(${config.USER_RE})/`,
  api.users.EXISTS_USER,
  (req, res) => res.sendFile('profile/profile.html', { root: './webpages/' }));

app.use(`/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, SLASH_URL);
app.get(`/:user(${config.USER_RE})/${config.NEW_PAPER_TITLE}/`,
  api.users.EXISTS_USER,
  (req, res) => res.sendFile('profile/paper.html', { root: './webpages/' }));
app.get(`/:user(${config.USER_RE})/${config.NEW_META_TITLE}/`,
  api.users.EXISTS_USER,
  (req, res) => res.sendFile('react-dist/metaanalysis.html', { root: './webpages/' }));
app.get(`/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
  api.users.EXISTS_USER,
  async (req, res, next) => {
    try {
      const kind = req.query.type || await api.getKindForTitle(req.params.user, req.params.title);
      if (kind === 'paper') {
        res.sendFile('profile/paper.html', { root: './webpages/' });
      } else if (kind === 'metaanalysis') {
        res.sendFile('react-dist/metaanalysis.html', { root: './webpages/' });
      } else {
        next(new NotFoundError());
      }
    } catch (error) {
      next(new NotFoundError());
    }
  });

function SLASH_URL(req, res, next) {
  let end = req.originalUrl.indexOf('?');
  let query = '';
  if (end === -1) {
    end = req.originalUrl.length;
  } else {
    query = req.originalUrl.substring(end);
  }
  if (req.originalUrl[end - 1] === '/') {
    next();
  } else {
    res.redirect(req.originalUrl.substring(0, end) + '/' + query);
  }
}


/* version
 *
 *
 *         #    # ###### #####   ####  #  ####  #    #
 *         #    # #      #    # #      # #    # ##   #
 *         #    # #####  #    #  ####  # #    # # #  #
 *         #    # #      #####       # # #    # #  # #
 *          #  #  #      #   #  #    # # #    # #   ##
 *           ##   ###### #    #  ####  #  ####  #    #
 *
 *
 */

function oneLineVersion(req, res) {
  res.sendFile('version.txt', { root: '.' });
}

/* error handling
 *
 *
 *  ###### #####  #####   ####  #####     #    #   ##   #    # #####  #      # #    #  ####
 *  #      #    # #    # #    # #    #    #    #  #  #  ##   # #    # #      # ##   # #    #
 *  #####  #    # #    # #    # #    #    ###### #    # # #  # #    # #      # # #  # #
 *  #      #####  #####  #    # #####     #    # ###### #  # # #    # #      # #  # # #  ###
 *  #      #   #  #   #  #    # #   #     #    # #    # #   ## #    # #      # #   ## #    #
 *  ###### #    # #    #  ####  #    #    #    # #    # #    # #####  ###### # #    #  ####
 *
 *
 */

app.use(() => { throw new NotFoundError(); });

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  if (err.status === 404) {
    res.status(404).sendFile('404.html', { root: './webpages/' });
  } else if (err.status === 401) {
    res.set('WWW-Authenticate', 'Bearer realm="accounts.google.com"');
    res.status(401).sendFile('401.html', { root: './webpages/' });
  } else if (err && err.status) {
    res.status(err.status).send(err.message);
  } else {
    console.error('internal error');
    console.error(err);
    if (err && err.stack) console.error(err.stack);
    res.status(500).send('internal server error');
  }
});

process.on('unhandledRejection', (err) => {
  console.error('unhandled promise, logging the error (if any)');
  if (err) {
    console.error(err.stack || err);
  }
});

/* start server
 *
 *
 *    ####  #####   ##   #####  #####     ####  ###### #####  #    # ###### #####
 *   #        #    #  #  #    #   #      #      #      #    # #    # #      #    #
 *    ####    #   #    # #    #   #       ####  #####  #    # #    # #####  #    #
 *        #   #   ###### #####    #           # #      #####  #    # #      #####
 *   #    #   #   #    # #   #    #      #    # #      #   #   #  #  #      #   #
 *    ####    #   #    # #    #   #       ####  ###### #    #   ##   ###### #    #
 *
 *
 */

const port = process.env.PORT || config.port;
let httpsPort = process.env.PORT || config.httpsPort;

const serverReady = startServer();

function startServer() {
  return new Promise((resolve, reject) => {
    if (process.env.TESTING) {
      console.info('**************************************************');
      console.info('');
      console.info('RUNNING IN TESTING MODE');
      console.info('');
      console.info('**************************************************');
    }

    if (process.env.DISABLE_HTTPS || process.env.TESTING) {
      if (!process.env.TESTING) {
        console.warn('**************************************************');
        console.warn('');
        console.warn('WARNING: DISABLING HTTPS, THIS SERVER IS INSECURE');
        console.warn('');
        console.warn('**************************************************');
      }
      httpsPort = null;
    }

    if (!httpsPort) {
      // only HTTP
      http.createServer(app)
        .listen(port, () => {
          console.log(`LiMA server listening on insecure port ${port}`);
          resolve();
        });
    } else {
      // HTTPS; with HTTP redirecting to that
      if (process.env.GAE_APPLICATION) {
        http.createServer(app)
          .listen(port, () => {
            console.log(`LiMA server running on App Engine, Port: ${port}`);
            resolve();
          });
      } else {
        try {
          const credentials = {};
          credentials.key = fs.readFileSync(config.httpsKey, 'utf8');
          credentials.cert = fs.readFileSync(config.httpsCert, 'utf8');
          https.createServer(credentials, app).listen(httpsPort, () => {
            console.log(`LiMA server listening on HTTPS port ${httpsPort}`);

            // HTTP app will just redirect to HTTPS
            const redirectApp = express();
            // if (loggingMiddleware) redirectApp.use(loggingMiddleware);
            redirectApp.get('*', (req, res) => res.redirect('https://' + req.hostname + req.url));

            http.createServer(redirectApp).listen(port, () => {
              console.log(`LiMA redirect server listening on port ${port}`);
              resolve();
            });
          });
        } catch (error) {
          console.log(error);
          reject(error);
        }
      }
    }
  });
}

module.exports = { serverReady };
