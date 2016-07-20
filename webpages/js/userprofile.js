(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  lima.apiFail = lima.apiFail || function(){};

  lima.requestAndFillUserProfile = function requestAndFillUserProfile() {
    lima.whenUserPageIsAboutIsKnown = whenUserPageIsAboutIsKnown;
    lima.getGapiIDToken()
    .then(function (idToken) {
      var email = lima.extractUserProfileEmailFromUrl();
      return fetch('/api/profile/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(fillUserProfile)
    .catch(function (err) {
      if (err.status === 404) {
        _.notFound();
        return;
      }
      console.error("problem getting profile");
      console.error(err);
      lima.apiFail();
    });
  }

  lima.extractUserProfileEmailFromUrl = function extractUserProfileEmailFromUrl() {
    // the path of a page attributed to a user will be '/email/something',
    // so extract the 'email' portion here:
    return window.location.pathname.substring(1, window.location.pathname.indexOf('/', 1));
  }

  function fillUserProfile(user) {
    lima.userPageIsAbout = user;

    functionsWaiting.forEach(function (f) { f(); });
    functionsWaiting = [];

    _.fillEls('#personalinfo .name', user.displayName);
    _.fillEls('#personalinfo .email', user.email);
    _.fillEls('#personalinfo .joined .date', _.formatNiceDate(user.joined));
    if (user.photos && user.photos[0] && user.photos[0].value) {
      _.setProps('#personalinfo .photo', 'src', user.photos[0].value);
    }
    _.removeClass('#personalinfo', 'loading');

    _.setYouOrName();
  }

  var functionsWaiting = [];

  function whenUserPageIsAboutIsKnown(f) {
    if (functionsWaiting.indexOf(f) === -1) functionsWaiting.push(f);
  }

})(window, document);
