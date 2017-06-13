(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var gapi = window.gapi;
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  var CLIENT_ID = "358237292980-kbme56c9ih4rpmob16sq8bjig5dms6pl.apps.googleusercontent.com";

  function onSignIn(googleUser) {
    if (!googleUser.isSignedIn()) {
      _.removeClass('body', 'signed-on');
      return;
    }

    // check if we should redirect to the /register page - if LiMA doesn't know the user who has just logged in
    if (window.location.pathname != '/register') {
      var idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
      fetch('/api/user', {
        method: 'GET',
        headers: _.idTokenToFetchHeaders(idToken),
      })
      .then(function (res) {
        if (res.status == 401) {
          // user isn't known but someone is signed in. Redirect to register.
          window.location.href = '/register';
          // don't call any more listeners
          onSignInListeners = [];
        } else if (res.status >= 400) {
          // an unexpected error happened with /api/user, server not happy
          _.apiFail();
        } else {
          return _.fetchJson(res);
        }
      })
      .then(function(user) {
        _.addClass('body', 'signed-on');
        _.fillEls('.userinfo .username', user.username || user.email);
        _.findEls('.userinfo .userphoto').forEach(function(el){
          if (!el.dataset.origsrc) el.dataset.origsrc = el.src;
          if (user.photos[0]) el.src = user.photos[0].value;
        });
      })
      .catch(function (err) {
        console.log(err);
      });
    }

    onSignInListeners.forEach(function (cb) { cb(); });
  }

  lima.getAuthenticatedUserEmail = function getAuthenticatedUserEmail() {
    try {
      if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        return window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
      }
    } catch (e) {console.info(e);} // any errors mean no current user
    return null;
  };

  var toggleButton = _.byId('toggle-editing');

  lima.toggleEditing = function (val) {
    if (val == null) {
      lima.editing = localStorage.limaEditing !== 'false';
    } else {
      localStorage.limaEditing = lima.editing = val;
    }

    document.body.classList.toggle('editing', !!lima.editing);
  };

  if (toggleButton) {
    lima.toggleEditing();
    toggleButton.addEventListener('click', function () {
      lima.toggleEditing(!lima.editing);
      if (lima.updateView) lima.updateView();
    });
  }


  function signOut() {
    gapi.auth2.getAuthInstance().signOut().then(
      function () {
        _.findEls('.userinfo .userphoto').forEach(function(el){
          if (el.dataset.origsrc) el.src = el.dataset.origsrc;
        });
        onSignInListeners.forEach(function (cb) { cb(); });
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

  var pendingToken = null;

  lima.getGapiIDToken = function getGapiIDToken() {
    if (pendingToken) return pendingToken;

    var token = pendingToken = new Promise(function (resolve, reject) {
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
        );
      }
    });

    token.then(clearPendingToken, clearPendingToken);

    return token;
  };

  function clearPendingToken() {
    pendingToken = null;
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
        _.findEls('a.signout').forEach(function (el){el.addEventListener('click', signOut);});
        if (gauth.isSignedIn.get()) onSignIn(gauth.currentUser.get());
        try {
          if (lima.initPage) lima.initPage();
        } catch (e) {
          console.error(e);
          _.apiFail();
        }
      },
      function (err) {
        console.log('failed getting gapi auth instance');
        console.log(err);
      });
  });

  var onSignInListeners = [];

  lima.onSignInChange = function (cb) {
    if (onSignInListeners.indexOf(cb) === -1) onSignInListeners.push(cb);
  };

})(window, document);
