/*
 * Living Meta Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

const express = require('express');
const googleOpenID = require('simple-google-openid');

const config = require('./config');

const api = require('./api');
const NotFoundError = require('./errors/NotFoundError');

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

/*
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

app.get('/profile/', (req, res) => res.sendFile('profile.html', { root: './webpages/' }));
app.use('/', express.static('webpages', { extensions: ['html'] }));

app.use(`/:email(${api.EMAIL_ADDRESS_RE})/`, SLASH_URL);
app.get(`/:email(${api.EMAIL_ADDRESS_RE})/`,
        api.checkUserExists,
        (req, res) => res.sendFile('profile/index.html', { root: './webpages/' }));

app.use(`/:email(${api.EMAIL_ADDRESS_RE})/:title/`, SLASH_URL);
app.get(`/:email(${api.EMAIL_ADDRESS_RE})/:title/`,
        api.checkUserExists,
        (req, res, next) => {
          api.getKindForTitle(req.params.email, req.params.title)
          .then((kind) => {
            if (kind === 'article' || kind === 'metaanalysis') {
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


/*
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

app.use((err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).sendFile('404.html', { root: './webpages/' });
  } else {
    next(err);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('unhandled promise, logging err and Error');
  console.error(err);
  console.error(new Error());
});

const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
