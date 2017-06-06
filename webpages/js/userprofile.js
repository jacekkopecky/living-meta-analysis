(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  lima.localStorageUserEmailAddress = 'lima@local';

  lima.requestAndFillUserProfile = function requestAndFillUserProfile() {
    var email = lima.extractUserProfileEmailFromUrl();

    if (email == lima.localStorageUserEmailAddress) {
      lima.userLocalStorage = true;
      lima.userPageIsAbout = {};
      hideUserProfile();
      return;
    }

    lima.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/known/' + email, {
        method: 'GET',
        headers: _.idTokenToFetchHeaders(idToken),
      });
    })
    .then(function (res) {
      if (res.status !== 403) {
        lima.getGapiIDToken()
        .then(function (idToken) {
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
          _.apiFail();
        });
      } else {
        return Promise.reject();
      }
    })
    .catch(function(err) {
      // User unknown
      // todo: do we handle this? Return lima@local?
      console.error(err);
    });
  };

  lima.extractUserProfileEmailFromUrl = function extractUserProfileEmailFromUrl() {
    // the path of a page attributed to a user will be '/email/something',
    // so extract the 'email' portion here:
    return window.location.pathname.substring(1, window.location.pathname.indexOf('/', 1));
  };

  function hideUserProfile() {
    _.removeClass('#personalinfo', 'loading');
    _.addClass('#personalinfo', 'localediting');
    _.addEventListener('#personalinfo .resetlocalstorage', 'click', function () {
      if (window.confirm('Really reset local storage? All your locally-saved changes will be gone. This cannot be undone.')) {
        localStorage.clear();
        console.info('cleared local storage');
        window.location.reload();
      }
    });
    _.addEventListener('#personalinfo .register', 'click', function() {
      window.location.href = '/register';
    });
  }

  function fillUserProfile(user) {
    if (JSON.stringify(user) != JSON.stringify({})) { // we have a user
      lima.userPageIsAbout = user;

      functionsWaiting.forEach(function (f) { f(); });
      functionsWaiting = [];

      _.fillEls('#personalinfo div.username span', user.username || 'none');
      _.fillEls('#personalinfo .name', user.displayName);
      _.fillEls('#personalinfo .email', user.email);
      _.fillEls('#personalinfo .joined .date', _.formatNiceDate(user.joined));
      if (user.photos && user.photos[0] && user.photos[0].value) {
        _.setProps('#personalinfo .photo', 'src', user.photos[0].value);
      }
      _.removeClass('#personalinfo', 'loading');

      _.setYouOrName();
    } else { // we have a signed in user, but they've not registered. Redirect them.
      console.log("User is not registered?");
      window.location.href = '/register';
    }
  }

  var functionsWaiting = [];

  lima.whenUserPageIsAboutIsKnown = function whenUserPageIsAboutIsKnown(f) {
    if (functionsWaiting.indexOf(f) === -1) functionsWaiting.push(f);
  };

})(window, document);
