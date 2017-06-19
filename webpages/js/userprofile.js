(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  lima.localStorageUsername = 'local';

  lima.onSignInChange(redirectLocalProfile);

  // redirect /local when a user is signed in
  function redirectLocalProfile() {
    var user = lima.getAuthenticatedUserEmail();
    if (user && window.location.pathname == '/' + lima.localStorageUsername + '/') {
      window.location.href = '/profile';
    }
  }

  lima.requestAndFillUserProfile = function requestAndFillUserProfile() {
    var email = lima.extractUserProfileEmailFromUrl();

    if (email == lima.localStorageUsername) {
      lima.userLocalStorage = true;
      lima.userPageIsAbout = {};
      hideUserProfile();
      return;
    }

    lima.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/profile/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(function (user) {
      changeUrlToUsername(user, email);
      fillUserProfile(user);
    })
    .catch(function (err) {
      if (err.status === 404) {
        _.notFound();
        return;
      }
      console.error("problem getting profile");
      console.error(err);
      _.apiFail();
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
      var signInButton = _.findEl('div.g-signin2.signin');
      // the way Google have implemented this button, clicking on the first child of the button placeholder works
      if (signInButton && signInButton.children[0]) signInButton.children[0].click();
    });
  }

  function changeUrlToUsername(user, email) {
    // email might actually already be a username in which case do nothing
    if (user.username && email.indexOf('@') !== -1) {
      var newHref = '/' + user.username + window.location.pathname.substring(window.location.pathname.indexOf('/', 1));
      window.history.replaceState({}, 'username', newHref);
    }
  }

  function fillUserProfile(user) {
    lima.userPageIsAbout = user;

    functionsWaiting.forEach(function (f) { f(); });
    functionsWaiting = [];

    _.fillEls('#personalinfo div.username span', user.username);
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

  lima.whenUserPageIsAboutIsKnown = function whenUserPageIsAboutIsKnown(f) {
    if (lima.userPageIsAbout) {
      setTimeout(f, 0); // call the function asynchronously
    } else {
      if (functionsWaiting.indexOf(f) === -1) functionsWaiting.push(f);
    }
  };

})(window, document);
