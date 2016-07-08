(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var gapi = window.gapi;
  var limeta = window.limeta;
  var _ = limeta._;

  var CLIENT_ID = "358237292980-kbme56c9ih4rpmob16sq8bjig5dms6pl.apps.googleusercontent.com";

  function onSignIn(googleUser) {
    // do something with the user profile
    if (!googleUser.isSignedIn()) {
      _.removeClass('body', 'signed-on');
      return;
    }

    var profile = googleUser.getBasicProfile();
    _.addClass('body', 'signed-on');
    _.fillEls('.userinfo .username', profile.getName());
    _.findEls('.userinfo .userphoto').forEach(function(el){
      if (!el.dataset.origsrc) el.dataset.origsrc = el.src;
      if (profile.getImageUrl()) el.src = profile.getImageUrl();
    });

    // register the user with the server
    var idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

    fetch('/api/register', {
      method: 'POST',
      headers: _.idTokenToFetchHeaders(idToken),
    })
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
   * Retrieve (and possibly refresh) the ID token from Google Auth, as a Promise.
   * May resolve to `null` when no user is signed in.
   */
  limeta.getGapiIDToken = function getGapiIDToken() {
    return new Promise(function (resolve, reject) {
      var currUser = gapi.auth2.getAuthInstance().currentUser.get();
      if (!currUser.isSignedIn()) {
        resolve(null);
        return;
      }
      var authResp = currUser.getAuthResponse();
      if (Date.now() < authResp.expires_at - 120000) {
        resolve(authResp.id_token);
      } else {
        // if the token is expired, or within two minutes of expiring, refresh it
        console.log('refreshing id token');
        currUser.reloadAuthResponse().then(
          function fulfilled() {
            authResp = currUser.getAuthResponse();
            resolve(authResp.id_token);
          },
          function rejected(reason) {
            console.error('error refreshing id token');
            console.error(reason);
            reject(reason);
          }
        )
      }
    });
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
