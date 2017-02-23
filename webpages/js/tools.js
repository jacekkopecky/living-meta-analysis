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

  // todo maybe if the template only has one child, return that instead of the DocumentFragment
  // this way we'd avoid all the _.cloneTemplate().children[0]
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
      if (el.textContent != newVal) el.textContent = newVal == null ? '' : newVal;
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

  _.putCursorAtEnd = function putCursorAtEnd(el) {
    if (el && el.childNodes.length) {
      var selection = window.getSelection();
      var range = document.createRange();
      range.setStartAfter(el.childNodes[el.childNodes.length-1]);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // a workaround for strange chrome behaviour where it doesn't focus right:
  // e.g. clicking on the placeholder 'doi' of an empty editable doi value focuses the element but doesn't react to subsequent key strokes
  _.blurAndFocus = function(ev) {
    ev.target.blur();
    ev.target.focus();
  }

  // oneline input fields get blurred on enter (for Excel-like editing)
  _.blurOnEnter = function(ev) {
    if (ev.keyCode == 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      ev.target.blur();
    }
  }


  _.linkEditTest = function(ev) {
    var btn = ev.target;
    if (!btn) return;

    var linkEl = null;
    var editEl = null;
    _.array(btn.parentElement.children).forEach(function (el) {
      if (el.classList.contains('value')) {
        if (el.nodeName === 'A') linkEl = el;
        else if (el.isContentEditable || el.contentEditable === 'true') editEl = el;
      }
    })

    if (!linkEl || !editEl) {
      console.error('linkEditTest cannot find linkEl or editEl');
      return;
    }

    var link = editEl.textContent;
    if (linkEl.dataset.base) link = linkEl.dataset.base + link;

    window.open(link, "linkedittest");
  }

  _.preventLinkEditBlur = function(ev) {
    var btn = ev.target;
    if (!btn) return;

    var editEl = null;
    _.array(btn.parentElement.children).forEach(function (el) {
      if (el.classList.contains('value') && (el.isContentEditable || el.contentEditable === 'true')) editEl = el;
    })

    if (!editEl) {
      console.error('preventLinkEditBlur cannot find editEl');
      return;
    }

    // clicking the 'test' button should not cause blur on the editing field
    if (document.activeElement === editEl) ev.preventDefault();
  }




  /* array manipulation
   *
   *
   *     ##   #####  #####    ##   #   #    #    #   ##   #    # # #####  #    # #        ##   ##### #  ####  #    #
   *    #  #  #    # #    #  #  #   # #     ##  ##  #  #  ##   # # #    # #    # #       #  #    #   # #    # ##   #
   *   #    # #    # #    # #    #   #      # ## # #    # # #  # # #    # #    # #      #    #   #   # #    # # #  #
   *   ###### #####  #####  ######   #      #    # ###### #  # # # #####  #    # #      ######   #   # #    # #  # #
   *   #    # #   #  #   #  #    #   #      #    # #    # #   ## # #      #    # #      #    #   #   # #    # #   ##
   *   #    # #    # #    # #    #   #      #    # #    # #    # # #       ####  ###### #    #   #   #  ####  #    #
   *
   *
   */

  _.moveArrayElement = function moveArrayElement(arr, oldIndex, newIndex) {
    if (oldIndex === newIndex || !Array.isArray(arr)) return arr;
    var content = arr[oldIndex];
    arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, content);
    return arr;
  }

  // remove an element from the array in-place, by value
  _.removeFromArray = function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  // find out if a bigger array contains all the elements of a smaller array
  // we don't expect any duplicate entries here
  _.isSubset = function isSubset(superset, subset) {
    if (!subset || subset.length === 0) return true;
    if (!superset || superset.length === 0) return false;
    if (superset.length < subset.length) return false;

    for (var i = 0; i < subset.length; i++) {
      if (superset.indexOf(subset[i]) == -1) return false;
    }
    return true;
  }

  /* input validation
   *
   *
   *   # #    # #####  #    # #####    #    #   ##   #      # #####    ##   ##### #  ####  #    #
   *   # ##   # #    # #    #   #      #    #  #  #  #      # #    #  #  #    #   # #    # ##   #
   *   # # #  # #    # #    #   #      #    # #    # #      # #    # #    #   #   # #    # # #  #
   *   # #  # # #####  #    #   #      #    # ###### #      # #    # ######   #   # #    # #  # #
   *   # #   ## #      #    #   #       #  #  #    # #      # #    # #    #   #   # #    # #   ##
   *   # #    # #       ####    #        ##   #    # ###### # #####  #    #   #   #  ####  #    #
   *
   *
   */

  _.strictToNumber = function strictToNumber(val) {
    if (typeof val == 'number') return val;
    if (typeof val == 'string') {
      if (val == '') return NaN;
      else return Number(val);
    }
    return NaN;
  }

  _.strictToNumberOrNull = function strictToNumberOrNull(val) {
    if (val == null) return val;
    if (typeof val == 'number') return val;
    if (typeof val == 'string') {
      if (val == '') return null;
      else return Number(val);
    }
    return NaN;
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
    fetch('/404', { credentials: 'same-origin' })
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
    fetch('/apifail', { credentials: 'same-origin' })
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

  /* testing
   *
   *
   *   ##### ######  ####  ##### # #    #  ####
   *     #   #      #        #   # ##   # #    #
   *     #   #####   ####    #   # # #  # #
   *     #   #           #   #   # #  # # #  ###
   *     #   #      #    #   #   # #   ## #    #
   *     #   ######  ####    #   # #    #  ####
   *
   *
   */

  var tests = [];

  _.runTests = function runTests() {
    var successfulAssertions;
    var currentAssertion;
    var failedTests = 0;

    function assert(cond, msg) {
      currentAssertion += 1;
      if (!cond) throw new Error(msg);
      successfulAssertions += 1;
    }

    console.log('running ' + tests.length + ' tests');
    tests.forEach(function (test, index) {
      successfulAssertions = 0;
      currentAssertion = -1;
      console.log('running test ' + (test.name || index));
      try {
        test(assert);
      } catch (e) {
        console.log('  assertion #' + currentAssertion + ' error: ', e);
        failedTests += 1;
      }
      console.log('  done test ' + (test.name || index) + ' (' + successfulAssertions + ' assertion(s) passed)');
    });
    console.log('finished ' + tests.length + ' tests: ' + (tests.length - failedTests) + ' passed, ' + failedTests + ' failed');
  };

  _.addTest = function addTest(f) { tests.push(f); }


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

  _.stripPrefix = function stripPrefix(prefix, string) {
    if (string.toLowerCase().startsWith(prefix)) {
      string = string.substring(prefix.length);
    }
    return string;
  }

  _.stripDOIPrefix = function (doi) { return _.stripPrefix('doi:', doi); }


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


  /* the API to the generic saving functionality includes the following page-specific functions:
   *
   * checks that can prevent actually saving
   *   lima.checkToPreventSaving
   *   lima.checkToPreventForcedSaving
   *
   * events during saving
   *   lima.savePendingStarted
   *   lima.savePendingStopped
   *   lima.saveStarted
   *   lima.saveStopped
   *   lima.saveError
   */

  var pendingSaveTimeout = null;
  var pendingSaveFunctions = [];
  var currentSavingFunction = null;

  var SAVE_PENDING_TIMEOUT = 10000;

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

  _.isSaving = function isSaving(includePending) {
    if (includePending && pendingSaveFunctions.length !== 0) return true;
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

  /* page leave
   *
   *
   *   #####    ##    ####  ######    #      ######   ##   #    # ######
   *   #    #  #  #  #    # #         #      #       #  #  #    # #
   *   #    # #    # #      #####     #      #####  #    # #    # #####
   *   #####  ###### #  ### #         #      #      ###### #    # #
   *   #      #    # #    # #         #      #      #    #  #  #  #
   *   #      #    #  ####  ######    ###### ###### #    #   ##   ######
   *
   *
   */

  /* the API to the generic page-leave-warning functionality includes the following page-specific functions:
   *
   * check to see if the page should warn about leaving
   *   lima.checkToPreventLeaving
   *
   * with thanks to stack overflow http://stackoverflow.com/a/7317311/6482703
   */

  window.addEventListener("beforeunload", function (e) {
    if (_.isSaving(true) || lima.checkToPreventLeaving && lima.checkToPreventLeaving()) {
      var confirmationMessage = 'The page contains unsaved changes. '
                              + 'If you leave before saving, your changes will be lost.';

      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    }
  });

})(document, window);
