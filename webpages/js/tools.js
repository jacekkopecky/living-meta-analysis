(function (document, window) {
  var limeta = window.limeta = window.limeta || {};
  var _ = window.limeta._ = {};

  /*
   * param root is optional
   */
  _.findEl = function findEl(root, selector) {
    if (selector == null) {
      selector = root;
      root = document;
    }
    return root.querySelector(selector);
  }

  /*
   * param root is optional
   */
  _.findEls = function findEls(root, selector) {
    if (selector == null) {
      selector = root;
      root = document;
    }
    return _.array(root.querySelectorAll(selector));
  }

  _.byId = function byId(id) {
    return document.getElementById(id);
  }

  _.array = function array(arr) {
      return [].slice.call(arr);
  }

  _.fillEls = function fillEls(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.textContent = value; });
  }

  _.setProps = function setProps(root, selector, attr, value) {
    if (value == null) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el[attr] = value; });
  }

  _.addClass = function addClass(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.add(value);});
  }

  _.removeClass = function removeClass(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove(value);});
  }

  _.notFound = function notFound() {
    document.body.innerHTML = '';
    fetch('/404')
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting 404');
      console.error(err);
      return '404 not found';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    })
  }

  var months = ['Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec '];

  _.formatNiceDate = function formatNiceDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return months[d.getMonth()] + d.getDate() + ', ' + d.getFullYear();
  }

  _.formatDate = function formatDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return d.getFullYear() + "-" + twoDigits((d.getMonth()+1)) + "-" + twoDigits(d.getDate());
  }

  _.formatTime = function formatTime(d) {
    if (typeof d !== "object") d = new Date(+d);
    return twoDigits(d.getHours()) + ":" + twoDigits(d.getMinutes());
  }

  _.formatDateTime = function formatDateTime(d) {
    return _.formatDate(d) + " " + _.formatTime(d);
  }

  function twoDigits(x) {
    return x < 10 ? "0" + x : "" + x;
  }


  var listeningForCurrentUser = false;
  /*
   * if the currently logged-in user matches the user the page is about,
   * use "your" and "you" in some places in the whole document,
   * otherwise use "Jo's" or "Jo" if the fname of the user the page is about is "Jo".
   *
   * The places to change are elements with the following classes (case is significant):
   * fnOrYour, fnOryou
   */
  _.setYouOrName = function setYouOrName() {
    if (!listeningForCurrentUser) {
      listeningForCurrentUser = true;
      window.gapi.auth2.getAuthInstance().currentUser.listen(setYouOrName);
    }

    var currentUser = null;
    try {
      if (window.gapi.auth2.getAuthInstance().currentUser.get().isSignedIn()) {
        currentUser = window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
      }
    } catch (e) {console.info(e);} // any errors mean no current user

    if (!limeta.userPageIsAbout) {
      if (limeta.whenUserPageIsAboutIsKnown) {
        limeta.whenUserPageIsAboutIsKnown(setYouOrName);
        return;
      } else {
        console.error('setNameOfYou can\'t be called on a page that\'s not about a user');
        return;
      }
    }

    var y = (currentUser == limeta.userPageIsAbout.email);
    var n = limeta.userPageIsAbout.name.givenName || 'User';

    document.body.classList[y ? 'add' : 'remove']('page-about-you');

    _.fillEls('.fnOrYour', y ? 'Your' : n + "'s");
    _.fillEls('.fnOryou',  y ? 'you'  : n       );
  }


  /*
   * with fetch API, get the response JSON, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchJson = function fetchJson(response) {
    if (response.ok) return response.json();
    else return Promise.reject(response);
  }

  /*
   * with fetch API, get the response as text, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchText = function fetchText(response) {
    if (response.ok) return response.text();
    else return Promise.reject(response);
  }

  _.idTokenToFetchOptions = function idTokenToFetchOptions(idToken) {
    return idToken ? { headers: _.idTokenToFetchHeaders(idToken) } : void 0;
  }

  _.idTokenToFetchHeaders = function idTokenToFetchHeaders(idToken) {
    return idToken ? { "Authorization": "Bearer " + idToken } : {};
  }


})(document, window);
