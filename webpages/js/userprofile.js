(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var _ = window._;

  window.apiFail = window.apiFail || function(){};

  window.requestAndFillUserProfile = function requestAndFillUserProfile() {
    window.getGapiIDToken(function (err, id_token) {
      if (err) {
        console.err("no ID token to call the API");
        console.err(err);
        window.apiFail();
        return;
      }

      // the path will be '/email/something', so extract the 'email' portion here:
      var email = window.location.pathname.substring(1, window.location.pathname.indexOf('/', 1));

      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/profile/' + email);
      xhr.setRequestHeader("Authorization", "Bearer " + id_token);

      xhr.onload = fillUserProfile;
      xhr.send();

    });
  }

  function fillUserProfile() {
    var xhr = this;
    if (xhr.status === 404) {
      _.notFound();
      return;
    }
    if (xhr.status > 299) {
      window.apiFail();
      return;
    }
    console.log(xhr.response);
    var user = JSON.parse(xhr.responseText);
    _.fillEls('#personalinfo .name', user.displayName);
    _.fillEls('#personalinfo .email', user.email);
    _.fillEls('#personalinfo .joined .date', new Date(user.joined).toDateString());
    if (user.photos && user.photos[0] && user.photos[0].value) {
      _.setProps('#personalinfo .photo', 'src', user.photos[0].value);
    }
  }


})(window, document);
