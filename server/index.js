/*
 * Living Meta Analysis server.
 *
 * Author: Jacek Kopecky jacek.kopecky@port.ac.uk
 */

'use strict';

const express = require('express');
const googleOpenID = require('simple-google-openid');


const app = express();

app.use(googleOpenID(process.env.GOOGLE_CLIENT_ID));

app.use('/', express.static('webpages'));

app.use([/\/[a-z.+-]+@[a-z.+-]+\//, '/profile/'], express.static('webpages/user'));
app.use([/\/[a-z.+-]+@[a-z.+-]+/, '/profile'], (req, resp) => resp.redirect(req.path + '/'));

const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
