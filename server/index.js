/*
 * Living Meta Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

const express = require('express');
const googleOpenID = require('simple-google-openid');

const api = require('./api');
const NotFoundError = require('./errors/NotFoundError');

const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);
app.set('strict routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

app.use('/profile', (req, res) => res.sendFile('profile.html', { root: './webpages/' }));
app.use('/', express.static('webpages', { extensions: ['html'] }));

app.use('/:email([a-zA-Z.+-]+@[a-zA-Z.+-]+)/',
        api.checkUserExists,
        express.static('webpages/profile', { extensions: ['html'] }));

app.use('/api', api);

app.use(() => { throw new NotFoundError(); });

app.use((err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).sendFile('404.html', { root: './webpages/' });
  } else {
    next(err);
  }
});

const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
