(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  lima.apiFail = lima.apiFail || function(){};

  function extractPaperTitleFromUrl() {
    // the path of a page for a paper will be '/email/title/*',
    // so extract the 'title' portion here:

    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    return window.location.pathname.substring(start, window.location.pathname.indexOf('/', start));
  }


  /* paper list
   *
   *
   *        #####    ##   #####  ###### #####     #      #  ####  #####
   *        #    #  #  #  #    # #      #    #    #      # #        #
   *        #    # #    # #    # #####  #    #    #      #  ####    #
   *        #####  ###### #####  #      #####     #      #      #   #
   *        #      #    # #      #      #   #     #      # #    #   #
   *        #      #    # #      ###### #    #    ###### #  ####    #
   *
   *
   */
  function requestAndFillPaperList() {
    lima.getGapiIDToken()
    .then(function (idToken) {
      var email = lima.extractUserProfileEmailFromUrl();
      return fetch('/api/papers/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) return [];
      else return _.fetchJson(response);
    })
    .then(fillPapersList)
    .catch(function (err) {
      console.error("problem getting papers");
      console.error(err);
      lima.apiFail();
    });
  }

  function fillPapersList(papers) {
    var list = _.findEl('.paper.list > ul');
    list.innerHTML = '';

    if (papers.length) {
      // todo sort
      papers.forEach(function (paper) {
        var li = _.cloneTemplate('paper-list-item-template');
        _.fillEls(li, '.name', paper.title);
        _.fillEls(li, '.date', paper.published);
        _.fillEls(li, '.description', paper.description);
        _.setProps(li, '.description', 'title', paper.description);
        _.setProps(li, 'a.mainlink', 'href', paper.title);
        _.fillTags(li, '.tags', paper.tags);
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.cloneTemplate('empty-list-template'));
    }

    _.setYouOrName();
  }


  /* paper
   *
   *
   *           #####    ##   #####  ###### #####
   *           #    #  #  #  #    # #      #    #
   *           #    # #    # #    # #####  #    #
   *           #####  ###### #####  #      #####
   *           #      #    # #      #      #   #
   *           #      #    # #      ###### #    #
   *
   *
   */

  var currentPaperUrl, currentPaper;

  function requestAndFillPaper() {
    var email = lima.extractUserProfileEmailFromUrl();
    var title = lima.extractPaperTitleFromUrl();
    _.fillEls('#paper .title', title);

    lima.getColumns() // todo getColumns could run in parallel with everything before fillPaper
    .then(lima.getGapiIDToken)
    .then(function (idToken) {
      currentPaperUrl = '/api/papers/' + email + '/' + title;
      return fetch(currentPaperUrl, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(updatePaperView)
    .catch(function (err) {
      console.error("problem getting paper");
      console.error(err);
      lima.apiFail();
    });
  }

  function updatePaperView(paper) {
    if (!paper) paper = currentPaper;

    var isSmallChange = currentPaper != null && paperChangeVerifiers.every(function (verifier) { return verifier(paper); });
    currentPaper = paper;
    if (!isSmallChange) fillPaper(paper);
    callPaperDOMSetters(paper);

    // todo for testing
    lima.currentPaper = paper;
  }

  var startNewTag = null;
  var flashTag = null;
  var fillingTags = false;

  function fillPaper(paper) {
    resetDOMSetters();

    addPaperDOMSetter(removeValidationErrorClass);

    // cleanup
    var oldPaperEl = _.byId('paper');
    if (oldPaperEl) oldPaperEl.parentElement.removeChild(oldPaperEl);

    var paperTemplate = _.byId('paper-template');
    var paperEl = _.cloneTemplate(paperTemplate);
    paperTemplate.parentElement.insertBefore(paperEl, paperTemplate);

    addPaperChangeVerifier(function (newPaper) { return paper.id === newPaper.id; });
    addPaperDOMSetter(function(paper) {
      _.fillEls('#paper .title', paper.title);
      fillingTags = true; // because that causes onBlur on a new tag and that mustn't be a save
      _.fillTags('#paper .tags', paper.tags, flashTag); flashTag = null;
      fillingTags = false;
      _.fillEls ('#paper .authors .value', paper.authors);
      _.fillEls ('#paper .published .value', paper.published);
      _.fillEls ('#paper .description .value', paper.description);
      _.fillEls ('#paper .link .value', paper.link);
      _.setProps('#paper .link .value', 'href', paper.link);
      _.fillEls ('#paper .doi .value', paper.doi);
      _.setProps('#paper .doi .value', 'href', function(el){return el.dataset.base + paper.doi});
      _.fillEls ('#paper .enteredby .value', paper.enteredBy);
      _.setProps('#paper .enteredby .value', 'href', '/' + paper.enteredBy + '/');
      _.fillEls ('#paper .ctime .value', _.formatDateTime(paper.ctime));
      _.fillEls ('#paper .mtime .value', _.formatDateTime(paper.mtime));

      if (lima.extractUserProfileEmailFromUrl() === paper.enteredBy) {
        _.addClass('#paper .enteredby', 'only-not-yours');
      }

      addOnInput("#paper .authors .value", 'textContent', identity, paper, 'authors');
      addOnInput("#paper .published .value", 'textContent', identity, paper, 'published');
      addOnInput("#paper .description .value", 'textContent', identity, paper, 'description');

      // events for removing a tag
      _.findEls('#paper .tags .tag + .removetag').forEach(function (btn) {
        btn.onclick = function () {
          var el = btn;
          while (el && !el.classList.contains('tag')) el = el.previousElementSibling;
          while (el && !el.classList.contains('tag')) el = el.parentElement;
          if (el) {
            var text = el.textContent;
            var i = paper.tags.indexOf(text);
            if (i !== -1) {
              paper.tags.splice(i, 1);
              updatePaperView();
              schedulePaperSave();
            } else {
              console.error('removing tag but can\'t find it: ' + text);
            }
          }
        }
      })
      // events for starting to add a tag
      _.findEls('#paper .tags .new + .addtag').forEach(function (btn) {
        btn.onclick = function () {
          var el = btn.previousElementSibling;
          el.classList.add('editing');
          _.findEl(el, '.tag').focus();
        }
        if (startNewTag !== null) {
          btn.onclick();
          var el = _.findEl('#paper .tags .new .tag');
          el.textContent = startNewTag;
          if (startNewTag) {
            // put cursor at the end of the text
            var selection = window.getSelection();
            var range = document.createRange();
            range.setStartAfter(el.childNodes[el.childNodes.length-1]);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          startNewTag = null;
        }
      })
      // events for adding a tag
      _.findEls('#paper .tags .new .tag').forEach(function (el) {
        el.onblur = function () {
          if (fillingTags) {
            startNewTag = el.textContent;
            return;
          }
          var text = el.textContent;
          if (!text) {
            if (startNewTag !== null) {
              setTimeout(function() {el.focus()}, 0); // focus() inside the blur event may not work
              el.textContent = startNewTag;
              startNewTag = null;
            } else {
              _.removeClass('#paper .tags .new', 'editing');
            }
          } else {
            var add = paper.tags.indexOf(text) === -1;
            if (add) {
              paper.tags.push(text);
            }
            flashTag = text;
            updatePaperView();
            if (add) {
              schedulePaperSave();
            }
          }
        }
        el.onkeydown = function (ev) {
          // enter
          if (ev.keyCode === 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
            startNewTag = null;
            ev.preventDefault();
            el.blur();
          }
          // escape
          else if (ev.keyCode === 27) {
            startNewTag = null;
            _.removeClass('#paper .tags .new', 'editing');
            el.textContent = '';
          }
          // tab or comma starts a new tag
          else if ((ev.keyCode === 9 || ev.keyCode === 188) && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
            startNewTag = '';
            ev.preventDefault();
            el.blur();
          }
          else deferScheduledPaperSave();
        }
      })

    });

    fillPaperExperimentTable(paper);

    _.removeClass('body', 'loading');
    _.setYouOrName();

    // now that the paper is all there, install general event listeners
    installBlurOnEnter('[contenteditable].oneline');
    function installBlurOnEnter(root, selector) {
      _.findEls(root, selector).forEach(function (el) {
        el.addEventListener('keydown', blurOnEnter);
      });
    }


    _.addEventListener('#paper .savingerror', 'click', savePaper);

    addPaperDOMSetter(function () {
      if (pinnedBox) pinPopupBox(pinnedBox);
    });
  }

  function fillPaperExperimentTable(paper) {
    var experiments = paper.experiments;
    if (!Array.isArray(experiments)) experiments = paper.experiments = [];

    var table = _.cloneTemplate('experiments-table-template');

    // will do a rebuild of the page if number of experiments has changed
    var experimentsLength = experiments.length;
    addPaperChangeVerifier(function (newPaper) {
      return newPaper.experiments && newPaper.experiments.length === experimentsLength;
    });

    // show the table if it's not empty or
    // hide the empty experiment data table if the user can't edit it
    if (experiments.length) {
      table.children[0].classList.remove('editing');
    } else {
      table.children[0].classList.add('editing');
    }

    var showColumns = findColumnsInPaper(paper);
    var newPaperShowColumns = showColumns;
    addPaperChangeVerifier(function (newPaper) {
      return findColumnsInPaper(newPaper).length === showColumns.length;
    });
    addPaperDOMSetter(
      function (newPaper) {
        if (!newPaperShowColumns) newPaperShowColumns = findColumnsInPaper(newPaper);
      },
      function cleanup() {
        newPaperShowColumns = null;
      });

    // fill the row of headings
    var headingsRowNode = _.findEl(table, 'tr:first-child');
    var addColumnNode = _.findEl(table, 'tr:first-child > th.add');
    showColumns.forEach(function (ignored, colIndex) {
      var th = _.cloneTemplate('col-heading-template').children[0];
      _.findEls(th, 'button.move').forEach(function (el) {
        el.addEventListener('click', moveColumn);
      });
      headingsRowNode.insertBefore(th, addColumnNode);
      addPaperDOMSetter(
        function () {
          var col = newPaperShowColumns[colIndex];
          _.fillEls(th, '.coltitle', col.title);
          lima.columnTypes.forEach(function (type) {_.removeClass(th, '.coltype', type);});
          _.addClass(th, '.coltype', col.type);
          _.fillEls(th, '.coldescription', col.description);
          _.fillEls(th, '.colctime .value', _.formatDateTime(col.ctime));
          _.fillEls(th, '.definedby .value', col.definedBy);
          _.setProps(th, '.definedby .value', 'href', '/' + col.definedBy + '/');
          _.removeClass(th, '.definedby', 'only-not-yours');
          if (lima.extractUserProfileEmailFromUrl() === col.definedBy) {
            _.addClass(th, '.definedby', 'only-not-yours');
          }
          _.findEls(th, 'button.move').forEach(function (el) {
            el.dataset.id = col.id;
          });
          lima.columnTypes.forEach(function (type) {th.classList.remove(type);});
          th.classList.add(col.type);

          setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.id);
        });
    });

    // fill rows with experiment data
    var tableBodyNode = _.findEl(table, 'tbody');
    var addRowNode = _.findEl(table, 'tbody > tr.add');
    experiments.forEach(function (experiment, expIndex) {
      var tr = _.cloneTemplate('experiment-row-template').children[0];
      tableBodyNode.insertBefore(tr, addRowNode);

      addPaperDOMSetter(function (paper) {
        _.fillEls(tr, '.exptitle', paper.experiments[expIndex].title);
        _.fillEls(tr, '.expdescription', paper.experiments[expIndex].description);

        setupPopupBoxPinning(tr, '.fullrowinfo.popupbox', paper.experiments[expIndex].title);
      })

      showColumns.forEach(function (col, colIndex) {
        var td = _.cloneTemplate('experiment-datum-template').children[0];
        tr.appendChild(td);

        addPaperDOMSetter(function (paper) {
          var colId = newPaperShowColumns[colIndex].id;
          var value = ' ';
          var comments;
          var experiment = paper.experiments[expIndex];
          if (experiment.data && experiment.data[colId]) {
            value = experiment.data[colId].value;
            comments = experiment.data[colId].comments;
          }
          _.fillEls(td, '.value', value);
          addOnInput(td, ".value", 'textContent', identity, paper, ['experiments', expIndex, 'data', colId, 'value']);

          // populate comments
          if (Array.isArray(comments) && comments.length > 0) {
            td.classList.add('hascomments');
            _.fillEls(td, '.commentcount', comments.length);
            fillComments('comment-template', td, '.comments main', comments);
          } else {
            td.classList.remove('hascomments');
            _.fillEls(td, '.commentcount', 0);
            fillComments('comment-template', td, '.comments main', []);
          }
          lima.columnTypes.forEach(function (type) {td.classList.remove(type);});
          td.classList.add(newPaperShowColumns[colIndex].type);

          setupPopupBoxPinning(td, '.comments.popupbox', paper.experiments[expIndex].title + '$' + colId);
        });
      });

    });

    showColumns.forEach(function (col, colIndex) {
      var td = document.createElement('td');
      addRowNode.appendChild(td);

      addPaperDOMSetter(function () {
        lima.columnTypes.forEach(function (type) {td.classList.remove(type);});
        td.classList.add(newPaperShowColumns[colIndex].type);
      });
    });

    var noTableMarker = _.findEl('#paper .no-table');
    noTableMarker.parentElement.insertBefore(table, noTableMarker);
  }

  function fillComments(templateId, root, selector, comments) {
    var email = lima.extractUserProfileEmailFromUrl();
    var targetEl = _.findEl(root, selector);
    targetEl.innerHTML = '';
    comments.forEach(function (comment, index) {
      var el = _.cloneTemplate(templateId).children[0];
      _.fillEls(el, '.by', comment.by);
      if (email === comment.by) {
        _.addClass(el, '.editing-if-yours', 'yours');
        _.addClass(el, '.notediting-if-yours', 'yours');
      }
      _.fillEls(el, '.commentnumber', index+1);
      _.setProps(el, '.by', 'href', '/' + comment.by + '/');
      _.fillEls(el, '.ctime', _.formatDateTime(comment.ctime));
      _.fillEls(el, '.text', comment.text);
      targetEl.appendChild(el);
    })
  }


  /* save
   *
   *
   *             ####    ##   #    # ######
   *            #       #  #  #    # #
   *             ####  #    # #    # #####
   *                 # ###### #    # #
   *            #    # #    #  #  #  #
   *             ####  #    #   ##   ######
   *
   *
   */

  var pendingSaveTimeout = null;
  var pendingSaveForceTime = null;

  var PAPER_SAVE_PENDING_TIMEOUT = 3000;
  var PAPER_SAVE_MAX_TIMEOUT = 10000;

  function schedulePaperSave() {
    // don't save automatically after an error
    if (_.findEl('#paper.savingerror')) return;
    if (_.findEl('#paper.validationerror')) return;

    _.addClass('#paper', 'savepending');

    deferScheduledPaperSave();
    if (!pendingSaveTimeout) pendingSaveTimeout = setTimeout(savePaper, PAPER_SAVE_PENDING_TIMEOUT);
    if (!pendingSaveForceTime) pendingSaveForceTime = Date.now() + PAPER_SAVE_MAX_TIMEOUT;
  }

  function cancelScheduledPaperSave() {
    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;
    pendingSaveForceTime = null;

  }

  // setTimeout for save in 1s -- todo should be more?
  // if already set, cancel the old one and set a new one
  // but only replace the old one if the pending save started less than 10s ago
  function deferScheduledPaperSave() {
    // todo
    if (pendingSaveTimeout && pendingSaveForceTime > Date.now()) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = setTimeout(savePaper, PAPER_SAVE_PENDING_TIMEOUT);
    }
  }

  var savingPaper = false;
  var scheduleAnotherPaperSave = false;

  function savePaper() {
    // don't save when a validation error is there
    if (_.findEl('#paper.validationerror')) return;

    cancelScheduledPaperSave();
    if (savingPaper) {
      scheduleAnotherPaperSave = true;
      return;
    }

    savingPaper = true;

    lima.getGapiIDToken()
    .then(function(idToken) {
      if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
      pendingSaveForceTime = null;

      _.removeClass('#paper', 'savingerror');
      _.removeClass('#paper', 'savepending');
      _.addClass('#paper', 'saving');

      return fetch(currentPaperUrl, {
        method: 'POST',
        headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
        body: JSON.stringify(currentPaper),
      });
    })
    .then(_.fetchJson)
    .then(function(json) {
      _.removeClass('#paper', 'saving');
      savingPaper = false;
      updatePaperView(json);
      if (scheduleAnotherPaperSave) {
        scheduleAnotherPaperSave = false;
        schedulePaperSave();
      }
    })
    .catch(function(err) {
      console.error('error saving paper');
      console.error(err);
      _.addClass('#paper', 'savingerror');
      _.removeClass('#paper', 'saving');
      savingPaper = false;
      scheduleAnotherPaperSave = false;
      if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
      pendingSaveForceTime = null;
    })

  }



  /* moving cols
   *
   *
   *         #    #  ####  #    # # #    #  ####      ####   ####  #       ####
   *         ##  ## #    # #    # # ##   # #    #    #    # #    # #      #
   *         # ## # #    # #    # # # #  # #         #      #    # #       ####
   *         #    # #    # #    # # #  # # #  ###    #      #    # #           #
   *         #    # #    #  #  #  # #   ## #    #    #    # #    # #      #    #
   *         #    #  ####    ##   # #    #  ####      ####   ####  ######  ####
   *
   *
   */

  function findColumnsInPaper(paper) {
    // find the columns used in the experiments
    var showColumnsHash= {};
    var showCharacteristicColumns = [];
    var showResultColumns = [];
    paper.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        if (!(key in showColumnsHash)) {
          var col = lima.columns[key];
          showColumnsHash[key] = col;
          switch (col.type) {
            case 'characteristic': showCharacteristicColumns.push(col); break;
            case 'result':         showResultColumns.push(col); break;
          }
        }
      });
    });

    showCharacteristicColumns.sort(compareColsByOrder);
    showResultColumns.sort(compareColsByOrder);

    return showCharacteristicColumns.concat(showResultColumns);

    function compareColsByOrder(c1, c2) {
      if (!Array.isArray(paper.columnOrder)) return 0;
      var i1 = paper.columnOrder.indexOf(c1.id);
      var i2 = paper.columnOrder.indexOf(c2.id);
      if (i1 === i2) return 0;
      if (i1 === -1) return 1;
      if (i2 === -1) return -1;
      return i1 - i2;
    }
  }

  function moveColumn() {
    // a click will pin the box,
    // this timout makes sure the click gets processed first and then we do the moving
    setTimeout(doMoveColumn, 0, this);
  }

  function doMoveColumn(el) {
    var left = el.classList.contains('left');
    var most = el.classList.contains('most');
    var colId = el.dataset.id;
    if (!colId) return; // we don't know what to move

    regenerateColumnOrder(currentPaper);
    var i = currentPaper.columnOrder.indexOf(colId);
    if (i === -1) return console.error('column ' + colId + ' not found in newly regenerated order!');
    _.moveInArray(currentPaper.columnOrder, i, left, most);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();
    schedulePaperSave();
  }

  function regenerateColumnOrder(paper) {
    if (!Array.isArray(paper.columnOrder)) paper.columnOrder = [];

    var columns = findColumnsInPaper(paper);
    columns.forEach(function (col) {
      if (paper.columnOrder.indexOf(col.id) === -1) {
        paper.columnOrder.push(col.id);
      }
    })

    moveResultsAfterCharacteristics(paper);
  }

  function moveResultsAfterCharacteristics(paper) {
    // make sure result columns come after characteristics columns
    var firstResult = 0;
    for (var i = 0; i < paper.columnOrder.length; i++) {
      if (lima.columns[paper.columnOrder[i]].type === 'characteristic') {
        _.moveArrayElement(paper.columnOrder, i, firstResult);
        firstResult++;
      }
    }

  }

  /* DOM updates
   *
   *
   *         ######  ####### #     #
   *         #     # #     # ##   ##    #    # #####  #####    ##   ##### ######  ####
   *         #     # #     # # # # #    #    # #    # #    #  #  #    #   #      #
   *         #     # #     # #  #  #    #    # #    # #    # #    #   #   #####   ####
   *         #     # #     # #     #    #    # #####  #    # ######   #   #           #
   *         #     # #     # #     #    #    # #      #    # #    #   #   #      #    #
   *         ######  ####### #     #     ####  #      #####  #    #   #   ######  ####
   *
   *
   */
  var paperDOMSetters;
  var paperDOMCleanups;
  var paperChangeVerifiers;

  resetDOMSetters();

  function resetDOMSetters() {
    paperDOMSetters = [];
    paperDOMCleanups = [];
    paperChangeVerifiers = [];
  }

  function addPaperDOMSetter (f, cleanup) {
    if (f && paperDOMSetters.indexOf(f) === -1) paperDOMSetters.push(f);
    if (cleanup && paperDOMCleanups.indexOf(cleanup) === -1) paperDOMCleanups.push(cleanup);
  }

  function addPaperChangeVerifier (f) {
    if (paperChangeVerifiers.indexOf(f) === -1) paperChangeVerifiers.push(f);
  }

  function callPaperDOMSetters(paper) {
    paperDOMSetters.forEach(function (setter) { setter(paper); });
    paperDOMCleanups.forEach(function (cleanup) { cleanup(paper); });
  }

  var identity = null; // special value to use as validatorSanitizer
  function addOnInput(root, selector, property, validatorSanitizer, target, targetProp) {
    if (!(root instanceof Node)) {
      targetProp = target;
      target = validatorSanitizer;
      validatorSanitizer = property;
      property = selector;
      selector = root;
      root = document;
    }

    _.findEls(root, selector).forEach(function (el) {
      if (el.classList.contains('editing') || el.isContentEditable) {
        el.classList.remove('validationerror');
        el.addEventListener('keydown', deferScheduledPaperSave);
        el.oninput = function () {
          var value = el[property];
          try {
            if (validatorSanitizer) value = validatorSanitizer(value, el, property);
          } catch (err) {
            // this class will be removed by updatePaperView when validation succeeds again
            el.classList.add('validationerror');
            el.dataset.validationmessage = err.message || err;
            _.addClass('#paper', 'validationerror');
            cancelScheduledPaperSave();
            return;
          }
          assign(target, targetProp, value);
          updatePaperView();
          schedulePaperSave();
        };
      } else {
        el.oninput = null;
      }
    });
  }

  function assign(target, targetProp, value) {
    if (Array.isArray(targetProp)) {
      while (targetProp.length > 1) {
        var prop = targetProp.shift();
        if (!(prop in target)) {
          if (Number.isInteger(targetProp[0])) target[prop] = [];
          else target[prop] = {};
        }
        target = target[prop];
      }
      targetProp = targetProp[0];
    }

    target[targetProp] = value;
    return value;
  }


  function removeValidationErrorClass() {
    _.removeClass('#paper', 'validationerror');
  }


  /* popup boxes
   *
   *
   *            #####   ####  #####  #    # #####     #####   ####  #    # ######  ####
   *            #    # #    # #    # #    # #    #    #    # #    #  #  #  #      #
   *            #    # #    # #    # #    # #    #    #####  #    #   ##   #####   ####
   *            #####  #    # #####  #    # #####     #    # #    #   ##   #           #
   *            #      #    # #      #    # #         #    # #    #  #  #  #      #    #
   *            #       ####  #       ####  #         #####   ####  #    # ######  ####
   *
   *
   */
  // box can be one of these types of values:
  // - the popup box element itself
  // - or an element inside the box
  // - or an element outside the box (then we use the first box we find inside)
  // - or an event whose target is such an element
  // - or a box ID by which we can find the element
  function findPopupBox(box) {
    if (box instanceof Event) box = box.target;
    if (box instanceof Node) {
      // find the popupbox, first inside el, then outside it
      if (!box.classList.contains('popupbox')) {
        box = _.findEl(box, '.popupbox') || box;
        while (box && !box.classList.contains('popupbox')) box = box.nextElementSibling || box.parentElement;
      }
    } else {
      box = _.findEl('.popupbox[data-boxid="' + box + '"]')
    }
    if (!box) console.warn('cannot find element for popup box');
    return box;
  }

  var pinnedBox = null;
  function pinPopupBox(el) {
    unpinPopupBox();

    var box = findPopupBox(el);

    if (box) {
      pinnedBox = box.dataset.boxid;
      document.body.classList.add('boxpinned');
      box.classList.add('pinned');

      // find nearest parent-or-self that is '.popupboxtrigger' so it can be raised above others when pinned
      var trigger = box;
      while (trigger && !trigger.classList.contains('popupboxtrigger')) trigger = trigger.parentElement;
      if (trigger) trigger.classList.add('pinned');
    }
  }

  function unpinPopupBox() {
    if (pinnedBox) {
      var pinned = _.findEl('[data-boxid="' + pinnedBox + '"]')
      pinned.classList.remove('pinned');

      var trigger = pinned;
      while (trigger && !trigger.classList.contains('popupboxtrigger')) trigger = trigger.parentElement;
      if (trigger) trigger.classList.remove('pinned');
    }
    pinnedBox = null;
    document.body.classList.remove('boxpinned');
  }

  function setupPopupBoxPinning(el, selector, localid) {
    _.findEls(el, selector).forEach(function (box) {
      if (box.dataset.boxtype) box.dataset.boxid = box.dataset.boxtype + "@" + localid;
      box.classList.remove('pinned');
    })
  }


  /* event listeners
   *
   *
   *       ###### #    # ###### #    # #####    #      #  ####  ##### ###### #    # ###### #####   ####
   *       #      #    # #      ##   #   #      #      # #        #   #      ##   # #      #    # #
   *       #####  #    # #####  # #  #   #      #      #  ####    #   #####  # #  # #####  #    #  ####
   *       #      #    # #      #  # #   #      #      #      #   #   #      #  # # #      #####       #
   *       #       #  #  #      #   ##   #      #      # #    #   #   #      #   ## #      #   #  #    #
   *       ######   ##   ###### #    #   #      ###### #  ####    #   ###### #    # ###### #    #  ####
   *
   *
   */
  document.addEventListener('keydown', dismissOrBlurOnEscape);
  document.addEventListener('click', popupOnClick);

  // dismiss pinned popup boxes with Escape or with a click outside them
  function dismissOrBlurOnEscape(ev) {
    if (ev.keyCode === 27) {
      if (ev.target === document.activeElement && document.activeElement !== document.body) {
        ev.target.blur();
      } else if (pinnedBox) {
        unpinPopupBox();
      }
    }
  }

  function popupOnClick(ev) {
    var el = ev.target;
    // check if we've clicked on the 'pin' button or otherwise in a popupboxtrigger
    while (el && !el.classList.contains('pin') && !el.classList.contains('popupboxtrigger')) el = el.parentElement;
    if (!el || el.classList.contains('pin') && pinnedBox) {
      unpinPopupBox();
    }
    else pinPopupBox(el);
  }

  // oneline input fields get blurred on enter (for Excel-like editing)
  function blurOnEnter(ev) {
    if (ev.keyCode == 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      ev.target.blur();
    }
  }

  /* api
   *
   *
   *                ##   #####  #
   *               #  #  #    # #
   *              #    # #    # #
   *              ###### #####  #
   *              #    # #      #
   *              #    # #      #
   *
   *
   */

  // api to other scripts
  lima.extractPaperTitleFromUrl = extractPaperTitleFromUrl;
  lima.requestAndFillPaperList = requestAndFillPaperList;
  lima.requestAndFillPaper = requestAndFillPaper;

  // for testing
  lima.pinPopupBox = pinPopupBox;
  lima.unpinPopupBox = unpinPopupBox;
  lima.updatePaperView = updatePaperView;
  lima.savePaper = savePaper;
  window._ = _;

})(window, document);
