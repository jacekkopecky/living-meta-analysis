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

const config = require('./config');

const api = require('./api');
const NotFoundError = require('./errors/NotFoundError');

const exec = require('child_process').exec;

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

// simple logging when debugging
// app.use((req, resp, next) => { console.log(req.path); next(); });

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
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/new-paper/`,
        api.checkUserExists,
        (req, res) => res.sendFile('profile/paper.html', { root: './webpages/' }));
app.get(`/:email(${config.EMAIL_ADDRESS_RE})/new-metaanalysis/`,
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

exec('git log -1 --pretty=format:"%ai \'%s\'"',
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
    console.log(`not found at ${req.path}`);
    res.status(404).sendFile('404.html', { root: './webpages/' });
  } else if (err.status === 401) {
    res.set('WWW-Authenticate', 'Bearer realm="accounts.google.com"');
    res.status(401).sendFile('401.html', { root: './webpages/' });
  } else if (err.status === 409) {
    res.status(409).send(err.message);
  } else if (err.status === 501) {
    console.log(`not implemented at ${req.path}`);
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

const port = process.env.PORT || config.port;
const httpsPort = process.env.HTTPSPORT || config.httpsPort;

api.ready.then(() => {
  http.createServer(app)
  .listen(port, () => console.log(`LiMA server listening on port ${port}`));

  if (config.httpsPort) {
    try {
      const httpsKey = fs.readFileSync(config.httpsKey, 'utf8');
      const httpsCert = fs.readFileSync(config.httpsCert, 'utf8');
      const credentials = { key: httpsKey, cert: httpsCert };
      https.createServer(credentials, app)
      .listen(httpsPort, () => console.log(`LiMA server listening on HTTPS port ${httpsPort}`));
    } catch (e) {
      console.error('error starting https', e.message || e);
    }
  }
});
