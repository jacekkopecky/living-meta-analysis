(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  function extractPaperTitleFromUrl() {
    // the path of a page for a paper will be '/email/title/*',
    // so extract the 'title' portion here:

    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    return window.location.pathname.substring(start, window.location.pathname.indexOf('/', start));
  }

  function updatePageURL() {
    // the path of a page for a paper will be '/email/title/*',
    // so update the 'title' portion here from the current paper (in case the user changes the title)
    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    var rest = window.location.pathname.indexOf('/', start);

    var url = window.location.pathname.substring(0, start) + currentPaper.title;
    if (rest > -1) url += window.location.pathname.substring(rest);

    window.history.replaceState({}, currentPaper.title, url);

    if (currentPaper.apiurl) currentPaperUrl = currentPaper.apiurl;
  }

  function createPageURL(email, title) {
    return '/' + email + '/' + title;
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
      throw _.apiFail();
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
        _.fillEls(li, '.reference', paper.reference);
        _.setProps(li, '.reference', 'title', paper.reference);
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

    lima.getColumns() // todo getColumns could run in parallel with everything before updatePaperView
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
    .then(function() {
      _.removeClass('body', 'loading');
      lima.onSignInChange(updatePaperView);
    })
    .catch(function (err) {
      console.error("problem getting paper");
      console.error(err);
      throw _.apiFail();
    })
    .then(loadPaperTitles); // ignoring any errors here
  }

  function Paper() {}
  Paper.prototype.save = savePaper;

  function updateAfterColumnSave() {
    // clean experiment data of new columns that got new ID when they were saved
    currentPaper.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        var col = lima.columns[key];
        if (col && col.id !== key) {
          experiment.data[col.id] = experiment.data[key];
          delete experiment.data[key];
        }
      });
    });

    // clean columnOrder the same way
    if (Array.isArray(currentPaper.columnOrder)) currentPaper.columnOrder.forEach(function (key, index) {
      var col = lima.columns[key];
      if (col && col.id !== key) {
        currentPaper.columnOrder[index] = col.id;
      }
    });

    updatePaperView();
  }

  function updatePaperView(paper) {
    if (!paper) paper = currentPaper;

    if (!(paper instanceof Paper)) {
      paper = Object.assign(new Paper(), paper);

      // if paper doesn't have experiments or column order, add empty arrays for ease of handling
      if (!Array.isArray(paper.experiments)) paper.experiments = [];
      if (!Array.isArray(paper.columnOrder)) paper.columnOrder = [];

      // if some column type has changed, make sure the paper reflects that
      moveResultsAfterCharacteristics(paper);
    }

    currentPaper = paper;

    fillPaper(paper);

    // for a new paper, go to editing the title
    if (!paper.id) focusFirstValidationError();
  }

  // todo this would be useful for testing
  // function assertAllColumnsAreInColumnOrder(paper) {
  //   if (!paper.experiments) return;
  //
  //   // now gather columns in the paper, then sort the columns by type and order
  //   paper.experiments.forEach(function (experiment) {
  //     if (experiment.data) Object.keys(experiment.data).forEach(checkColumn);
  //   });
  //
  //   function checkColumn(key) {
  //     if (paper.columnOrder.indexOf(key) === -1) throw new Error('column ' + key + ' is in the data but not in columnOrder!');
  //   }
  // }
  // also should check that in columnOrder all characteristics precede all results

  var startNewTag = null;
  var flashTag = null;
  var rebuildingDOM = false;

  function fillPaper(paper) {
    // cleanup
    var oldPaperEl = _.byId('paper');
    rebuildingDOM = true;
    if (oldPaperEl) oldPaperEl.parentElement.removeChild(oldPaperEl);
    rebuildingDOM = false;

    if (!paper.id) {
      _.addClass('body', 'new');
      lima.toggleEditing(true);
    } else {
      _.removeClass('body', 'new');
    }

    var paperTemplate = _.byId('paper-template');
    var paperEl = _.cloneTemplate(paperTemplate).children[0];
    paperTemplate.parentElement.insertBefore(paperEl, paperTemplate);

    fillTags(paperEl, paper);
    fillPaperExperimentTable(paper);

    var ownURL = createPageURL(lima.getAuthenticatedUserEmail(), paper.title);
    _.setProps(paperEl, '.edityourcopy a', 'href', ownURL);

    _.fillEls(paperEl, '.title', paper.title);
    _.fillEls (paperEl, '.authors .value', paper.authors);
    _.fillEls (paperEl, '.reference .value', paper.reference);
    _.fillEls (paperEl, '.description .value', paper.description);
    _.fillEls (paperEl, '.link .value', paper.link);
    _.setProps(paperEl, '.link a.value', 'href', paper.link);
    _.fillEls (paperEl, '.doi .value', paper.doi);
    _.setProps(paperEl, '.doi a.value', 'href', function(el){return el.dataset.base + paper.doi});
    _.fillEls (paperEl, '.enteredby .value', paper.enteredBy);
    _.setProps(paperEl, '.enteredby .value', 'href', '/' + paper.enteredBy + '/');
    _.fillEls (paperEl, '.ctime .value', _.formatDateTime(paper.ctime));
    _.fillEls (paperEl, '.mtime .value', _.formatDateTime(paper.mtime));

    _.setDataProps(paperEl, '.enteredby.needs-owner', 'owner', paper.enteredBy);

    addConfirmedUpdater('#paper .link span.editing', '#paper .link button.confirm', '#paper .link button.cancel', 'textContent', identity, paper, 'link');
    addConfirmedUpdater('#paper .doi span.editing', '#paper .doi button.confirm', '#paper .doi button.cancel', 'textContent', identity, paper, 'doi');

    // workaround for chrome not focusing right
    // clicking on the placeholder 'doi' of an empty editable doi value focuses the element but doesn't react to subsequent key strokes
    _.addEventListener(paperEl, '.link .value.editing', 'click', blurAndFocus);
    _.addEventListener(paperEl, '.doi .value.editing', 'click', blurAndFocus);

    addOnInputUpdater(paperEl, ".authors .value", 'textContent', identity, paper, 'authors');
    addOnInputUpdater(paperEl, ".reference .value", 'textContent', identity, paper, 'reference');
    addOnInputUpdater(paperEl, ".description .value", 'textContent', identity, paper, 'description');

    currentPaperOrigTitle = paper.title;
    addConfirmedUpdater('#paper .title.editing', '#paper .title + .titlerename', '#paper .title ~ * .titlerenamecancel', 'textContent', checkPaperTitleUnique, paper, 'title');

    if (!paper.tags) paper.tags = [];

    _.setYouOrName();

    // now that the paper is all there, install various general and specific event listeners
    _.addEventListener(paperEl, '[contenteditable].oneline', 'keydown', blurOnEnter);

    _.addEventListener(paperEl, '.linkedit button.test', 'click', linkEditTest);
    _.addEventListener(paperEl, '.linkedit button.test', 'mousedown', preventLinkEditBlur);

    _.addEventListener(paperEl, '[data-focuses]', 'click', focusAnotherElementOnClick);

    _.addEventListener(paperEl, '.savingerror', 'click', _.manualSave);
    _.addEventListener(paperEl, '.validationerrormessage', 'click', focusFirstValidationError);
    _.addEventListener(paperEl, '.unsavedmessage', 'click', focusFirstUnsaved);

    if (pinnedBox) pinPopupBox(pinnedBox);

    setValidationErrorClass();
    setUnsavedClass();
  }

  /* editTags
   *
   *                         #######
   *   ###### #####  # #####    #      ##    ####   ####
   *   #      #    # #   #      #     #  #  #    # #
   *   #####  #    # #   #      #    #    # #       ####
   *   #      #    # #   #      #    ###### #  ###      #
   *   #      #    # #   #      #    #    # #    # #    #
   *   ###### #####  #   #      #    #    #  ####   ####
   *
   *
   */
  function fillTags(paperEl, paper) {
    _.fillTags(paperEl, '.tags', paper.tags, flashTag); flashTag = null;

    // events for removing a tag
    _.findEls(paperEl, '.tags .tag + .removetag').forEach(function (btn) {
      btn.onclick = function () {
        // the .tag can be a previous sibling or an ancestor of the button, find it:
        var el = _.findPrecedingEl(btn, '.tag');
        if (el) {
          var text = el.textContent;
          var i = paper.tags.indexOf(text);
          if (i !== -1) {
            paper.tags.splice(i, 1);
            fillTags(paperEl, paper);
            _.scheduleSave(paper);
          } else {
            console.error('removing tag but can\'t find it: ' + text);
          }
        }
      }
    })
    // events for starting to add a tag
    var btn = _.findEl(paperEl, '.tags .new + .addtag');
    var newTagContainer = _.findEl(paperEl, '.tags .new');
    var newTag = _.findEl(paperEl, '.tags .new .tag');

    btn.onclick = function () {
      newTagContainer.classList.add('editing');
      newTag.focus();
    }
    if (startNewTag != null) {
      btn.onclick();
      newTag.textContent = startNewTag;

      if (startNewTag != '') {
        // put cursor at the end of the text
        // todo we could remember the old selection and replicate it
        var selection = window.getSelection();
        var range = document.createRange();
        range.setStartAfter(newTag.childNodes[newTag.childNodes.length-1]);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      startNewTag = null;
    }

    // events for adding a tag
    newTag.onblur = function () {
      if (rebuildingDOM) {
        // the blur has happened because a DOM rebuild (e.g. after save) is destroying the element we were editing
        startNewTag = newTag.textContent;
      } else {
        var text = newTag.textContent.trim();
        if (!text) {
          newTagContainer.classList.remove('editing');
        } else {
          if (paper.tags.indexOf(text) === -1) {
            paper.tags.push(text);
            _.scheduleSave(paper);
          }
          flashTag = text;
          fillTags(paperEl, paper);
        }
      }
    }
    newTag.onkeydown = function (ev) {
      _.deferScheduledSave();
      // enter
      if (ev.keyCode === 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        startNewTag = null;
        ev.preventDefault();
        newTag.blur();
      }
      // escape
      else if (ev.keyCode === 27) {
        startNewTag = null;
        newTagContainer.classList.remove('editing');
        newTag.textContent = '';
      }
      // tab or comma starts a new tag
      else if ((ev.keyCode === 9 || ev.keyCode === 188) && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        if (newTag.textContent.trim()) {
          startNewTag = '';
          newTag.blur();
        }
      }
    }
  }

  /* fill Exp table
   *
   *                             #######
   *   ###### # #      #         #       #    # #####     #####   ##   #####  #      ######
   *   #      # #      #         #        #  #  #    #      #    #  #  #    # #      #
   *   #####  # #      #         #####     ##   #    #      #   #    # #####  #      #####
   *   #      # #      #         #         ##   #####       #   ###### #    # #      #
   *   #      # #      #         #        #  #  #           #   #    # #    # #      #
   *   #      # ###### ######    ####### #    # #           #   #    # #####  ###### ######
   *
   *
   */
  function fillPaperExperimentTable(paper) {
    var experiments = paper.experiments;

    // hide the empty experiment data table if the user can't edit it
    if (!experiments.length) {
      _.addClass('#paper', 'no-data');
    }

    var table = _.cloneTemplate('experiments-table-template');

    /* column headings
     *
     *
     *    ####   ####  #      #    # #    # #    #    #    # ######   ##   #####  # #    #  ####   ####
     *   #    # #    # #      #    # ##  ## ##   #    #    # #       #  #  #    # # ##   # #    # #
     *   #      #    # #      #    # # ## # # #  #    ###### #####  #    # #    # # # #  # #       ####
     *   #      #    # #      #    # #    # #  # #    #    # #      ###### #    # # #  # # #  ###      #
     *   #    # #    # #      #    # #    # #   ##    #    # #      #    # #    # # #   ## #    # #    #
     *    ####   ####  ######  ####  #    # #    #    #    # ###### #    # #####  # #    #  ####   ####
     *
     *
     */


    var headingsRowNode = _.findEl(table, 'tr:first-child');
    var addColumnNode = _.findEl(table, 'tr:first-child > th.add');

    var curtime = Date.now();
    var user = lima.getAuthenticatedUserEmail();

    paper.columnOrder.forEach(function (colId) {
      var col = lima.columns[colId];
      var th = _.cloneTemplate('col-heading-template').children[0];
      headingsRowNode.insertBefore(th, addColumnNode);

      _.fillEls(th, '.coltitle', col.title);
      _.fillEls(th, '.coldescription', col.description);
      _.fillEls(th, '.colctime .value', _.formatDateTime(col.ctime || curtime));
      _.fillEls(th, '.colmtime .value', _.formatDateTime(col.mtime || curtime));
      _.fillEls(th, '.definedby .value', col.definedBy || user);
      _.setProps(th, '.definedby .value', 'href', '/' + (col.definedBy || user) + '/');

      _.setDataProps(th, '.needs-owner', 'owner', col.definedBy || user);

      _.addEventListener(th, 'button.move', 'click', moveColumn);
      _.setDataProps(th, 'button', 'id', col.id);

      th.classList.add(col.type);
      _.addClass(th, '.coltype', col.type);

      if (col.new) {
        th.classList.add('newcol');
        _.addClass(th, '.coltype', 'newcol');
        _.setDataProps(th, '.coltype', 'id', col.id);
        _.addClass(th, '.coltitle.editing', 'new');
        // todo move the confirm/rename difference into html, but that means we have multiple confirm buttons and addConfirmedUpdater might be unhappy
        _.fillEls(th, '.coltitle + .coltitlerename', 'confirm');
      }

      addOnInputUpdater(th, '.coldescription', 'textContent', identity, col, ['description']);

      addConfirmedUpdater(th, '.coltitle.editing', '.coltitle ~ .coltitlerename', '.coltitle ~ * .colrenamecancel', 'textContent', checkColTitle, col, 'title', deleteNewColumn);

      setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.id);

      _.addEventListener(th, '.coltype .switch', 'click', changeColumnType);
      _.addEventListener(th, '.coltypeconfirm button', 'click', changeColumnTypeConfirmOrCancel);
    });

    /* experiment rows
     *
     *
     *   ###### #    # #####  ###### #####  # #    # ###### #    # #####    #####   ####  #    #  ####
     *   #       #  #  #    # #      #    # # ##  ## #      ##   #   #      #    # #    # #    # #
     *   #####    ##   #    # #####  #    # # # ## # #####  # #  #   #      #    # #    # #    #  ####
     *   #        ##   #####  #      #####  # #    # #      #  # #   #      #####  #    # # ## #      #
     *   #       #  #  #      #      #   #  # #    # #      #   ##   #      #   #  #    # ##  ## #    #
     *   ###### #    # #      ###### #    # # #    # ###### #    #   #      #    #  ####  #    #  ####
     *
     *
     */

    // fill rows with experiment data
    var tableBodyNode = _.findEl(table, 'tbody');
    var addRowNode = _.findEl(table, 'tbody > tr.add');

    experiments.forEach(function (experiment, expIndex) {
      var tr = _.cloneTemplate('experiment-row-template').children[0];
      tableBodyNode.insertBefore(tr, addRowNode);

      _.fillEls(tr, '.exptitle', experiment.title);
      _.fillEls(tr, '.expdescription', experiment.description);

      if (!experiment.title) {
        _.addClass(tr, '.exptitle.editing', 'new');
        _.fillEls(tr, '.exptitle + .exptitlerename', 'confirm');
      } else {
        _.fillEls(tr, '.exptitle + .exptitlerename', 'rename');
      }

      addOnInputUpdater(tr, ".expdescription.editing", 'textContent', identity, paper, ['experiments', expIndex, 'description']);

      _.setDataProps(tr, '.exptitle.editing', 'origTitle', experiment.title);
      addConfirmedUpdater(tr, '.exptitle.editing', '.exptitle + .exptitlerename', null, 'textContent', checkExperimentTitleUnique, paper, ['experiments', expIndex, 'title'], deleteNewExperiment);

      setupPopupBoxPinning(tr, '.fullrowinfo.popupbox', expIndex);

      paper.columnOrder.forEach(function (colId) {
        var col = lima.columns[colId];
        var td = _.cloneTemplate('experiment-datum-template').children[0];
        tr.appendChild(td);

        var val = null;
        if (experiment.data && experiment.data[colId]) {
          val = experiment.data[colId];
        }

        if (!val || val.value == null) {
          td.classList.add('empty');
        } else {
          _.fillEls(td, '.value', val.value);
        }

        addOnInputUpdater(td, '.value', 'textContent', identity, paper, ['experiments', expIndex, 'data', colId, 'value']);

        var user = lima.getAuthenticatedUserEmail();
        _.fillEls (td, '.valenteredby', val && val.enteredBy || user);
        _.setProps(td, '.valenteredby', 'href', '/' + (val && val.enteredBy || user) + '/');
        _.fillEls (td, '.valctime', _.formatDateTime(val && val.ctime || Date.now()));

        td.classList.add(col.type);

        if (col.new) {
          td.classList.add('newcol');
        }

        setupPopupBoxPinning(td, '.datum.popupbox', expIndex + '$' + colId);


        // populate comments
        fillComments('comment-template', td, '.commentcount', '.datum.popupbox main', paper, ['experiments', expIndex, 'data', colId, 'comments']);
      });
    });

    _.addEventListener(table, 'tr.add button.add', 'click', addExperimentRow);

    _.addEventListener(table, 'th.add button.add', 'click', addExperimentColumn);
    _.addEventListener(table, 'th.add button.cancel', 'click', dismissAddExperimentColumn);
    _.addEventListener(table, 'th.add button.addnew', 'click', addNewExperimentColumn);

    var experimentsContainer = _.findEl('#paper .experiments');
    experimentsContainer.appendChild(table);
  }

  /* adding cols
   *
   *
   *     ##   #####  #####  # #    #  ####      ####   ####  #       ####
   *    #  #  #    # #    # # ##   # #    #    #    # #    # #      #
   *   #    # #    # #    # # # #  # #         #      #    # #       ####
   *   ###### #    # #    # # #  # # #  ###    #      #    # #           #
   *   #    # #    # #    # # #   ## #    #    #    # #    # #      #    #
   *   #    # #####  #####  # #    #  ####      ####   ####  ######  ####
   *
   *
   */

  function addExperimentColumn() {
    // if there are no pending changes and if the paper has any data, add a new column to the paper
    if (lima.checkToPreventForcedSaving()) {
      console.warn('cannot add a column with some edited values pending');
      return;
    }

    if (!Array.isArray(currentPaper.experiments) || currentPaper.experiments.length < 1) {
      console.warn('cannot add a column when the paper has no data');
      return;
    }

    // show the add column box
    _.addClass('#paper table.experiments tr:first-child th.add', 'adding');
    _.addClass('body', 'addnewcolumn');

    lima.getColumns()
    .then(populateAddColumnsList);
  }

  function dismissAddExperimentColumn() {
    _.removeClass('#paper table.experiments tr:first-child th.add', 'adding');
    _.removeClass('body', 'addnewcolumn');
  }

  function populateAddColumnsList(columns) {
    var list = _.findEl('#paper table.experiments tr:first-child th.add .addcolumnbox > ul');
    list.innerHTML='';
    var user = lima.getAuthenticatedUserEmail();
    var ordered = {yours: { result: [], characteristic: []},
                   other: { result: [], characteristic: []},
                   already: { result: [], characteristic: []}};
    Object.keys(columns).forEach(function(colId) {
      var col = columns[colId];
      var bucket = (col.definedBy === user || !col.definedBy) ? 'yours' : 'other';
      if (currentPaper.columnOrder.indexOf(colId) > -1) bucket = 'already';
      ordered[bucket][col.type].push(col);
    })
    ordered.yours.result.sort(compareColumnsByAuthorAndTitle);
    ordered.yours.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.other.result.sort(compareColumnsByAuthorAndTitle);
    ordered.other.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.already.result.sort(compareColumnsByAuthorAndTitle);
    ordered.already.characteristic.sort(compareColumnsByAuthorAndTitle);
    // todo add collapsing of these blocks on clicking the header
    addColumnsBlock(list, 'your characteristic/moderator columns:', ordered.yours.characteristic);
    addColumnsBlock(list, 'your result columns:', ordered.yours.result);
    addColumnsBlock(list, 'characteristic/moderator columns:', ordered.other.characteristic);
    addColumnsBlock(list, 'result columns:', ordered.other.result);
    addColumnsBlock(list, 'columns used in the paper:', ordered.already.characteristic.concat(ordered.already.result));
    _.removeClass('#paper table.experiments tr:first-child th.add .addcolumnbox.loading', 'loading');
    _.setYouOrName();

    emptyColInfo();
    pinPopupBox('colinfo');
  }

  function compareColumnsByAuthorAndTitle(a, b) {
    if (a.definedBy < b.definedBy) return -1;
    if (a.definedBy > b.definedBy) return 1;
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  }

  function addColumnsBlock(list, headingText, columns) {
    var user = lima.getAuthenticatedUserEmail();
    if (!columns.length) return; // do nothing if we have no columns in the block
    var heading = document.createElement('li');
    heading.classList.add('heading');
    heading.textContent = headingText;
    list.appendChild(heading);
    columns.forEach(function (col) {
      var li = _.cloneTemplate('column-list-item-template').children[0];
      _.fillEls(li, '.coltitle', col.title);
      _.fillEls(li, '.definedby .value', col.definedBy || user);
      _.setProps(li, '.definedby .value', 'href', '/' + (col.definedBy || user) + '/');
      _.setDataProps(li, '.needs-owner', 'owner', col.definedBy || user);
      li.dataset.colid = col.id;

      if (currentPaper.columnOrder.indexOf(col.id) > -1) {
        li.classList.add('alreadythere');
      }

      li.addEventListener('mouseenter', fillColInfo);
      _.addEventListener(li, '.coltitle', 'click', selectNewColumn);
      list.addEventListener('mouseleave', emptyColInfo);

      list.appendChild(li);
    })
  }

  function fillColInfo(ev) {
    var col = lima.columns[ev.target.dataset.colid];
    if (!col) {
      console.warn('fillColInfo on element that doesn\'t have a valid column ID: ' + ev.target.dataset.colid);
      return;
    }
    _.fillEls('#paper th.add .colinfo .coltitle', col.title);
    _.fillEls('#paper th.add .colinfo .coldescription', col.description);
    _.fillEls('#paper th.add .colinfo .colctime .value', _.formatDateTime(col.ctime));
    _.fillEls('#paper th.add .colinfo .colmtime .value', _.formatDateTime(col.mtime));
    _.fillEls('#paper th.add .colinfo .definedby .value', col.definedBy);
    _.setProps('#paper th.add .colinfo .definedby .value', 'href', '/' + col.definedBy + '/');
    _.setDataProps('#paper th.add .colinfo .needs-owner', 'owner', col.definedBy);

    lima.columnTypes.forEach(function (type) {
      _.removeClass('#paper th.add .colinfo .coltype', type);
    });
    _.addClass('#paper th.add .colinfo .coltype', col.type);

    _.removeClass('#paper th.add .colinfo', 'unpopulated');

    if (currentPaper.columnOrder.indexOf(col.id) > -1) {
      _.addClass('#paper th.add .colinfo', 'alreadythere');
    } else {
      _.removeClass('#paper th.add .colinfo', 'alreadythere');
    }

    _.setYouOrName();
  }

  function emptyColInfo() {
    _.addClass('#paper th.add .colinfo', 'unpopulated');
  }

  function selectNewColumn(ev) {
    var el = ev.target;
    while (el && !el.dataset.colid) el = el.parentElement;
    var col = lima.columns[el.dataset.colid];
    if (!col) {
      console.warn('selectNewColumn on element that doesn\'t have a valid column ID: ' + ev.target.dataset.colid);
      return;
    }
    if (currentPaper.columnOrder.indexOf(col.id) > -1) return; // do nothing on columns that are already there
    // todo this will change when un-hiding a column

    currentPaper.columnOrder.push(col.id);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();

    // the click will popup the wrong box, so delay popping up the right one until after the click is fully handled
    setTimeout(pinPopupBox, 0, 'fullcolinfo@' + el.dataset.colid);
  }

  function addNewExperimentColumn() {
    dismissAddExperimentColumn();
    var col = lima.newColumn();
    currentPaper.columnOrder.push(col.id);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();
    setTimeout(focusFirstValidationError, 0);
  }

  function deleteNewColumn() {
    unpinPopupBox();
    for (var i = 0; i < currentPaper.columnOrder.length; i++) {
      var colId = currentPaper.columnOrder[i];
      var col = lima.columns[colId];
      if (col.new && !col.title) {
        currentPaper.columnOrder.splice(i, 1);
        moveResultsAfterCharacteristics(currentPaper);
        break;
      }
    }
    updatePaperView();
    setTimeout(focusFirstValidationError, 0);
  }

  /* adding rows
   *
   *
   *     ##   #####  #####  # #    #  ####     #####   ####  #    #  ####
   *    #  #  #    # #    # # ##   # #    #    #    # #    # #    # #
   *   #    # #    # #    # # # #  # #         #    # #    # #    #  ####
   *   ###### #    # #    # # #  # # #  ###    #####  #    # # ## #      #
   *   #    # #    # #    # # #   ## #    #    #   #  #    # ##  ## #    #
   *   #    # #####  #####  # #    #  ####     #    #  ####  #    #  ####
   *
   *
   */

  function addExperimentRow() {
    // if there are no pending changes, add a new experiment
    if (!lima.checkToPreventForcedSaving()) {
      if (!Array.isArray(currentPaper.experiments)) currentPaper.experiments = [];
      currentPaper.experiments.push({});
      updatePaperView();
      // focus the empty title of the new experiment
      focusFirstValidationError();
    } else {
      console.warn('cannot add a row with some edited values pending');
    }
  }

  function deleteNewExperiment() {
    if (!lima.checkToPreventForcedSaving()) {
      if (!Array.isArray(currentPaper.experiments)) return;
      var lastExp = currentPaper.experiments[currentPaper.experiments.length - 1];
      if (lastExp && Object.keys(lastExp).length === 0) {
        currentPaper.experiments.pop();
      }
      unpinPopupBox();
      updatePaperView();
      focusFirstValidationError();
    }
  }

  /* comments
   *
   *
   *    ####   ####  #    # #    # ###### #    # #####  ####
   *   #    # #    # ##  ## ##  ## #      ##   #   #   #
   *   #      #    # # ## # # ## # #####  # #  #   #    ####
   *   #      #    # #    # #    # #      #  # #   #        #
   *   #    # #    # #    # #    # #      #   ##   #   #    #
   *    ####   ####  #    # #    # ###### #    #   #    ####
   *
   *
   */

  function fillComments(templateId, root, countSelector, textSelector, paper, commentsPropPath) {
    var comments = getDeepValue(paper, commentsPropPath) || [];

    if (comments.length > 0) {
      root.classList.add('hascomments');
    }
    _.fillEls(root, countSelector, comments.length);

    var user = lima.getAuthenticatedUserEmail();

    var textTargetEl = _.findEl(root, textSelector);
    textTargetEl.innerHTML = '';

    for (var i = 0; i < comments.length; i++) {
      var el = _.cloneTemplate(templateId).children[0];

      var comment = comments[i];
      if (i === comments.length - 1) {
        _.setDataProps(el, '.needs-owner', 'owner', comment.by || user);
      } else {
        // this will disable editing of any comment but the last
        _.setDataProps(el, '.needs-owner', 'owner', '');
      }

      _.fillEls(el, '.commentnumber', i+1);
      _.fillEls(el, '.by', comment.by || user);
      _.setProps(el, '.by', 'href', '/' + (comment.by || user) + '/');
      _.fillEls(el, '.ctime', _.formatDateTime(comment.ctime || Date.now()));
      _.fillEls(el, '.text', comment.text);

      addOnInputUpdater(el, '.text', 'textContent', identity, paper, commentsPropPath.concat(i, 'text'));
      textTargetEl.appendChild(el);
    }

    // events for adding a comment
    _.findEls(root, '.comment.new .text').forEach(function (el) {
      el.onblur = function () {
        var text = el.textContent;
        el.textContent = '';
        if (text.trim()) {
          var comments = getDeepValue(paper, commentsPropPath, []);
          comments.push({ text: text });
          fillComments(templateId, root, countSelector, textSelector, paper, commentsPropPath);
          _.setYouOrName(); // the new comment needs to be marked as "yours" so you can edit it
          _.scheduleSave(paper);
        }
      }
    });
  }

  var paperTitles = [];
  var paperTitlesNextUpdate = 0;

  // now retrieve the list of all paper titles for checking uniqueness
  function loadPaperTitles() {
    var curtime = Date.now();
    if (paperTitlesNextUpdate < curtime) {
      paperTitlesNextUpdate = curtime + 5 * 60 * 1000; // update paper titles no less than 5 minutes from now
      fetch('/api/papers/titles')
      .then(_.fetchJson)
      .then(function (titles) { paperTitles = titles; })
      .catch(function (err) {
        console.error('problem getting paper titles');
        console.error(err);
      });
    }
  }

  var currentPaperOrigTitle;

  function checkPaperTitleUnique(title) {
    if (title === '') throw null; // no message necessary
    if (title === 'new') throw '"new" is a reserved paper name';
    if (!title.match(/^[a-zA-Z0-9.-]+$/)) throw 'paper short name cannot contain spaces or special characters';
    loadPaperTitles();
    if (title !== currentPaperOrigTitle && paperTitles.indexOf(title) !== -1) {
      // try to give a useful suggestion for common names like Juliet94a
      var match = title.match(/(^[a-zA-Z0-9]*[0-9]+)([a-zA-Z]?)$/);
      if (match) {
        var suggestion = match[1];
        var postfix = 97; // 97 is 'a'; 123 is beyond 'z'
        while (paperTitles.indexOf(suggestion+String.fromCharCode(postfix)) > -1 && postfix < 123) postfix++;
        if (postfix < 123) throw 'try ' + suggestion + String.fromCharCode(postfix) + ', "' + title + '" is already used';
      }

      // otherwise just say this
      throw 'paper "' + title + '" already exists, please try a different short name';
    }
    return title;
  }

  function checkExperimentTitleUnique(title, editingEl) {
    if (title === '') throw null; // no message necessary
    if (!title.match(/^[a-zA-Z0-9.-]+$/)) throw 'only characters and digits';
    var titles = currentPaper.experiments.map(function (exp) { return exp.title; });
    if (title !== editingEl.dataset.origTitle && titles.indexOf(title) !== -1) {
      throw 'must be unique';
    }
    return title;
  }

  function checkColTitle(title) {
    if (title === '') throw null; // no message necessary
    return title;
  }

  function linkEditTest(ev) {
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

  function preventLinkEditBlur(ev) {
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

  // don't save automatically after an error
  lima.checkToPreventSaving = function checkToPreventSaving() {
    return _.findEl('#paper.savingerror') || _.findEl('#paper.validationerror') || _.findEl('#paper.unsaved');
  }

  // don't save at all when a validation error is there
  lima.checkToPreventForcedSaving = function checkToPreventForcedSaving() {
    return _.findEl('#paper.validationerror') || _.findEl('#paper.unsaved');
  }

  var savePendingInterval = null;
  var savePendingStart = 0;

  lima.savePendingStarted = function savePendingStarted() {
    _.addClass('#paper', 'savepending');

    // every 60s update the screen to say something like "it's been minutes without saving, take a break!"
    savePendingStart = Date.now();
    savePendingInterval = setInterval(savePendingTick, 60000);
  }

  function savePendingTick() {
    // todo put a message in the page somewhere - like "will be saved soon... (3m without saving)"
    // console.log('save pending since ' + Math.round((Date.now()-savePendingStart)/1000) + 's');
  }

  lima.savePendingStopped = function savePendingStopped() {
    _.removeClass('#paper', 'savepending');

    var saveDelay = Math.round((Date.now() - savePendingStart)/1000);
    if (saveDelay > lima.savePendingMax) {
      lima.savePendingMax = saveDelay;
      console.log('maximum time with a pending save: ' + lima.savePendingMax + 's');
    }
    savePendingStart = 0;
    clearInterval(savePendingInterval);
    savePendingInterval = null;
  }

  lima.saveStarted = function saveStarted() {
    _.removeClass('#paper', 'savingerror');
    _.addClass('#paper', 'saving');
  }

  lima.saveStopped = function saveStopped() {
    _.removeClass('#paper', 'saving');
    _.removeClass('#paper', 'editing-disabled-by-saving');
  }

  lima.saveError = function saveError() {
    _.addClass('#paper', 'savingerror');
    _.removeClass('#paper', 'saving');
  }

  function savePaper() {
    return lima.getGapiIDToken()
      .then(function(idToken) {
        return fetch(currentPaperUrl, {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: JSON.stringify(currentPaper),
        });
      })
      .then(_.fetchJson)
      .then(updatePaperView)
      .then(updatePageURL)
      .catch(function(err) {
        console.error('error saving paper');
        if (err instanceof Response) err.text().then(function (t) {console.error(t)});
        else console.error(err);
        throw err;
      })
  }



  /* changing cols
   *
   *
   *    ####  #    #   ##   #    #  ####  # #    #  ####      ####   ####  #       ####
   *   #    # #    #  #  #  ##   # #    # # ##   # #    #    #    # #    # #      #
   *   #      ###### #    # # #  # #      # # #  # #         #      #    # #       ####
   *   #      #    # ###### #  # # #  ### # #  # # #  ###    #      #    # #           #
   *   #    # #    # #    # #   ## #    # # #   ## #    #    #    # #    # #      #    #
   *    ####  #    # #    # #    #  ####  # #    #  ####      ####   ####  ######  ####
   *
   *
   */

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

    var i = currentPaper.columnOrder.indexOf(colId);
    if (i === -1) return console.error('column ' + colId + ' not found in newly regenerated order!');
    _.moveInArray(currentPaper.columnOrder, i, left, most);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();
    _.scheduleSave(currentPaper);
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

  function changeColumnType(ev) {
    var newTypeEl = ev.target;

    // find the element with the class 'coltype' before the button
    var coltypeEl = _.findPrecedingEl(newTypeEl, '.coltype');

    if (!coltypeEl) {
      console.warn('changeColumnType called on a button before which there is no .coltype');
      return;
    }

    if (lima.columnTypes.indexOf(newTypeEl.dataset.newType) === -1) {
      console.warn('changeColumnType called on an element with no (or unknown) dataset.newType');
      return;
    }

    // if the oldtype is already the same as newtype, do nothing
    if (coltypeEl.classList.contains(newTypeEl.dataset.newType)) return;

    coltypeEl.dataset.newType = newTypeEl.dataset.newType;
    if (coltypeEl.classList.contains('newcol')) {
      setTimeout(doChangeColumnTypeConfirmOrCancel, 0, coltypeEl);
    } else {
      coltypeEl.classList.add('unsaved');
      setUnsavedClass();
    }
  }

  function changeColumnTypeConfirmOrCancel(ev) {
    // a click will pin the box,
    // this timout makes sure the click gets processed first and then we do the change
    setTimeout(doChangeColumnTypeConfirmOrCancel, 0, ev.target);
  }

  function doChangeColumnTypeConfirmOrCancel(btn) {
    // find the element with the class 'coltype' before the button
    var coltypeEl = _.findPrecedingEl(btn, '.coltype');

    if (!coltypeEl) {
      console.warn('changeColumnTypeConfirmOrCancel called on a button before which there is no .coltype');
      return;
    }

    var col = lima.columns[btn.dataset.id];
    if (!col) {
      console.warn('changeColumnTypeConfirmOrCancel couldn\'t find column for id ' + btn.dataset.id);
      return;
    }

    if (lima.columnTypes.indexOf(coltypeEl.dataset.newType) === -1) {
      console.warn('changeColumnTypeConfirmOrCancel called while coltype element has no (or unknown) dataset.newType');
      return;
    }

    coltypeEl.classList.remove('unsaved');
    setUnsavedClass();

    if (!btn.classList.contains('cancel')) {
      col.type = coltypeEl.dataset.newType;
      moveResultsAfterCharacteristics(currentPaper);
      updatePaperView();
      _.scheduleSave(col);
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
  var identity = null; // special value to use as validatorSanitizer

  function addOnInputUpdater(root, selector, property, validatorSanitizer, target, targetProp) {
    if (!(root instanceof Node)) {
      targetProp = target;
      target = validatorSanitizer;
      validatorSanitizer = property;
      property = selector;
      selector = root;
      root = document;
    }

    _.findEls(root, selector).forEach(function (el) {
      if (el.classList.contains('editing') || el.isContentEditable || el.contentEditable === 'true') {
        el.addEventListener('keydown', _.deferScheduledSave);
        el.oninput = function () {
          var value = el[property];
          if (typeof value === 'string' && value.trim() === '') value = '';
          try {
            if (validatorSanitizer) value = validatorSanitizer(value, el, property);
          } catch (err) {
            el.classList.add('validationerror');
            el.dataset.validationmessage = err.message || err;
            setValidationErrorClass();
            _.cancelScheduledSave(target);
            return;
          }
          el.classList.remove('validationerror');
          setValidationErrorClass();
          assignDeepValue(target, targetProp, value);
          _.scheduleSave(target);
        };
      } else {
        el.oninput = null;
      }
    });
  }

  function addConfirmedUpdater(root, selector, confirmselector, cancelselector, property, validatorSanitizer, target, targetProp, deleteFunction) {
    if (!(root instanceof Node)) {
      deleteFunction = targetProp;
      targetProp = target;
      target = validatorSanitizer;
      validatorSanitizer = property;
      property = cancelselector;
      cancelselector = confirmselector;
      confirmselector = selector;
      selector = root;
      root = document;
    }

    var editingEl = _.findEls(root, selector);
    var confirmEl = _.findEls(root, confirmselector);
    var cancelEls = _.findEls(root, cancelselector);

    if (editingEl.length > 1 || confirmEl.length > 1) {
      console.error('multiple title editing elements or confirmation buttons found, user interface may not work');
      throw _.apiFail();
    }

    editingEl = editingEl[0];
    confirmEl = confirmEl[0];

    if (!editingEl || !confirmEl ||
        !(editingEl.classList.contains('editing') || editingEl.isContentEditable || editingEl.contentEditable === 'true')) {
      console.error('editing element or confirmation button not found, user interface may not work');
      throw _.apiFail();
    }

    editingEl.oninput = editingEl.onblur = function (ev) {
      var value = editingEl[property];
      if (typeof value === 'string' && value.trim() === '') value = '';
      try {
        if (validatorSanitizer) value = validatorSanitizer(value, editingEl, property);
      } catch (err) {
        editingEl.classList.add('validationerror');
        editingEl.dataset.validationmessage = err && err.message || err || '';
        if (ev) setValidationErrorClass();
        confirmEl.disabled = true;
        _.cancelScheduledSave(target);
        return;
      }
      var origValue = getDeepValue(target, targetProp) || '';
      if (value !== origValue) {
        confirmEl.disabled = false;
        editingEl.classList.add('unsaved');
      } else {
        confirmEl.disabled = true;
        editingEl.classList.remove('unsaved');
      }
      editingEl.classList.remove('validationerror');

      // the following calls are expensive and unnecessary when building the dom
      // but when building the dom, we don't have `ev`
      if (ev) {
        setValidationErrorClass();
        setUnsavedClass();
      }
    };

    editingEl.oninput();

    function cancel() {
      editingEl[property] = getDeepValue(target, targetProp);
      editingEl.oninput();
    }

    editingEl.onkeydown = function (ev) {
      if (ev.keyCode === 27) {
        if (editingEl.classList.contains('new') && deleteFunction) {
          editingEl.classList.remove('unsaved');
          editingEl.classList.remove('validationerror');
          setUnsavedClass();
          setValidationErrorClass();
          deleteFunction();
        } else {
          cancel();
          ev.target.blur();
        }
        ev.preventDefault();
      }
      else if (ev.keyCode == 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        ev.target.blur();
        confirmEl.onclick();
      }
    }

    confirmEl.onclick = function () {
      var value = editingEl[property];
      if (typeof value === 'string' && value.trim() === '') value = '';
      try {
        if (validatorSanitizer) value = validatorSanitizer(value, editingEl, property);
      } catch (err) {
        // any validation reporting is done above in the handler on editingEl
        return;
      }
      assignDeepValue(target, targetProp, value);
      confirmEl.disabled = true;
      editingEl.classList.remove('unsaved');
      setUnsavedClass();
      updatePaperView();
      _.scheduleSave(target);
    };

    cancelEls.forEach(function (cancelEl) {
      cancelEl.onclick = cancel;
    })
  }

  function assignDeepValue(target, targetProp, value) {
    if (Array.isArray(targetProp)) {
      // copy targetProp so we can manipulate it
      targetProp = targetProp.slice();
      while (targetProp.length > 1) {
        var prop = targetProp.shift();
        if (!(prop in target) || target[prop] == null) {
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

  function getDeepValue(target, targetProp, addDefaultValue) {
    if (Array.isArray(targetProp)) {
      targetProp = [].concat(targetProp); // duplicate the array so we don't affect the passed value
    } else {
      targetProp = [targetProp];
    }

    while (targetProp.length > 0) {
      var prop = targetProp.shift();
      if (!(prop in target) || target[prop] == null) {
        if (addDefaultValue != null) {
          if (targetProp.length == 0) target[prop] = addDefaultValue;
          else if (Number.isInteger(targetProp[0])) target[prop] = [];
          else target[prop] = {};
        } else {
          return undefined;
        }
      }
      target = target[prop];
    }

    return target;
  }

  function setValidationErrorClass() {
    if (_.findEl('#paper .validationerror')) _.addClass('#paper', 'validationerror');
    else _.removeClass('#paper', 'validationerror');
  }

  function setUnsavedClass() {
    if (_.findEl('#paper .unsaved')) _.addClass('#paper', 'unsaved');
    else _.removeClass('#paper', 'unsaved');
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
    var origBox = box;
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
    if (!box && !(origBox instanceof Element)) console.warn('cannot find element for popup box ' + origBox);
    return box;
  }

  function findPopupBoxTrigger(el) {
    var trigger = el;
    while (trigger && !trigger.classList.contains('popupboxtrigger')) trigger = trigger.parentElement;
    return trigger;
  }

  var pinnedBox = null;
  function pinPopupBox(el) {
    var box = findPopupBox(el);

    if (box) {
      if (pinnedBox !== box.dataset.boxid) unpinPopupBox();

      pinnedBox = box.dataset.boxid;
      document.body.classList.add('boxpinned');
      box.classList.add('pinned');

      // find nearest parent-or-self that is '.popupboxtrigger' so it can be raised above others when pinned
      var trigger = findPopupBoxTrigger(box);
      if (trigger) trigger.classList.add('pinned');
    }

    return box;
  }

  function unpinPopupBox() {
    if (pinnedBox) {
      var pinned = _.findEl('[data-boxid="' + pinnedBox + '"]')
      if (pinned) {
        pinned.classList.remove('pinned');

        var trigger = pinned;
        while (trigger && !trigger.classList.contains('popupboxtrigger')) trigger = trigger.parentElement;
        if (trigger) trigger.classList.remove('pinned');
      }
    }
    pinnedBox = null;
    document.body.classList.remove('boxpinned');
  }

  function setupPopupBoxPinning(el, selector, localid) {
    _.findEls(el, selector).forEach(function (box) {
      var oldId = box.dataset.boxid;
      if (box.dataset.boxtype) box.dataset.boxid = box.dataset.boxtype + "@" + localid;
      // in case a new column was saved and got a new ID, and the box was previously pinned, update the pinned box's ID here
      if (oldId && pinnedBox === oldId) {
        pinnedBox = box.dataset.boxid;
      }
      box.classList.remove('pinned');

      var trigger = box;
      while (trigger && !trigger.classList.contains('popupboxtrigger')) trigger = trigger.parentElement;
      if (trigger) trigger.classList.remove('pinned');
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
  document.addEventListener('keydown', blockWhenSaving, true);
  document.addEventListener('keydown', dismissOrBlurOnEscape);
  document.addEventListener('click', popupOnClick);

  // a keystroke when saving will trigger the "saving..." spinner, and otherwise be ignored
  function blockWhenSaving(ev) {
    if (_.isSaving()) {
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      ev.preventDefault();
      _.addClass('#paper', 'editing-disabled-by-saving');
    }
  }

  // dismiss pinned popup boxes with Escape or with a click outside them
  function dismissOrBlurOnEscape(ev) {
    if (ev.keyCode === 27) {
      if (ev.target === document.activeElement && document.activeElement !== document.body && document.activeElement.nodeName !== 'BUTTON') {
        ev.target.blur();
      } else if (pinnedBox) {
        dismissAddExperimentColumn();
        unpinPopupBox();
      }
    }
  }

  function popupOnClick(ev) {
    var el = ev.target;
    if (el.classList.contains('notunpin')) return;
    // check if we've clicked on the 'pin' button or otherwise in a popupboxtrigger
    while (el && !el.classList.contains('pin') && !el.classList.contains('popupboxtrigger')) el = el.parentElement;
    if (!el || el.classList.contains('pin') && pinnedBox) {
      unpinPopupBox();
      dismissAddExperimentColumn();
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

  function focusAnotherElementOnClick(ev) {
    var el = ev.currentTarget;

    // focus the right element - trying to find it inside the event target element, or progressively inside its ancestor elements
    var focusingSelector = el.dataset.focuses;
    var toFocus = null;
    while (el && !(toFocus = _.findEl(el, focusingSelector))) el = el.parentElement;

    focusElement(toFocus);
  }

  function focusFirstUnsaved() {
    return focusElement(_.findEl('#paper .unsaved'));
  }

  function focusFirstValidationError() {
    return focusElement(_.findEl('#paper .validationerror'));
  }

  function focusElement(el) {
    if (el) {
      // if the element is inside a popup box, pin that box so the element is visible
      pinPopupBox(el);
      el.focus();
      return el;
    }
  }

  // a workaround for strange chrome behaviour
  function blurAndFocus(ev) {
    ev.target.blur();
    ev.target.focus();
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

  lima.updateView = updatePaperView;
  lima.updateAfterColumnSave = updateAfterColumnSave;

  // for testing
  lima.pinPopupBox = pinPopupBox;
  lima.unpinPopupBox = unpinPopupBox;
  lima.updatePaperView = updatePaperView;
  lima.assignDeepValue = assignDeepValue;
  lima.getDeepValue = getDeepValue;
  lima.getPaperTitles = function(){return paperTitles;};
  lima.getCurrentPaper = function(){return currentPaper;};
  lima.savePendingMax = 0;


  window._ = _;

})(window, document);
