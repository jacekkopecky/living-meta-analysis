(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.requestAndFillUserProfile = function requestAndFillUserProfile() {
    limeta.whenUserPageIsAboutIsKnown = whenUserPageIsAboutIsKnown;
    limeta.getGapiIDToken().then(
      function fulfilled(idToken) {
        var email = limeta.extractUserProfileEmailFromUrl();

        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/profile/' + email);
        if (idToken) xhr.setRequestHeader("Authorization", "Bearer " + idToken);

        xhr.onload = fillUserProfile;
        xhr.send();
      },
      function rejected(err) {
        console.err("problem getting ID token from GAPI");
        console.err(err);
        limeta.apiFail();
      }
    );
  }

  limeta.extractUserProfileEmailFromUrl = function extractUserProfileEmailFromUrl() {
    // the path of a page attributed to a user will be '/email/something',
    // so extract the 'email' portion here:
    return window.location.pathname.substring(1, window.location.pathname.indexOf('/', 1));
  }

  function fillUserProfile() {
    var xhr = this;
    if (xhr.status === 404) {
      _.notFound();
      return;
    }
    if (xhr.status > 299) {
      limeta.apiFail();
      return;
    }

    var user = JSON.parse(xhr.responseText);
    limeta.userPageIsAbout = user;

    functionsWaiting.forEach(function (f) { f(); });
    functionsWaiting = [];

    _.fillEls('#personalinfo .name', user.displayName);
    _.fillEls('#personalinfo .email', user.email);
    _.fillEls('#personalinfo .joined .date', _.formatNiceDate(user.joined));
    if (user.photos && user.photos[0] && user.photos[0].value) {
      _.setProps('#personalinfo .photo', 'src', user.photos[0].value);
    }

    _.setYouOrName();
  }

  var functionsWaiting = [];

  function whenUserPageIsAboutIsKnown(f) {
    if (functionsWaiting.indexOf(f) === -1) functionsWaiting.push(f);
  }

})(window, document);
