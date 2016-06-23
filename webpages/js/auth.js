(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var gapi = window.gapi;
  var _ = window._;

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

    // this is for debugging only
    window.guser = googleUser;
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

  gapi.load('auth2', function() {
    gapi.auth2.init({client_id: CLIENT_ID });
    gapi.auth2.getAuthInstance().then(
      function (gauth){
        gauth.currentUser.listen(onSignIn);
        _.findEls('a.signout').forEach(function (el){el.addEventListener('click', signOut)});
        if (gauth.isSignedIn.get()) onSignIn(gauth.currentUser.get());
        if (window.initPage) window.initPage();
      },
      function (err){
        console.log('failed getting gapi auth instance');
        console.log(err);
      });
  })

})(window, document);
