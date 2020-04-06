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
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const cookieParser = require('cookie-parser');
const onHeaders = require('on-headers');

const config = require('./config');

const api = require('./api');
const storage = require('./storage');
const NotFoundError = require('./errors/NotFoundError');
const stats = require('./lib/stats');

const exec = require('child_process').exec;

stats.init();
storage.init();
api.init();

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID || config.googleClientID));
app.use(cookieParser());

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

if (config.logDirectory && !process.env.TESTING) {
  morgan.token('invite', (req) => {
    if (!req.cookies) return '-';
    let retval = req.cookies['lima-beta-code'] || '';
    if (!storage.betaCodes.hasOwnProperty(req.cookies['lima-beta-code'])) retval = '-' + retval;
    return retval;
  });
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

/* stats
 *
 *
 *    ####  #####   ##   #####  ####
 *   #        #    #  #    #   #
 *    ####    #   #    #   #    ####
 *        #   #   ######   #        #
 *   #    #   #   #    #   #   #    #
 *    ####    #   #    #   #    ####
 *
 *
 */

// send server-is-alive statistics
stats.count('started');
setInterval(() => {
  stats.count('alive');
}, 60000);

// send path access statistics
app.use('/', (req, res, next) => {
  res.limaStatsStartTime = Date.now();
  stats.count('access.total');
  onHeaders(res, sendRequestTimeStats);
  next();
});

function sendRequestTimeStats() {
  const time = Date.now() - this.limaStatsStartTime;
  const metricName = this.limaStatsIsAPI ? 'access.apiTime' : 'access.totalTime';
  stats.timing(metricName, time);
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

if (!process.env.TESTING) {
  // regex for quickly checking for selected paths to be allowed: /css, /js, /img, /api
  const closedBetaAllowedURLs = /^\/(css|js|img|api|\.well-known)\//;

  app.use('/', (req, res, next) => {
    if (req.url.match(closedBetaAllowedURLs)) {
      next();
    } else if (req.cookies && storage.betaCodes.hasOwnProperty(req.cookies['lima-beta-code'])) {
      storage.touchBetaCode(req.cookies['lima-beta-code'], req.user ? req.user.emails[0].value : undefined);
      next();
    } else if (req.url === '/') {
      res.sendFile('coming-soon.html', { root: './webpages/' });
    } else {
      res.redirect('/');
    }
  });
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

app.use('/api', api);

app.get('/version', oneLineVersion);
app.get('/version/log',
        (req, res) => res.redirect('https://github.com/jacekkopecky/living-meta-analysis/commits/master'));

app.get(['/profile', '/profile/*'],
        (req, res) => res.sendFile('profileRedirect.html', { root: './webpages/' }));

app.use('/', express.static('webpages', { extensions: ['html'] }));

// the routes below would catch any of the above so need to come last

app.use(`/:user(${config.USER_RE})/`, SLASH_URL);
app.get(`/:user(${config.USER_RE})/`,
        api.EXISTS_USER,
        (req, res) => res.sendFile('profile/profile.html', { root: './webpages/' }));

app.use(`/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, SLASH_URL);
app.get(`/:user(${config.USER_RE})/${config.NEW_PAPER_TITLE}/`,
        api.EXISTS_USER,
        (req, res) => res.sendFile('profile/paper.html', { root: './webpages/' }));
app.get(`/:user(${config.USER_RE})/${config.NEW_META_TITLE}/`,
        api.EXISTS_USER,
        (req, res) => res.sendFile('profile/metaanalysis.html', { root: './webpages/' }));
app.get(`/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
        api.EXISTS_USER,
        (req, res, next) => {
          Promise.resolve(req.query.type || api.getKindForTitle(req.params.user, req.params.title))
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

let oneLineVersionString = 'version unknown';

function oneLineVersion(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send(oneLineVersionString);
}

if (!process.env.TESTING) {
  exec('git log -1 --date=short --pretty=format:"%ad"',
    (error, stdout, stderr) => {
      if (error) oneLineVersionString = 'error getting version: ' + error + '\n' + stderr;
      else oneLineVersionString = stdout;
    }
  );
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

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
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
  stats.count('http.code' + res.statusCode);
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
let httpsPort = process.env.HTTPSPORT || config.httpsPort;

module.exports.ready = storage.ready.then(() => new Promise((resolve, reject) => {
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
    try {
      const credentials = {};
      credentials.key = fs.readFileSync(config.httpsKey, 'utf8');
      credentials.cert = fs.readFileSync(config.httpsCert, 'utf8');

      https.createServer(credentials, app).listen(httpsPort, () => {
        console.log(`LiMA server listening on HTTPS port ${httpsPort}`);

        // HTTP app will just redirect to HTTPS
        const redirectApp = express();
        if (loggingMiddleware) redirectApp.use(loggingMiddleware);
        redirectApp.get('*', (req, res) => res.redirect('https://' + req.hostname + req.url));

        http.createServer(redirectApp).listen(port, () => {
          console.log(`LiMA redirect server listening on port ${port}`);
          resolve();
        });
      });
    } catch (e) {
      console.error('error starting HTTPS', e.message || e);
      reject(e);
    }
  }
}))
.catch((err) => {
  console.error('startup failed', err && err.stack);
  process.exit(-1);
});
