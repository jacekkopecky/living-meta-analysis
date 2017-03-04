/*
 * Living Meta-Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

const express = require('express');
const googleOpenID = require('simple-google-openid');
const http = require('http');
const https = require('https');
const fs = require('fs');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const cookieParser = require('cookie-parser');

const config = require('./config');

const api = require('./api');
const storage = require('./storage');
const NotFoundError = require('./errors/NotFoundError');

const exec = require('child_process').exec;

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

/* logging
 *
 *
 *   #       ####   ####   ####  # #    #  ####
 *   #      #    # #    # #    # # ##   # #    #
 *   #      #    # #      #      # # #  # #
 *   #      #    # #  ### #  ### # #  # # #  ###
 *   #      #    # #    # #    # # #   ## #    #
 *   ######  ####   ####   ####  # #    #  ####
 *
 *
 */

let loggingMiddleware;

if (config.logDirectory) {
  // ensure log directory exists
  if (!fs.existsSync(config.logDirectory)) fs.mkdirSync(config.logDirectory);

  // create a rotating write stream
  const accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    compress: true,
    path: config.logDirectory,
  });

  // setup the logger
  loggingMiddleware = morgan(config.logFormat || 'combined', { stream: accessLogStream });
  app.use(loggingMiddleware);
  console.log(`logging HTTP accesses into ${config.logDirectory}`);
} else {
  console.log('not logging HTTP accesses');
}


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

// regex for quickly checking for selected paths to be allowed: /css, /js, /img, /api
const closedBetaAllowedURLs = /^\/(css|js|img|api)\//;

app.use('/', cookieParser(), (req, res, next) => {
  if (req.url.match(closedBetaAllowedURLs)) {
    next();
  } else if (storage.betaCodes.hasOwnProperty(req.cookies['lima-beta-code'])) {
    storage.touchBetaCode(req.cookies['lima-beta-code'], req.user ? req.user.emails[0].value : undefined);
    next();
  } else if (req.url === '/') {
    res.sendFile('coming-soon.html', { root: './webpages/' });
  } else {
    res.redirect('/');
  }
});

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

app.get('/version', oneLineVersion);
app.get('/version/log',
        (req, res) => res.redirect('https://github.com/jacekkopecky/living-meta-analysis/commits/master'));

app.get(['/profile', '/profile/*'],
        (req, res) => res.sendFile('profileRedirect.html', { root: './webpages/' }));

app.use('/', express.static('webpages', { extensions: ['html'] }));

app.use(`/:email(${config.EMAIL_ADDRESS_RE})/`, SLASH_URL);
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/`,
        api.checkUserExists,
        (req, res) => res.sendFile('profile/profile.html', { root: './webpages/' }));

app.use(`/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`, SLASH_URL);
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/${config.NEW_PAPER_TITLE}/`,
        api.checkUserExists,
        (req, res) => res.sendFile('profile/paper.html', { root: './webpages/' }));
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/${config.NEW_META_TITLE}/`,
        api.checkUserExists,
        (req, res) => res.sendFile('profile/metaanalysis.html', { root: './webpages/' }));
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`,
        api.checkUserExists,
        (req, res, next) => {
          api.getKindForTitle(req.params.email, req.params.title)
          .then((kind) => {
            if (kind === 'paper' || kind === 'metaanalysis') {
              const file = `profile/${kind}.html`;
              res.sendFile(file, { root: './webpages/' });
            } else {
              next(new NotFoundError());
            }
          })
          .catch(() => next(new NotFoundError()));
        });

function SLASH_URL(req, res, next) {
  if (req.originalUrl[req.originalUrl.length - 1] === '/') {
    next();
  } else {
    res.redirect(req.originalUrl + '/');
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

let oneLineVersionString = 'version unknown';

function oneLineVersion(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send(oneLineVersionString);
}

exec('git log -1 --date=short --pretty=format:"%ad"',
  (error, stdout, stderr) => {
    if (error) oneLineVersionString = 'error getting version: ' + error + '\n' + stderr;
    else oneLineVersionString = stdout;
  }
);

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

if (config.demoApiDelay) {
  // this is a delay for demonstration purposes so the server seems slow
  app.use((req, res, next) => setTimeout(next, config.demoApiDelay));
}

app.use('/api', api);

app.use(() => { throw new NotFoundError(); });

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.status === 404) {
    res.status(404).sendFile('404.html', { root: './webpages/' });
  } else if (err.status === 401) {
    res.set('WWW-Authenticate', 'Bearer realm="accounts.google.com"');
    res.status(401).sendFile('401.html', { root: './webpages/' });
  } else if (err.status === 409) {
    res.status(409).send(err.message);
  } else if (err.status === 501) {
    res.status(501).send(err.message);
  } else {
    console.error('internal error');
    console.error(err);
    if ('stack' in err) console.error(err.stack);
    res.status(500).send('internal server error');
  }
});

process.on('unhandledRejection', (err) => {
  console.error('unhandled promise, logging err and Error');
  console.error(err);
  console.error(new Error());
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
let httpsPort = process.env.HTTPSPORT || config.httpsPort;

api.ready.then(() => {
  if (process.env.DISABLE_HTTPS) {
    console.warn('**************************************************');
    console.warn('');
    console.warn('WARNING: DISABLING HTTPS, THIS SERVER IS INSECURE');
    console.warn('');
    console.warn('**************************************************');
    httpsPort = null;
  }

  if (!httpsPort) {
    // only HTTP
    http.createServer(app)
    .listen(port, () => console.log(`LiMA server listening on insecure port ${port}`));
  } else {
    // HTTPS; with HTTP redirecting to that
    try {
      const credentials = {};
      credentials.key = fs.readFileSync(config.httpsKey, 'utf8');
      credentials.cert = fs.readFileSync(config.httpsCert, 'utf8');

      https.createServer(credentials, app).listen(httpsPort, () => {
        console.log(`LiMA server listening on HTTPS port ${httpsPort}`);
      });

      // HTTP app will just redirect to HTTPS
      const redirectApp = express();
      if (loggingMiddleware) redirectApp.use(loggingMiddleware);
      redirectApp.get('*', (req, res) => res.redirect('https://' + req.hostname + req.url));

      http.createServer(redirectApp).listen(port, () => {
        console.log(`LiMA redirect server listening on port ${port}`);
      });
    } catch (e) {
      console.error('error starting HTTPS', e.message || e);
    }
  }
});
