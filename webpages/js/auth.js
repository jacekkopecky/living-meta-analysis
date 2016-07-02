(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var gapi = window.gapi;
  var limeta = window.limeta;
  var _ = limeta._;

  var CLIENT_ID = "358237292980-kbme56c9ih4rpmob16sq8bjig5dms6pl.apps.googleusercontent.com";

  function onSignIn(googleUser) {
    // do something with the user profile
    if (!googleUser.isSignedIn()) {
      _.addClass('.userinfo', 'signedoff');
      return;
    }

    var profile = googleUser.getBasicProfile();
    _.removeClass('.userinfo', 'signedoff');
    _.fillEls('.userinfo .username', profile.getName());
    _.findEls('.userinfo .userphoto').forEach(function(el){
      if (!el.dataset.origsrc) el.dataset.origsrc = el.src;
      if (profile.getImageUrl()) el.src = profile.getImageUrl();
    });

    // register the user with the server
    var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/register');
    xhr.setRequestHeader("Authorization", "Bearer " + id_token);
    xhr.send();
  }

  function signOut() {
    gapi.auth2.getAuthInstance().signOut().then(
      function () {
        _.findEls('.userinfo .userphoto').forEach(function(el){
          if (el.dataset.origsrc) el.src = el.dataset.origsrc;
        });
      },
      function (err) {
        console.log('error signing out');
        console.log(err);
      });
  }

  /*
   * Retrieve (and possibly refresh) the ID token from Google Auth, then call `cb`.
   * As usual, `cb` has two parameters: (err, token) - if an error should occur, `err` will have a value,
   * otherwise `token` will have a value.
   */
  limeta.getGapiIDToken = function getGapiIDToken(cb) {
    var currUser = gapi.auth2.getAuthInstance().currentUser.get();
    var authResp = currUser.getAuthResponse();
    if (Date.now() > authResp.expires_at - 120000) {
      // if the token is expired, or within two minutes of expiring, refresh it
      console.log('refreshing id token');
      currUser.reloadAuthResponse().then(
        function fulfilled() {
          authResp = currUser.getAuthResponse();
          cb(null, authResp.id_token);
        },
        function rejected(reason) {
          console.log('refreshing id token error');
          cb(reason);
        }
      )
    } else {
      // call the callback asynchronously but immediately
      setTimeout(cb, 0, null, authResp.id_token);
    }
  }


// todo distinguish initPage and gapiReady somehow because we can have a token already cached (localStroage)
// add param to getGapiIDToken to force immediate return of no token if none is available
// add whenGapiAuth2IsReady(fn)?
// because currently it takes a lot of time for the page to start touching the API and loading real stuff

  gapi.load('auth2', function() {
    gapi.auth2.init({client_id: CLIENT_ID });
    gapi.auth2.getAuthInstance().then(
      function (gauth) {
        gauth.currentUser.listen(onSignIn);
        _.findEls('a.signout').forEach(function (el){el.addEventListener('click', signOut)});
        if (gauth.isSignedIn.get()) onSignIn(gauth.currentUser.get());
        if (limeta.initPage) limeta.initPage();
      },
      function (err) {
        console.log('failed getting gapi auth instance');
        console.log(err);
      });
  })

})(window, document);
