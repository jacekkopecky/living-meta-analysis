/*
 * Living Meta Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

const express = require('express');
const googleOpenID = require('simple-google-openid');


const app = express({ caseSensitive: true });
app.set('case sensitive routing', true);

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

app.use('/', express.static('webpages', { extensions: ['html'] }));

app.use([/\/[a-zA-Z.+-]+@[a-zA-Z.+-]+\//, '/profile/'], express.static('webpages/user'));
app.use([/\/[a-zA-Z.+-]+@[a-zA-Z.+-]+/, '/profile'], (req, resp) => resp.redirect(req.path + '/'));

app.use('/api', require('./api'));

const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
