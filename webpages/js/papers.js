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

  var currentPaper;

  function requestPaper(title) {
    var email = lima.extractUserProfileEmailFromUrl();

    return lima.getGapiIDToken()
    .then(function (idToken) {
      var currentPaperUrl = '/api/papers/' + email + '/' + title;
      return fetch(currentPaperUrl, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(initPaper);
  }

  function requestAndFillPaper() {
    var title = lima.extractPaperTitleFromUrl();
    _.fillEls('#paper .title', title);

    lima.getColumns() // todo getColumns could run in parallel with everything before updatePaperView
    .then(function() { return requestPaper(title); })
    .then(setCurrentPaper)
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
    .then(loadAllTitles); // ignoring any errors here
  }

  function Paper() {}
  Paper.prototype.save = savePaper;
  Paper.prototype.init = initPaper;
  Paper.prototype.saveOrder = 2; // between columns and metaanalyses

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

    // clean columns the same way
    lima.updateColumnListAfterColumnSave(currentPaper.columns);

    updatePaperView();
  }

  function initPaper(newPaper) {
    var self = this;
    if (!(self instanceof Paper)) self = new Paper();

    var oldId = self.id;

    // clean all properties of this paper
    for (var prop in self) { if (self.hasOwnProperty(prop)) { delete self[prop]; } }

    // get data from the new paper
    Object.assign(self, newPaper);

    if (!self.id) {
      self.id = oldId || _.createId('paper');
      self.new = true;
    } else if (oldId != self.id) {
      self.oldTemporaryId = oldId;
    }

    // if paper doesn't have experiments or column order, add empty arrays for ease of handling
    if (!Array.isArray(self.experiments)) self.experiments = [];
    if (!Array.isArray(self.columns)) self.columns = [];
    if (!Array.isArray(self.hiddenCols)) self.hiddenCols = [];
    if (!Array.isArray(self.tags)) self.tags = [];

    // if any experiment has data that isn't in columns (e.g. it was added in a metaanalysis page)
    // add it to columns
    self.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        if (self.columns.indexOf(key) === -1) self.columns.push(key);
      });
    });

    self.columns.forEach(function (col) {
      if (typeof col === 'object') {
        var parsed = lima.parseFormulaString(col.formula);
        if (parsed != null) {
          col.formulaName = parsed.formulaName;
          col.formulaParams = parsed.formulaParams;
        } else {
          col.formulaName = null;
          col.formulaParams = [];
        }
      }
    });
    renumberComputedColumns(self.columns);

    // if some column type has changed, make sure the paper reflects that
    moveResultsAfterCharacteristics(self);

    return self;
  }

  function renumberComputedColumns(columns) {
    var computedColumnCount = 0;
    columns.forEach(function (col) {
      if (typeof col === 'object') {
        col.number = computedColumnCount += 1;
      }
    });
  }

  function setCurrentPaper(paper) {
    currentPaper = paper;
  }

  function updatePaperView() {
    if (!currentPaper) return;

    fillPaper(currentPaper);

    // for a new paper, go to editing the title
    if (currentPaper.new) focusFirstValidationError();
  }

  var startNewTag = null;
  var flashTag = null;
  var rebuildingDOM = false;

  function fillPaper(paper) {
    // cleanup
    var oldPaperEl = _.byId('paper');
    rebuildingDOM = true;
    if (oldPaperEl) oldPaperEl.parentElement.removeChild(oldPaperEl);
    rebuildingDOM = false;

    resetComputedDataSetters();

    if (paper.new) {
      _.addClass('body', 'new');
    } else {
      _.removeClass('body', 'new');
    }

    if (paper.new || lima.userLocalStorage) {
      lima.toggleEditing(true);
    }

    var paperTemplate = _.byId('paper-template');
    var paperEl = _.cloneTemplate(paperTemplate).children[0];
    paperTemplate.parentElement.insertBefore(paperEl, paperTemplate);

    fillTags(paperEl, paper);
    fillPaperExperimentTable(paper);

    // for now, do local storage "edit your copy"
    // var ownURL = createPageURL(lima.getAuthenticatedUserEmail(), paper.title);
    var ownURL = createPageURL(lima.localStorageUserEmailAddress, paper.title);
    _.setProps(paperEl, '.edityourcopy a', 'href', ownURL);

    _.fillEls(paperEl, '.title', paper.title);
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
    addConfirmedUpdater('#paper .doi span.editing', '#paper .doi button.confirm', '#paper .doi button.cancel', 'textContent', _.stripDOIPrefix, paper, 'doi');

    // workaround for chrome not focusing right
    // clicking on the placeholder 'doi' of an empty editable doi value focuses the element but doesn't react to subsequent key strokes
    _.addEventListener(paperEl, '.link .value.editing', 'click', _.blurAndFocus);
    _.addEventListener(paperEl, '.doi .value.editing', 'click', _.blurAndFocus);

    addOnInputUpdater(paperEl, ".reference .value", 'textContent', identity, paper, 'reference');
    addOnInputUpdater(paperEl, ".description .value", 'textContent', identity, paper, 'description');

    currentPaperOrigTitle = paper.title;
    addConfirmedUpdater('#paper .title.editing', '#paper .title + .titlerename', '#paper .title ~ * .titlerenamecancel', 'textContent', checkTitleUnique, paper, 'title');

    _.setYouOrName();

    // now that the paper is all there, install various general and specific event listeners
    _.addEventListener(paperEl, '[contenteditable].oneline', 'keydown', _.blurOnEnter);

    _.addEventListener(paperEl, '.linkedit button.test', 'click', _.linkEditTest);
    _.addEventListener(paperEl, '.linkedit button.test', 'mousedown', _.preventLinkEditBlur);

    _.addEventListener(paperEl, '[data-focuses]', 'click', focusAnotherElementOnClick);

    _.addEventListener(paperEl, '.savingerror', 'click', _.manualSave);
    _.addEventListener(paperEl, '.savepending', 'click', _.manualSave);
    _.addEventListener(paperEl, '.validationerrormessage', 'click', focusFirstValidationError);
    _.addEventListener(paperEl, '.unsavedmessage', 'click', focusFirstUnsaved);

    document.addEventListener('keydown', moveBetweenDataCells, true);

    if (pinnedBox) pinPopupBox(pinnedBox);

    setValidationErrorClass();
    setUnsavedClass();

    recalculateComputedData();
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
        _.putCursorAtEnd(newTag);
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

    var lastColumnHidden = false;

    paper.columns.forEach(function (col, columnIndex) {
      if (typeof col !== 'object' && isHiddenCol(col)) {
        // Save the fact that we just hid a column, so the next non-hidden
        // column can behave differently (i.e show a arrow).
        lastColumnHidden = true;
        return;
      }

      var th;

      if (typeof col === 'object') {
        th = fillComputedColumnHeading(paper, col, columnIndex);
      } else {
        th = fillDataColumnHeading(col, curtime, user);
      }

      headingsRowNode.insertBefore(th, addColumnNode);
      _.setDataProps(th, '.fullcolinfo.popupbox', 'index', columnIndex);

      if (lastColumnHidden) {
        // We know that there should be an "unhide" button on this column
        addUnhideButton(th);
        lastColumnHidden = false;
      }
    });

    // Check to see if the last column was hidden.
    if (lastColumnHidden) {
      addUnhideButton(addColumnNode);
      lastColumnHidden = false;
    }

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
      addConfirmedUpdater(tr, '.exptitle.editing', '.exptitle + .exptitlerename', null, 'textContent', checkExperimentTitle, paper, ['experiments', expIndex, 'title'], deleteNewExperiment);

      setupPopupBoxPinning(tr, '.fullrowinfo.popupbox', expIndex);

      paper.columns.forEach(function (col) {
        // early return - ignore this column
        if (isHiddenCol(col)) return;

        var val = null;
        var td = _.cloneTemplate('experiment-datum-template').children[0];
        tr.appendChild(td);

        if (typeof col === 'string') {
          // not a computed column
          if (experiment.data && experiment.data[col]) {
            val = experiment.data[col];
          }

          if (!val || val.value == null) {
            td.classList.add('empty');
          } else {
            _.fillEls(td, '.value', val.value);
          }

          addOnInputUpdater(td, '.value', 'textContent', trimmingSanitizer, paper, ['experiments', expIndex, 'data', col, 'value'], recalculateComputedData);

          var user = lima.getAuthenticatedUserEmail();
          _.fillEls (td, '.valenteredby', val && val.enteredBy || user);
          _.setProps(td, '.valenteredby', 'href', '/' + (val && val.enteredBy || user) + '/');
          _.fillEls (td, '.valctime', _.formatDateTime(val && val.ctime || Date.now()));

          setupPopupBoxPinning(td, '.datum.popupbox', expIndex +',' + col);

          // populate comments
          fillComments('comment-template', td, '.commentcount', '.datum.popupbox main', paper, ['experiments', expIndex, 'data', col, 'comments']);

          td.classList.add(lima.columns[col].type);

          if (lima.columns[col].new) {
            td.classList.add('newcol');
          }

        } else {
          // computed column
          td.classList.add('computed');
          // todo computed from x and y

          addComputedDatumSetter(function() {
            var val = getDatumValue(col, expIndex);

            // handle bad values like Excel
            if (val == null) {
              val = '';
              td.classList.add('empty');
            } else if (typeof val == 'number' && isNaN(val)) {
              val = '#VALUE!';
              td.classList.add('empty');
            } else {
              td.classList.remove('empty');
            }

            // only show three significant digits for numbers
            if (typeof val == 'number') val = val.toPrecision(3);

            _.fillEls(td, '.value', val);


            // fill in information about where the value was computed from
            _.setProps(td, '.formula', 'innerHTML', getColTitle(col, Infinity));
          });
          setupPopupBoxPinning(td, '.datum.popupbox', expIndex + ',' + col.formula);

          td.classList.add('result');
        }

      });
    });

    _.addEventListener(table, 'tr.add button.add', 'click', addExperimentRow);

    _.addEventListener(table, 'th.add button.add', 'click', addExperimentColumn);
    _.addEventListener(table, 'th.add button.cancel', 'click', dismissAddExperimentColumn);
    _.addEventListener(table, 'th.add button.addnew', 'click', addNewExperimentColumn);
    _.addEventListener(table, 'th.add button.addcomp', 'click', addNewComputedColumn);

    var experimentsContainer = _.findEl('#paper .experiments');
    experimentsContainer.appendChild(table);
  }

  function fillDataColumnHeading(colId, curtime, user) {
    var th = _.cloneTemplate('col-heading-template').children[0];
    var col = lima.columns[colId];

    _.fillEls(th, '.coltitle', col.title);
    _.fillEls(th, '.coldescription', col.description);
    _.fillEls(th, '.colctime .value', _.formatDateTime(col.ctime || curtime));
    _.fillEls(th, '.colmtime .value', _.formatDateTime(col.mtime || curtime));
    _.fillEls(th, '.definedby .value', col.definedBy || user);
    _.setProps(th, '.definedby .value', 'href', '/' + (col.definedBy || user) + '/');

    _.addEventListener(th, 'button.move', 'click', moveColumn);

    _.addEventListener(th, 'button.hide', 'click', hideColumn);

    th.classList.add(col.type);
    _.addClass(th, '.coltype', col.type);

    if (col.new) {
      th.classList.add('newcol');
      _.addClass(th, '.coltype', 'newcol');
      _.addClass(th, '.coltitle.editing', 'new');
      // todo move the confirm/rename difference into html, but that means we have multiple confirm buttons and addConfirmedUpdater might be unhappy
      _.fillEls(th, '.coltitle + .coltitlerename', 'confirm');
    }

    addOnInputUpdater(th, '.coldescription', 'textContent', identity, col, ['description']);

    addConfirmedUpdater(th, '.coltitle.editing', '.coltitle ~ .coltitlerename', '.coltitle ~ * .colrenamecancel', 'textContent', checkColTitle, col, 'title', deleteNewColumn, function(){_.scheduleSave(currentPaper);});

    setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.id);

    _.addEventListener(th, '.coltype .switch', 'click', changeColumnType);
    _.addEventListener(th, '.coltypeconfirm button', 'click', changeColumnTypeConfirmOrCancel);

    _.setDataProps(th, '.needs-owner', 'owner', col.definedBy || user);

    return th;
  }

  function fillComputedColumnHeading(paper, col /*, columnIndex */) {
    var th = _.cloneTemplate('computed-col-heading-template').children[0];

    th.classList.add('result');

    // Editing Options
    // Add an option for every formula we know
    var formulas = lima.listFormulas();
    var formulasDropdown = _.findEl(th, 'select.colformulas')
    for (var i = 0; i < formulas.length; i++){
      var el = document.createElement("option");
      el.textContent = formulas[i].label;
      el.value = formulas[i].id;
      if (col.formulaName === el.value) {
        el.selected = true;
        formulasDropdown.classList.remove('validationerror');
      }
      formulasDropdown.appendChild(el);
    }

    formulasDropdown.onchange = function(e) {
      col.formulaName = e.target.value;

      var formula = lima.getFormulaById(col.formulaName);
      if (formula) {
        formulasDropdown.classList.remove('validationerror');
      } else {
        formulasDropdown.classList.add('validationerror');
      }
      // we'll call setValidationErrorClass() later

      // make sure formula columns array matches the number of expected parameters
      col.formulaParams.length = formula ? formula.parameters.length : 0;
      col.formula = lima.createFormulaString(col);

      // fill the columns selection
      fillFormulaColumnsSelection(paper, col, th, formula);

      _.scheduleSave(paper);
      recalculateComputedData();
    };

    var formula = lima.getFormulaById(col.formulaName);
    fillFormulaColumnsSelection(paper, col, th, formula);

    setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.formula);

    _.addEventListener(th, 'button.move', 'click', moveColumn);
    _.addEventListener(th, 'button.delete', 'click', deleteColumn);

    // fillComments('comment-template', th, '.commentcount', '.fullcolinfo.popupbox main', metaanalysis, ['columns', columnIndex, 'comments']);

    return th;
  }

  function fillFormulaColumnsSelection(paper, col, computedColumnsOptionsEl, formula) {
    // editing drop-down boxes for parameter columns
    var formulaColumnsSelectionEl = _.findEl(computedColumnsOptionsEl, '.colformulacolumnsselection');
    // clear out old children.
    formulaColumnsSelectionEl.innerHTML = '';

    fillComputedColumnInformation(computedColumnsOptionsEl, col);

    if (!formula) return;

    var noOfParams = formula.parameters.length;

    for (var i = 0; i < noOfParams; i++){
      // Make a select dropdown
      var label = document.createElement('label');
      label.textContent = formula.parameters[i] + ': ';
      formulaColumnsSelectionEl.appendChild(label);

      var select = document.createElement("select");
      label.appendChild(select);

      // the first option is an instruction
      var op = document.createElement("option");
      op.textContent = 'Select a column';
      op.value = '';
      select.appendChild(op);
      select.classList.add('validationerror');

      var foundCurrentValue = false;

      // Now make an option for each column in metaanalysis
      // account for computed columns in metaanalysis.columns
      for (var j = 0; j < paper.columns.length; j++){
        var colId = paper.columns[j];
        var found = makeOption(colId, col, col.formulaParams[i], select);
        foundCurrentValue = foundCurrentValue || found;
      }

      // if the parameter is a computed value that isn't itself a column of the metaanalysis, add it as the last option
      if (!foundCurrentValue && col.formulaParams[i]) { // ignore undefined
        colId = col.formulaParams[i];
        makeOption(colId, col, colId, select);
      }

      setValidationErrorClass();


      // listen to changes of the dropdown box
      // preserve the value of i inside this code
      (function(i, select){
        select.onchange = function(e) {
          col.formulaParams[i] = lima.parseFormulaString(e.target.value);
          col.formula = lima.createFormulaString(col);
          if (e.target.value) {
            select.classList.remove('validationerror');
          } else {
            select.classList.add('validationerror');
          }
          setValidationErrorClass();
          _.scheduleSave(paper);
          fillComputedColumnInformation(computedColumnsOptionsEl, col);
          recalculateComputedData();
        };
      })(i, select);
    }
  }

  function makeOption(optionColumn, currentTableColumn, currentValue, selectEl) {
    // the current computed column should not be an option here
    if (typeof optionColumn === 'object' && optionColumn.formula === currentTableColumn.formula) return;

    var el = document.createElement("option");

    el.innerHTML = getColTitle(optionColumn);
    el.value = getColIdentifier(optionColumn);

    var foundCurrentValue = false;

    if (getColIdentifier(currentValue) === el.value) {
      el.selected = true;
      selectEl.classList.remove('validationerror');
      foundCurrentValue = true;
    }
    selectEl.appendChild(el);

    return foundCurrentValue;
  }

  // level is how much parameter nesting we want to show:
  // 0 - no parameters, e.g. sum(...)
  // 1 - parameters without their parameters, e.g. sum(weight(...))
  // Infinity - full nesting
  function getColTitle(col, level) {
    if (typeof col === 'string') {
      var column = lima.columns[col];
      return column ? column.title : col;
    } else if (col == null) {
      return 'none';
    } else if (typeof col === 'object') {
      return getRichColumnLabel(col, level);
    } else {
      return null;
    }
  }

  function getRichColumnLabel(col, level) {
    if (level == undefined) level = col.number == null ? 1 : 0;

    var retval = '';
    if (level != Infinity && col.number !== undefined) retval += '<span>' + col.number + '. </span>';
    retval += '<span>' + lima.getFormulaOrAggregateLabelById(col.formulaName) + '</span> (';

    if (level == 0) {
      retval += '…';
    } else {
      for (var i=0; i<col.formulaParams.length; i+=1) {
        retval += ' ' + getColTitle(col.formulaParams[i], level-1);
        if (i < col.formulaParams.length - 1) retval += ',';
      }
      retval += ' ';
    }
    return retval + ')';
  }

  function getColIdentifier(col) {
    if (typeof col === 'string') {
      return col;
    } else if (typeof col === 'object') {
      if (!col.formula) throw new Error('every computed column should always have formula');
      return col.formula;
    } else {
      return null;
    }
  }

  function fillComputedColumnInformation(th, col) {
    _.setProps(th, '.richcollabel', 'innerHTML', getColTitle(col, 1));
    _.setProps(th, '.fullcollabel', 'innerHTML', getColTitle(col, Infinity));
    // todo do more for non-editing; use computed-datum as inspiration but fix it to account for computed columns
  }

  /* computed cols
   *
   *
   *    ####   ####  #    # #####  #    # ##### ###### #####      ####   ####  #       ####
   *   #    # #    # ##  ## #    # #    #   #   #      #    #    #    # #    # #      #
   *   #      #    # # ## # #    # #    #   #   #####  #    #    #      #    # #       ####
   *   #      #    # #    # #####  #    #   #   #      #    #    #      #    # #           #
   *   #    # #    # #    # #      #    #   #   #      #    #    #    # #    # #      #    #
   *    ####   ####  #    # #       ####    #   ###### #####      ####   ####  ######  ####
   *
   *
   */
  var computedDataSetters;
  var dataCache = {};
  var CIRCULAR_COMPUTATION_FLAG = {message: 'uncaught circular computation!'};

  function resetComputedDataSetters() {
    computedDataSetters = [];
  }

  // when building the dom, we save a list of functions that update every given computed cell
  function addComputedDatumSetter(f) {
    computedDataSetters.push(f);
  }

  function recalculateComputedData() {
    // clear computation cache
    dataCache = {};
    // call all the calculation functions
    computedDataSetters.forEach(function (f) { f(); });
  }

  function getDatumValue(colId, expIndex) {
    // check cache
    if (!dataCache) dataCache = {};
    var cacheId = getColIdentifier(colId)
    if (!(cacheId in dataCache)) dataCache[cacheId] = [];
    if (expIndex in dataCache[cacheId]) {
      if (dataCache[cacheId][expIndex] === CIRCULAR_COMPUTATION_FLAG) {
        throw new Error('circular computation involving col ' + cacheId);
      }
      return dataCache[cacheId][expIndex];
    }

    dataCache[cacheId][expIndex] = CIRCULAR_COMPUTATION_FLAG;

    var val = null;
    if (typeof colId === 'string') {
      // not a computed column
      if (currentPaper.experiments[expIndex] &&
          currentPaper.experiments[expIndex].data &&
          currentPaper.experiments[expIndex].data[colId] &&
          currentPaper.experiments[expIndex].data[colId].value != null) {
        val = currentPaper.experiments[expIndex].data[colId].value;
      }
    } else {
      // computed column
      var col = colId;
      var inputs = [];

      if (isColCompletelyDefined(col)) {
        var formula = lima.getFormulaById(col.formulaName);
        if (formula == null) return NaN;

        // compute the value
        // if anything here throws an exception, value cannot be computed
        for (var i=0; i<col.formulaParams.length; i++) {
          inputs.push(getDatumValue(col.formulaParams[i], expIndex));
        }

        val = formula.func.apply(null, inputs);
      }

      // if the result is NaN but some of the inputs were empty, change the result to empty.
      if (typeof val == 'number' && isNaN(val)) {
        if (inputs.some(function (x) { return x == null || x === ''; })) val = null;
      }
    }

    dataCache[cacheId][expIndex] = val;
    return val;
  }

  // check whether the column has all its parameters completely defined
  // this also works for aggregates and simple column IDs
  function isColCompletelyDefined(col) {
    if (col == null) return false;

    if (typeof col === 'string') return col in lima.columns;

    if (!lima.getFormulaById(col.formulaName) &&
        !lima.getAggregateFormulaById(col.formulaName)) return false;

    for (var i=0; i<col.formulaParams.length; i++) {
      if (!isColCompletelyDefined(col.formulaParams[i])) {
        return false;
      }
    }

    return true;
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
                   already: { result: [], characteristic: []}
                  };
    Object.keys(columns).forEach(function(colId) {
      var col = columns[colId];
      var bucket = (col.definedBy === user || !col.definedBy) ? 'yours' : 'other';
      if (currentPaper.columns.indexOf(colId) > -1) bucket = 'already';
      ordered[bucket][col.type].push(col);
    })
    ordered.yours.result.sort(compareColumnsByAuthorAndTitle);
    ordered.yours.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.other.result.sort(compareColumnsByAuthorAndTitle);
    ordered.other.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.already.result.sort(compareColumnsByAuthorAndTitle);
    ordered.already.characteristic.sort(compareColumnsByAuthorAndTitle);
    // todo add collapsing of these blocks on clicking the header

    var usedInThePaper = [].concat(
      ordered.already.characteristic,
      ordered.already.result);
    addColumnsBlock(list, 'your characteristic/moderator columns:', ordered.yours.characteristic);
    addColumnsBlock(list, 'your result columns:', ordered.yours.result);
    addColumnsBlock(list, 'characteristic/moderator columns:', ordered.other.characteristic);
    addColumnsBlock(list, 'result columns:', ordered.other.result);
    addColumnsBlock(list, 'columns used in the paper:', usedInThePaper);

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

      if (currentPaper.columns.indexOf(col.id) > -1) {
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

    if (currentPaper.columns.indexOf(col.id) > -1) {
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
    if (currentPaper.columns.indexOf(col.id) > -1) return; // do nothing on columns that are already there
    // todo this will change when un-hiding a column

    currentPaper.columns.push(col.id);
    moveResultsAfterCharacteristics(currentPaper);
    dismissAddExperimentColumn();
    updatePaperView();
    _.scheduleSave(currentPaper);

    // the click will popup the wrong box, so delay popping up the right one until after the click is fully handled
    setTimeout(pinPopupBox, 0, 'fullcolinfo@' + el.dataset.colid);
  }

  function addNewExperimentColumn() {
    dismissAddExperimentColumn();
    var col = lima.newColumn();
    currentPaper.columns.push(col.id);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();
    setTimeout(focusFirstValidationError, 0);
  }

  function addNewComputedColumn() {
    dismissAddExperimentColumn();
    var col = {
      formula: 'undefined()',
      formulaName: null,
      formulaParams: [],
    };
    currentPaper.columns.push(col);
    renumberComputedColumns(currentPaper.columns);
    updatePaperView();
    setTimeout(focusFirstValidationError, 0);
  }

  function deleteNewColumn() {
    unpinPopupBox();
    for (var i = 0; i < currentPaper.columns.length; i++) {
      var colId = currentPaper.columns[i];
      var col = lima.columns[colId];
      if (col.new && !col.title) {
        currentPaper.columns.splice(i, 1);
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
    var buttons = _.findEl(root, '.comment.new .buttons');
    var newComment = _.findEl(root, '.comment.new .text');

    // enable/disable the add button based on content
    newComment.oninput = function () {
      _.setProps(buttons, '.confirm', 'disabled', newComment.textContent.trim() == '');
    }

    // add
    _.addEventListener(root, '.comment.new .buttons .add', 'click', function() {
      var text = newComment.textContent;
      newComment.textContent = '';
      if (text.trim()) {
        var comments = getDeepValue(paper, commentsPropPath, []);
        comments.push({ text: text });
        fillComments(templateId, root, countSelector, textSelector, paper, commentsPropPath);
        _.setYouOrName(); // the new comment needs to be marked as "yours" so you can edit it
        _.scheduleSave(paper);
      }
    });

    // cancel
    _.addEventListener(root, '.comment.new .buttons .cancel', 'click', function() {
      newComment.textContent = '';
      newComment.oninput();
    });
  }

  var allTitles = [];
  var allTitlesNextUpdate = 0;

  // now retrieve the list of all titles for checking uniqueness
  function loadAllTitles() {
    var curtime = Date.now();
    if (allTitlesNextUpdate < curtime) {
      allTitlesNextUpdate = curtime + 5 * 60 * 1000; // update titles no less than 5 minutes from now
      fetch('/api/titles')
      .then(_.fetchJson)
      .then(function (titles) { allTitles = titles; })
      .catch(function (err) {
        console.error('problem getting paper titles');
        console.error(err);
      });
    }
  }

  var currentPaperOrigTitle;

  function checkTitleUnique(title) {
    if (title === '') throw null; // no message necessary
    if (title === 'new-paper' || title === 'new-metaanalysis') throw '"new-paper/new-metaanalysis" are reserved titles';
    if (!title.match(_.lettersAndNumbersRE)) throw 'paper short name cannot contain spaces or special characters';
    loadAllTitles();
    if (title !== currentPaperOrigTitle && allTitles.indexOf(title) !== -1) {
      // try to give a useful suggestion for common names like Juliet94a
      var match = title.match(/(^[a-zA-Z0-9]*[0-9]+)([a-zA-Z]?)$/);
      if (match) {
        var suggestion = match[1];
        var postfix = 97; // 97 is 'a'; 123 is beyond 'z'
        while (allTitles.indexOf(suggestion+String.fromCharCode(postfix)) > -1 && postfix < 123) postfix++;
        if (postfix < 123) throw 'try ' + suggestion + String.fromCharCode(postfix) + ', "' + title + '" is already used';
      }

      // otherwise just say this
      throw 'paper "' + title + '" already exists, please try a different short name';
    }
    return title;
  }

  function checkExperimentTitle(title) {
    if (title === '') throw null; // no message necessary
    if (!title.match(_.lettersAndNumbersRE)) throw 'only characters and digits';
    return title;
  }

  function checkColTitle(title) {
    if (title === '') throw null; // no message necessary
    return title;
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
  function checkToPreventSaving() {
    return _.findEl('#paper.savingerror') || _.findEl('#paper.validationerror') || _.findEl('#paper.unsaved');
  }

  // don't save at all when a validation error is there
  function checkToPreventForcedSaving() {
    return _.findEl('#paper.validationerror') || _.findEl('#paper.unsaved');
  }

  var savePendingInterval = null;
  var savePendingStart = 0;

  function savePendingStarted() {
    _.addClass('#paper', 'savepending');

    // every 60s update the screen to say something like "it's been minutes without saving, take a break!"
    savePendingStart = Date.now();
    savePendingInterval = setInterval(savePendingTick, 60000);
  }

  function savePendingTick() {
    // todo put a message in the page somewhere - like "will be saved soon... (3m without saving)"
    // console.log('save pending since ' + Math.round((Date.now()-savePendingStart)/1000) + 's');
  }

  function savePendingStopped() {
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

  function saveStarted() {
    _.removeClass('#paper', 'savingerror');
    _.addClass('#paper', 'saving');
  }

  function saveStopped() {
    _.removeClass('#paper', 'saving');
    _.removeClass('#paper', 'editing-disabled-by-saving');
  }

  function saveError() {
    _.addClass('#paper', 'savingerror');
    _.removeClass('#paper', 'saving');
  }

  function savePaper() {
    var self = this;
    return lima.getGapiIDToken()
      .then(function(idToken) {
        var toSend;
        if (self.new) {
          var oldId = self.id;
          delete self.id;
          toSend = JSON.stringify(self);
          self.id = oldId;
        } else {
          toSend = JSON.stringify(self);
        }
        return fetch(self.apiurl, {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: toSend,
        });
      })
      .then(_.fetchJson)
      .then(function(paper) {
        return self.init(paper);
      })
      .then(lima.updateAfterPaperSave) // will be a no-op if the function is undefined
      .then(lima.updateView)
      .then(lima.updatePageURL)
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
    var colIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(colIndex)) return; // we don't know what to move

    if (!currentPaper.columns[colIndex]) return console.error('columns[' + colIndex + '] not found in columns!');
    var newPosition = findNextNonHiddenCol(colIndex, left, most);
    _.moveArrayElement(currentPaper.columns, colIndex, newPosition);
    moveResultsAfterCharacteristics(currentPaper);
    updatePaperView();
    _.scheduleSave(currentPaper);
  }

  function moveResultsAfterCharacteristics(paper) {
    // make sure result columns come after characteristics columns
    var firstResult = 0;
    for (var i = 0; i < paper.columns.length; i++) {
      if (typeof paper.columns[i] === 'string' && lima.columns[paper.columns[i]].type === 'characteristic') {
        _.moveArrayElement(paper.columns, i, firstResult);
        firstResult++;
      }
    }
  }

  /*
   * find where to move a columns from its current index;
   * `left` indicates direction; if `most`, move to the beginning (left) or end (right) of the columns list.
   */
  function findNextNonHiddenCol(currentIndex, left, most) {
    if (left) {
      if (most || currentIndex <= 0) return 0;
      currentIndex -= 1;
      while (isHiddenCol(currentPaper.columns[currentIndex]) && currentIndex > 0) {
        currentIndex -= 1;
      }
    } else {
      if (most) return currentPaper.columns.length - 1;
      currentIndex += 1;
      while (isHiddenCol(currentPaper.columns[currentIndex]) && currentIndex < currentPaper.columns.length - 1) {
        currentIndex += 1;
      }
    }
    return currentIndex;
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

    var colIndex = parseInt(_.findPrecendingEl(btn, 'div.popupbox').dataset.index);
    var colId = currentPaper.columns[colIndex];
    var col = lima.columns[colId];
    if (!col) {
      console.warn('changeColumnTypeConfirmOrCancel couldn\'t find column for id ' + colId);
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

  function isHiddenCol(colid) {
    return currentPaper.hiddenCols.indexOf(colid) !== -1;
  }

  function hideColumn(e) {
    var colIndex = parseInt(_.findPrecedingEl(e.target, 'div.popupbox').dataset.index);
    if (isNaN(colIndex)) return; // we don't know what to move

    if (typeof currentPaper.columns[colIndex] !== 'string') return console.error('columns[' + colIndex + '] not a string!');

    currentPaper.hiddenCols.push(currentPaper.columns[colIndex]);
    unpinPopupBox();
    updatePaperView();
    _.scheduleSave(currentPaper);
  }

  function deleteColumn() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doDeleteColumn, 0, this);
  }

  function doDeleteColumn(el) {
    var columnIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(columnIndex)) return; // we don't know what to move

    if (!currentPaper.columns[columnIndex]) return console.error('column[' + columnIndex + '] not found in columns!');
    currentPaper.columns.splice(columnIndex, 1);
    unpinPopupBox();
    updatePaperView();
    _.scheduleSave(currentPaper);
  }


  function addUnhideButton(colNode) {
    colNode.classList.add('lastcolumnhidden');
    _.addEventListener(colNode, '.unhide', 'click', unhideColumns);
  }

  // This function takes a colid to start counting back from in paper.columns.
  // It will unhide columns until a non-hidden column is found.
  // e.g. ['hidden0', 'col1', 'hidden2', 'hidden3', 'col4'].
  // Passing col1 will unhide hidden0, and passing col4 will unhide 2 and 3.
  function unhideColumns (e) {
    var index = parseInt(_.findEl(_.findPrecedingEl(e.target, 'th'), '.fullcolinfo.popupbox').dataset.index);

    // If we don't have a colIndex, it's the 'add column' button, so start at the end.
    if (isNaN(index)) {
      index = currentPaper.columns.length-1;
    } else {
      index -= 1;
    }

    for (var i = index; i >= 0; i--) {
      if (isHiddenCol(currentPaper.columns[i])) {
        _.removeFromArray(currentPaper.hiddenCols, currentPaper.columns[i]);
      } else {
        break;
      }
    }

    updatePaperView();
    _.scheduleSave(currentPaper);
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

  function trimmingSanitizer(val) { if (typeof val === 'string') return val.trim(); else return val; }

  function addOnInputUpdater(root, selector, property, validatorSanitizer, target, targetProp, onchange) {
    if (!(root instanceof Node)) {
      onchange = targetProp;
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
          if (onchange) onchange(el);
          _.scheduleSave(target);
        };
      } else {
        el.oninput = null;
      }
    });
  }

  function addConfirmedUpdater(root, selector, confirmselector, cancelselector, property, validatorSanitizer, target, targetProp, deleteFunction, onconfirm) {
    if (!(root instanceof Node)) {
      onconfirm = deleteFunction;
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
      if (onconfirm) onconfirm();
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
      box = getPopupBoxEl(box);
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
      var pinned = getPopupBoxEl();
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

  // returns the popup box element for the popup box with the specified ID,
  // or if no ID is given, the currently pinned popup box element
  function getPopupBoxEl(id) {
    if (!id) id = pinnedBox;
    return _.findEl('[data-boxid="' + id + '"]')
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

  function focusAnotherElementOnClick(ev) {
    var el = ev.currentTarget;

    // focus the right element - trying to find it inside the event target element, or progressively inside its ancestor elements
    var focusingSelector = el.dataset.focuses;
    var toFocus = null;
    while (el && !(toFocus = _.findEl(el, focusingSelector))) el = el.parentElement;

    focusElement(toFocus);
    _.putCursorAtEnd(toFocus);
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

  // moving between cells (esp. when editing) should work like excel: tab and enter, maybe with shift
  function moveBetweenDataCells(e) {
    var currentCell = getCurrentlyFocusedDataCell();
    if (!currentCell) return;

    if (e.keyCode == 9){ // tab
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        changeCurrentDataCell(currentCell, 'left');
      } else {
        changeCurrentDataCell(currentCell, 'right');
      }
    }
    if (e.keyCode == 13) { // enter
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        changeCurrentDataCell(currentCell, 'up');
      } else {
        changeCurrentDataCell(currentCell, 'down');
      }
    }
  }

  function getCurrentlyFocusedDataCell() {
    // the currently focused cell either has the popup box pinned, or it has the editing field focused
    var focusedEl = document.activeElement;
    if (focusedEl && _.findPrecedingEl(focusedEl, '.popupbox')) return null;

    if (!focusedEl ||
        !focusedEl.classList.contains('value') ||
        !focusedEl.classList.contains('editing')) {
      focusedEl = getPopupBoxEl();
    }

    var currentTD = _.findPrecedingEl(focusedEl, 'td');

    // check that we are in a table cell in the experiments table
    if (currentTD && _.findPrecedingEl(currentTD, 'table.experiments')) return currentTD;

    return null;
  }


  function changeCurrentDataCell(currentCell, direction) {
    if (!currentCell) return;

    var row;
    var index;
    switch (direction) {
    case 'up':
      row = currentCell.parentNode.previousElementSibling;
      index = currentCell.cellIndex;
      break;

    case 'down':
      row = currentCell.parentNode.nextElementSibling;
      index = currentCell.cellIndex;
      break;

    case 'left':
      row = currentCell.parentNode;
      index = currentCell.cellIndex-1;
      break;

    case 'right':
      row = currentCell.parentNode;
      index = currentCell.cellIndex+1;
      break;
    }
    focusDataCell(row, index);
  }

  function focusDataCell(rowEl, cellIndex) {
    var cell = rowEl.cells[cellIndex];
    if (cell) {
      var toFocus = _.findEl(cell, '.value.editing');
      if (toFocus) {
        if (document.activeElement) document.activeElement.blur();
        focusElement(toFocus);
        _.putCursorAtEnd(document.activeElement);
      }
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
  lima.requestPaper = requestPaper;

  lima.Paper = Paper;

  lima.initPapersJS = function () {
    lima.checkToPreventForcedSaving = checkToPreventForcedSaving;
    lima.checkToPreventLeaving = checkToPreventSaving;
    lima.checkToPreventSaving = checkToPreventSaving;
    lima.saveError = saveError;
    lima.savePendingStarted = savePendingStarted;
    lima.savePendingStopped = savePendingStopped;
    lima.saveStarted = saveStarted;
    lima.saveStopped = saveStopped;
    lima.updateAfterColumnSave = updateAfterColumnSave;
    lima.updatePageURL = updatePageURL;
    lima.updateView = updatePaperView;

    // for testing
    lima.pinPopupBox = pinPopupBox;
    lima.unpinPopupBox = unpinPopupBox;
    lima.assignDeepValue = assignDeepValue;
    lima.getDeepValue = getDeepValue;
    lima.getPaperTitles = function(){return allTitles;};
    lima.getCurrentPaper = function(){return currentPaper;};
    lima.savePendingMax = 0;
  }

  window._ = _;

})(window, document);
