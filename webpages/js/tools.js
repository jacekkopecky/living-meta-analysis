(function (document, window) {
  var lima = window.lima = window.lima || {};
  var _ = window.lima._ = {};

  /* dom functions
   *
   *
   *  #####   ####  #    #    ###### #    # #    #  ####  ##### #  ####  #    #  ####
   *  #    # #    # ##  ##    #      #    # ##   # #    #   #   # #    # ##   # #
   *  #    # #    # # ## #    #####  #    # # #  # #        #   # #    # # #  #  ####
   *  #    # #    # #    #    #      #    # #  # # #        #   # #    # #  # #      #
   *  #    # #    # #    #    #      #    # #   ## #    #   #   # #    # #   ## #    #
   *  #####   ####  #    #    #       ####  #    #  ####    #   #  ####  #    #  ####
   *
   *
   */

  /*
   * param root is optional
   */
  _.findEl = function findEl(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    if (!selector) return undefined;
    return root.querySelector(selector);
  }

  /*
   * param root is optional
   */
  _.findEls = function findEls(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    if (!selector) return [];
    return _.array(root.querySelectorAll(selector));
  }

  /*
   * finds the preceding sibling or ancestor that matches a selector, or returns null if not found
   */
  _.findPrecedingEl = function findPrecedingEl(el, selector) {
    while (el && !el.matches(selector)) el = el.previousElementSibling || el.parentElement;
    return el;
  }

  _.byId = function byId(id) {
    return document.getElementById(id);
  }

  _.cloneTemplate = function cloneTemplate(template) {
    if (!(template instanceof Node)) template = _.byId(template);
    if (!template) return void 0;

    return template.content.cloneNode(true);
  }

  _.array = function array(arr) {
      return [].slice.call(arr);
      // todo NodeList returned by document.querySelectorAll is soon getting .forEach so this function may soon no longer be needed
  }

  function valOrFun(val, param) {
    return (typeof val === 'function' && val.valOrFun !== 'val') ? val(param) : val;
  }

  _.f = function val(f) {
    if (typeof f === 'function') f.valOrFun = 'val';
    return f;
  }

  _.fillEls = function fillEls(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) {
      var newVal = valOrFun(value, el);
      if (el.textContent != newVal) el.textContent = newVal || '';
    });
  }

  _.setProps = function setProps(root, selector, attr, value) {
    if (!(root instanceof Node)) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el[attr] = valOrFun(value, el); });
  }

  _.setDataProps = function setDataProps(root, selector, name, value) {
    if (!(root instanceof Node)) {
      value = name;
      name = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.dataset[name] = valOrFun(value, el); });
  }

  _.addClass = function addClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.add(valOrFun(value, el));});
  }

  _.removeClass = function removeClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove(valOrFun(value, el));});
  }

  _.addEventListener = function addEventListener(root, selector, event, f) {
    if (!(root instanceof Node)) {
      f = event;
      event = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.addEventListener(event, f);});
  }

  _.fillTags = function fillTags(root, selector, tags, flashTag) {
    if (!(root instanceof Node)) {
      flashTag = tags;
      tags = selector;
      selector = root;
      root = document;
    }
    if (!tags) tags = [];

    var tagTemplate = _.byId('tag-template');
    var newTagTemplate = _.byId('new-tag-template');
    _.findEls(root, selector).forEach(function (el) {
      el.innerHTML = '';
      el.classList[tags.length ? 'remove' : 'add']('empty');
      tags.forEach(function (tag) {
        var tagEl = _.cloneTemplate(tagTemplate).children[0];
        _.fillEls(tagEl, '.tag', tag);
        if (flashTag === tag) {
          tagEl.classList.add('flash');
          setTimeout(function(){tagEl.classList.remove('flash');}, 50);
        }
        el.appendChild(tagEl);
      });
      if (newTagTemplate) el.appendChild(_.cloneTemplate(newTagTemplate));
    });
  }



  /* move array
   *
   *
   *    #    #  ####  #    # ######      ##   #####  #####    ##   #   #
   *    ##  ## #    # #    # #          #  #  #    # #    #  #  #   # #
   *    # ## # #    # #    # #####     #    # #    # #    # #    #   #
   *    #    # #    # #    # #         ###### #####  #####  ######   #
   *    #    # #    #  #  #  #         #    # #   #  #   #  #    #   #
   *    #    #  ####    ##   ######    #    # #    # #    # #    #   #
   *
   *
   * Move item `i` in array `arr` to the left or right.
   * `left` indicates direction; if `most`, move to the beginning (left) or end (right) of the array.
   */
  _.moveInArray = function moveInArray(arr, i, left, most) {
    var moveTo = undefined;
    if (left) {
      if (i === 0) return arr;
      moveTo = most ? 0 : i-1;
    } else {
      if (i === arr.length - 1) return arr;
      moveTo = most ? arr.length - 1 : i+1;
    }

    _.moveArrayElement(arr, i, moveTo);
    return arr;
  }

  _.moveArrayElement = function moveArrayElement(arr, oldIndex, newIndex) {
    if (oldIndex === newIndex || !Array.isArray(arr)) return arr;
    var content = arr[oldIndex];
    arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, content);
    return arr;
  }



  /* error handling
   *
   *
   *    ###### #####  #####   ####  #####     #    #   ##   #    # #####  #      # #    #  ####
   *    #      #    # #    # #    # #    #    #    #  #  #  ##   # #    # #      # ##   # #    #
   *    #####  #    # #    # #    # #    #    ###### #    # # #  # #    # #      # # #  # #
   *    #      #####  #####  #    # #####     #    # ###### #  # # #    # #      # #  # # #  ###
   *    #      #   #  #   #  #    # #   #     #    # #    # #   ## #    # #      # #   ## #    #
   *    ###### #    # #    #  ####  #    #    #    # #    # #    # #####  ###### # #    #  ####
   *
   *
   */

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

  _.apiFail = function apiFail() {
    document.body.innerHTML = '';
    fetch('/apifail')
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting apifail page');
      console.error(err);
      return 'sorry, the server is temporarily unhappy (API failure)';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    })
  }


  /* formatting
   *
   *
   *   ######  ####  #####  #    #   ##   ##### ##### # #    #  ####
   *   #      #    # #    # ##  ##  #  #    #     #   # ##   # #    #
   *   #####  #    # #    # # ## # #    #   #     #   # # #  # #
   *   #      #    # #####  #    # ######   #     #   # #  # # #  ###
   *   #      #    # #   #  #    # #    #   #     #   # #   ## #    #
   *   #       ####  #    # #    # #    #   #     #   # #    #  ####
   *
   *
   */

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


  /* youOrName
   *
   *
   *                        #######        #     #
   *    #   #  ####  #    # #     # #####  ##    #   ##   #    # ######
   *     # #  #    # #    # #     # #    # # #   #  #  #  ##  ## #
   *      #   #    # #    # #     # #    # #  #  # #    # # ## # #####
   *      #   #    # #    # #     # #####  #   # # ###### #    # #
   *      #   #    # #    # #     # #   #  #    ## #    # #    # #
   *      #    ####   ####  ####### #    # #     # #    # #    # ######
   *
   *
   * if the currently logged-in user matches the user the page is about,
   * use "your" and "you" in some places in the whole document,
   * otherwise use "Jo's" or "Jo" if the fname of the user the page is about is "Jo".
   *
   * The places to change are elements with the following classes (case is significant):
   * fnOrYour, fnOryou
   */
  _.setYouOrName = function setYouOrName() {
    lima.onSignInChange(setYouOrName);

    if (!lima.userPageIsAbout) {
      if (lima.whenUserPageIsAboutIsKnown) {
        lima.whenUserPageIsAboutIsKnown(setYouOrName);
        return;
      } else {
        console.error('setYouOrName can\'t be called on a page that\'s not about a user');
        return;
      }
    }

    var currentUser = lima.getAuthenticatedUserEmail();

    var y = (currentUser == lima.userPageIsAbout.email);
    var n = lima.userPageIsAbout.name.givenName || 'User';

    lima.pageAboutYou = y;

    document.body.classList[y ? 'add' : 'remove']('page-about-you');

    _.fillEls('.fnOrYour', y ? 'Your' : n + "'s");
    _.fillEls('.fnOryou',  y ? 'you'  : n       );

    // Used on profile page, prefixes 'Your ' if you're signed in and the page
    // is about you. The space is needed for formatting.
    _.fillEls('.blankOrYour', y ? 'Your ' : '' );

    _.findEls('.needs-owner').forEach(function (el) {
      if (el.dataset.owner === currentUser) el.classList.add('yours');
      else                                  el.classList.remove('yours');
    });
  }


  /* fetch
   *
   *
   *    ###### ###### #####  ####  #    #
   *    #      #        #   #    # #    #
   *    #####  #####    #   #      ######
   *    #      #        #   #      #    #
   *    #      #        #   #    # #    #
   *    #      ######   #    ####  #    #
   *
   *
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

  _.idTokenToFetchHeaders = function idTokenToFetchHeaders(idToken, extraHeaders) {
    var retval = {};
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(function (key) { retval[key] = extraHeaders[key]; });
    }
    if (idToken) retval.Authorization = "Bearer " + idToken;
    return retval;
  }

  // for testing purposes - simulating a delay before a promise is resolved
  _.delayPromise = function delayPromise(x) {
    return new Promise(function (resolve) {
      setTimeout(resolve, 1000, x);
    })
  }


  /* save
   *
   *
   *     ####    ##   #    # ######
   *    #       #  #  #    # #
   *     ####  #    # #    # #####
   *         # ###### #    # #
   *    #    # #    #  #  #  #
   *     ####  #    #   ##   ######
   *
   *
   */

  var pendingSaveTimeout = null;
  var pendingSaveFunctions = [];
  var currentSavingFunction = null;

  var SAVE_PENDING_TIMEOUT = 3000;

  _.scheduleSave = function scheduleSave(saveFunction) {
    if (typeof saveFunction !== 'function' && typeof saveFunction.save !== 'function') throw new Error('saveFunction not a function or an object with save()');

    if (lima.checkToPreventSaving && lima.checkToPreventSaving()) return;

    if (!pendingSaveTimeout && lima.savePendingStarted) lima.savePendingStarted();

    if (pendingSaveFunctions.indexOf(saveFunction) === -1) pendingSaveFunctions.push(saveFunction);

    _.deferScheduledSave();
    if (!pendingSaveTimeout) pendingSaveTimeout = setTimeout(doSave, SAVE_PENDING_TIMEOUT);
  }

  // setTimeout for save in 3s
  // if already set, cancel the old one and set a new one
  // but only replace the old one if the pending save started less than 10s ago
  _.deferScheduledSave = function deferScheduledSave() {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = setTimeout(doSave, SAVE_PENDING_TIMEOUT);
    }
  }

  _.cancelScheduledSave = function cancelScheduledSave(saveFunction) {
    var removeIndex = pendingSaveFunctions.indexOf(saveFunction);
    if (removeIndex !== -1) pendingSaveFunctions.splice(removeIndex, 1);

    if (pendingSaveFunctions.length !== 0) return;

    if (pendingSaveTimeout && lima.savePendingStopped) lima.savePendingStopped();

    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;
  }

  _.manualSave = doSave;

  _.isSaving = function isSaving() {
    return !!currentSavingFunction;
  };

  function doSave() {
    if (currentSavingFunction) return;

    if (pendingSaveTimeout && lima.savePendingStopped) lima.savePendingStopped();

    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;

    if (lima.checkToPreventForcedSaving && lima.checkToPreventForcedSaving()) return;

    if (pendingSaveFunctions.length === 0) {
      if (lima.saveStopped) lima.saveStopped();
      return;
    }

    // call the next saved saving function, on its success come to the rest
    currentSavingFunction = pendingSaveFunctions.shift();

    if (lima.saveStarted) lima.saveStarted();

    var savePromise = null;
    // in case we get handed an object with save() instead of a save function
    if (typeof currentSavingFunction === 'function') {
      savePromise = currentSavingFunction();
    } else if (typeof currentSavingFunction.save === 'function') {
      savePromise = currentSavingFunction.save();
    } else {
      console.error('not a function or object with save()');
      console.error(currentSavingFunction);
    }

    Promise.resolve(savePromise)
    .then(
      function success() {
        currentSavingFunction = null;
        doSave();
      },
      function failure() {
        // put the failed save back in the queue
        if (pendingSaveFunctions.indexOf(currentSavingFunction) === -1) pendingSaveFunctions.unshift(currentSavingFunction);
        currentSavingFunction = null;

        if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
        pendingSaveTimeout = null;
        if (lima.saveError) lima.saveError();
      }
    );
  }

})(document, window);
