(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  function extractMetaanalysisTitleFromUrl() {
    // the path of a page for a metaanalysis will be '/email/title/*',
    // so extract the 'title' portion here:

    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    return window.location.pathname.substring(start, window.location.pathname.indexOf('/', start));
  }

  function updatePageURL() {
    // the path of a page for a metaanalysis will be '/email/title/*',
    // so update the 'title' portion here from the current metaanalysis (in case the user changes the title)
    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    var rest = window.location.pathname.indexOf('/', start);

    var url = window.location.pathname.substring(0, start) + currentMetaanalysis.title;
    if (rest > -1) url += window.location.pathname.substring(rest);

    window.history.replaceState({}, currentMetaanalysis.title, url);

    if (currentMetaanalysis.apiurl) currentMetaanalysisUrl = currentMetaanalysis.apiurl;
  }

  function createPageURL(email, title) {
    return '/' + email + '/' + title;
  }


  /* meta-analysis list
   *
   *
   *   #    # ###### #####   ##           ##   #    #   ##   #      #   #  ####  #  ####     #      #  ####  #####
   *   ##  ## #        #    #  #         #  #  ##   #  #  #  #       # #  #      # #         #      # #        #
   *   # ## # #####    #   #    # ##### #    # # #  # #    # #        #    ####  #  ####     #      #  ####    #
   *   #    # #        #   ######       ###### #  # # ###### #        #        # #      #    #      #      #   #
   *   #    # #        #   #    #       #    # #   ## #    # #        #   #    # # #    #    #      # #    #   #
   *   #    # ######   #   #    #       #    # #    # #    # ######   #    ####  #  ####     ###### #  ####    #
   *
   *
   */

  function requestAndFillMetaanalysisList() {
    lima.getGapiIDToken()
    .then(function (idToken) {
      var email = lima.extractUserProfileEmailFromUrl();
      return fetch('/api/metaanalyses/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) return [];
      else return _.fetchJson(response);
    })
    .then(fillMetaanalysissList)
    .catch(function (err) {
      console.error("problem getting metaanalyses");
      console.error(err);
      _.apiFail();
    });
  }

  function fillMetaanalysissList(metaanalyses) {
    var list = _.findEl('.metaanalysis.list > ul');
    list.innerHTML = '';

    if (metaanalyses.length) {
      // todo sort
      metaanalyses.forEach(function (metaanalysis) {
        var li = _.cloneTemplate('metaanalysis-list-item-template');
        _.fillEls(li, '.name', metaanalysis.title);
        _.fillEls(li, '.published', metaanalysis.published);
        _.setProps(li, '.published', 'title', metaanalysis.published);
        _.fillEls(li, '.description', metaanalysis.description);
        _.setProps(li, '.description', 'title', metaanalysis.description);
        _.setProps(li, 'a.mainlink', 'href', metaanalysis.title);
        _.fillTags(li, '.tags', metaanalysis.tags);
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.cloneTemplate('empty-list-template'));
    }

    _.setYouOrName();
  }

  /* meta-analysis
   *
   *
   *   #    # ###### #####   ##           ##   #    #   ##   #      #   #  ####  #  ####
   *   ##  ## #        #    #  #         #  #  ##   #  #  #  #       # #  #      # #
   *   # ## # #####    #   #    # ##### #    # # #  # #    # #        #    ####  #  ####
   *   #    # #        #   ######       ###### #  # # ###### #        #        # #      #
   *   #    # #        #   #    #       #    # #   ## #    # #        #   #    # # #    #
   *   #    # ######   #   #    #       #    # #    # #    # ######   #    ####  #  ####
   *
   *
   */

  var currentMetaanalysisUrl, currentMetaanalysis;

  function requestAndFillMetaanalysis() {
    var email = lima.extractUserProfileEmailFromUrl();
    var title = lima.extractMetaanalysisTitleFromUrl();
    _.fillEls('#metaanalysis .title', title);

    // lima.getPapers(); // TODO: not yet implemented

    lima.getColumns() // todo getColumns could run in parallel with everything before updateMetaanalysisView
    .then(lima.getGapiIDToken)
    .then(function (idToken) {
      currentMetaanalysisUrl = '/api/metaanalyses/' + email + '/' + title;
      return fetch(currentMetaanalysisUrl, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(initMetaanalysis)
    .then(setCurrentMetaanalysis)
    .then(updateMetaanalysisView)
    .then(function() {
      _.removeClass('body', 'loading');
      lima.onSignInChange(updateMetaanalysisView);
    })
    .catch(function (err) {
      console.error("problem getting metaanalysis");
      console.error(err);
      throw _.apiFail();
    })
    .then(loadAllTitles); // ignoring any errors here
  }

  function Metaanalysis() {}
  Metaanalysis.prototype.save = saveMetaanalysis;
  Metaanalysis.prototype.init = initMetaanalysis;

  function updateAfterColumnSave() {
    // clean experiment data of new columns that got new ID when they were saved
    currentMetaanalysis.papers.forEach(function (paper) {
      paper.experiments.forEach(function (experiment) {
        if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
          var col = lima.columns[key];
          if (col && col.id !== key) {
            experiment.data[col.id] = experiment.data[key];
            delete experiment.data[key];
          }
        });
      });

      // don't clean columns the same way - in metaanalyses.js, we shouldn't be touching papers' columns
    });

    if (Array.isArray(currentMetaanalysis.columns)) currentMetaanalysis.columns.forEach(function (key, index) {
      var col = lima.columns[key];
      if (col && col.id !== key) {
        currentMetaanalysis.columns[index] = col.id;
      }
    });

    updateMetaanalysisView();
  }

  function initMetaanalysis(newMetaanalysis) {
    var self = this;
    if (!(self instanceof Metaanalysis)) self = new Metaanalysis();

    // clean all properties of this paper
    for (var prop in self) { if (self.hasOwnProperty(prop)) { delete self[prop]; } }

    // get data from the new paper
    Object.assign(self, newMetaanalysis);

    if (!Array.isArray(self.paperOrder)) self.paperOrder = [];
    if (!Array.isArray(self.papers)) self.papers = [];
    if (!Array.isArray(self.columns)) self.columns = [];
    if (!Array.isArray(self.hiddenCols)) self.hiddenCols = [];
    if (!Array.isArray(self.tags)) self.tags = [];
    if (!Array.isArray(self.aggregates)) self.aggregates = [];

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

    self.aggregates.forEach(function (aggr) {
      var parsed = lima.parseFormulaString(aggr.formula);
      if (parsed != null) {
        aggr.formulaName = parsed.formulaName;
        aggr.formulaParams = parsed.formulaParams;
      } else {
        aggr.formulaName = null;
        aggr.formulaParams = [];
      }
    });

    self.papers.forEach(function (paper, papIndex) {
      if (!(paper instanceof lima.Paper)) {
        self.papers[papIndex] = lima.Paper.prototype.init(paper);
      }
    });

    // Get all columns used across all papers, for now. Concat.
    self.papers.forEach(function (paper) {
      paper.columns.forEach(function (column) {
        if (self.columns.indexOf(column) === -1) {
          self.columns.push(column);
        }
      });
    });

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

  function setCurrentMetaanalysis(metaanalysis) {
    currentMetaanalysis = metaanalysis;
  }

  function updateMetaanalysisView() {
    if (!currentMetaanalysis) return;

    // check for papers that we don't have in paperOrder
    // those will be newly added papers that just got saved and now have an ID
    updatePaperOrder();

    fillMetaanalysis(currentMetaanalysis);

    // for a new metaanalysis, go to editing the title
    if (!currentMetaanalysis.id) focusFirstValidationError();
  }

  function updatePaperOrder() {
    currentMetaanalysis.papers.forEach(function(paper){
      if (paper.id && currentMetaanalysis.paperOrder.indexOf(paper.id) == -1) {
        currentMetaanalysis.paperOrder.push(paper.id);
        _.scheduleSave(currentMetaanalysis);
      }
    });
  }

  var startNewTag = null;
  var flashTag = null;
  var rebuildingDOM = false;

  function fillMetaanalysis(metaanalysis) {
    // cleanup
    var oldMetaanalysisEl = _.byId('metaanalysis');
    rebuildingDOM = true;
    if (oldMetaanalysisEl) oldMetaanalysisEl.parentElement.removeChild(oldMetaanalysisEl);
    rebuildingDOM = false;

    resetComputedDataSetters();

    if (!metaanalysis.id) {
      _.addClass('body', 'new');
      lima.toggleEditing(true);
    } else {
      _.removeClass('body', 'new');
    }

    var metaanalysisTemplate = _.byId('metaanalysis-template');
    var metaanalysisEl = _.cloneTemplate(metaanalysisTemplate).children[0];
    metaanalysisTemplate.parentElement.insertBefore(metaanalysisEl, metaanalysisTemplate);

    fillTags(metaanalysisEl, metaanalysis);
    fillMetaanalysisExperimentTable(metaanalysis);
    fillAggregateTable(metaanalysis);

    var ownURL = createPageURL(lima.getAuthenticatedUserEmail(), metaanalysis.title);
    _.setProps(metaanalysisEl, '.edityourcopy a', 'href', ownURL);

    _.fillEls(metaanalysisEl, '.title', metaanalysis.title);
    _.fillEls (metaanalysisEl, '.authors .value', metaanalysis.authors);
    _.fillEls (metaanalysisEl, '.published .value', metaanalysis.published);
    _.fillEls (metaanalysisEl, '.description .value', metaanalysis.description);
    _.fillEls (metaanalysisEl, '.enteredby .value', metaanalysis.enteredBy);
    _.setProps(metaanalysisEl, '.enteredby .value', 'href', '/' + metaanalysis.enteredBy + '/');
    _.fillEls (metaanalysisEl, '.ctime .value', _.formatDateTime(metaanalysis.ctime));
    _.fillEls (metaanalysisEl, '.mtime .value', _.formatDateTime(metaanalysis.mtime));

    _.setDataProps(metaanalysisEl, '.enteredby.needs-owner', 'owner', metaanalysis.enteredBy);

    addOnInputUpdater(metaanalysisEl, ".authors .value", 'textContent', identity, metaanalysis, 'authors');
    addOnInputUpdater(metaanalysisEl, ".published .value", 'textContent', identity, metaanalysis, 'published');
    addOnInputUpdater(metaanalysisEl, ".description .value", 'textContent', identity, metaanalysis, 'description');

    _.setDataProps('#metaanalysis .title.editing', 'origTitle', metaanalysis.title);
    addConfirmedUpdater('#metaanalysis .title.editing', '#metaanalysis .title + .titlerename', '#metaanalysis .title ~ * .titlerenamecancel', 'textContent', checkTitleUnique, metaanalysis, 'title');

    _.setYouOrName();

    // now that the metaanalysis is all there, install various general and specific event listeners
    _.addEventListener(metaanalysisEl, '[contenteditable].oneline', 'keydown', _.blurOnEnter);

    _.addEventListener(metaanalysisEl, '[data-focuses]', 'click', focusAnotherElementOnClick);

    _.addEventListener(metaanalysisEl, '.savingerror', 'click', _.manualSave);
    _.addEventListener(metaanalysisEl, '.validationerrormessage', 'click', focusFirstValidationError);
    _.addEventListener(metaanalysisEl, '.unsavedmessage', 'click', focusFirstUnsaved);

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

  function fillTags(metaanalysisEl, metaanalysis) {
    _.fillTags(metaanalysisEl, '.tags', metaanalysis.tags, flashTag); flashTag = null;

    // events for removing a tag
    _.findEls(metaanalysisEl, '.tags .tag + .removetag').forEach(function (btn) {
      btn.onclick = function () {
        // the .tag can be a previous sibling or an ancestor of the button, find it:
        var el = _.findPrecedingEl(btn, '.tag');
        if (el) {
          var text = el.textContent;
          var i = metaanalysis.tags.indexOf(text);
          if (i !== -1) {
            metaanalysis.tags.splice(i, 1);
            fillTags(metaanalysisEl, metaanalysis);
            _.scheduleSave(metaanalysis);
          } else {
            console.error('removing tag but can\'t find it: ' + text);
          }
        }
      }
    })
    // events for starting to add a tag
    var btn = _.findEl(metaanalysisEl, '.tags .new + .addtag');
    var newTagContainer = _.findEl(metaanalysisEl, '.tags .new');
    var newTag = _.findEl(metaanalysisEl, '.tags .new .tag');

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
          if (metaanalysis.tags.indexOf(text) === -1) {
            metaanalysis.tags.push(text);
            _.scheduleSave(metaanalysis);
          }
          flashTag = text;
          fillTags(metaanalysisEl, metaanalysis);
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
  function fillMetaanalysisExperimentTable(metaanalysis) {
    var papers = metaanalysis.papers;

    // hide the empty papers data table if the user can't edit it
    if (!papers.length) {
      _.addClass('#metaanalysis', 'no-data');
      _.addClass('#metaanalysis', 'no-papers');
    }
    if (!metaanalysis.columns.length) {
      _.addClass('#metaanalysis', 'no-data');
      _.addClass('#metaanalysis', 'no-columns');
    }

    var table = _.cloneTemplate('experiments-table-template');

    moveResultsAfterCharacteristics(metaanalysis);

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

    metaanalysis.columns.forEach(function (col, columnIndex) {
      if (typeof col !== 'object' && isHiddenCol(col)) {
        // Save the fact that we just hid a column, so the next non-hidden
        // column can behave differently (i.e show a arrow).
        lastColumnHidden = true;
        return;
      }

      var th;

      if (typeof col === 'object') {
        th = fillComputedColumnHeading(metaanalysis, col, columnIndex);
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

    papers.forEach(function(paper, papIndex) {
      paper.experiments.forEach(function (experiment, expIndex) {
        var tr = _.cloneTemplate('experiment-row-template').children[0];
        tableBodyNode.insertBefore(tr, addRowNode);

        _.fillEls(tr, '.paptitle', paper.title);

        // the "add a row" button needs to know what paper it's on
        tr.dataset.paperIndex = papIndex;

        var paperTitleEl = _.findEl(tr, '.papertitle');

        // in the first row for a paper, the paperTitle TH should have rowspan equal to the number of experiments
        // in other rows, the paperTitle TH is hidden by the CSS
        if (expIndex == 0) {
          var noExpInCurrPaper = papers[papIndex].experiments.length;
          paperTitleEl.rowSpan = noExpInCurrPaper;
          tr.classList.add('paperstart');

          fillTags(paperTitleEl, paper);

          _.fillEls (paperTitleEl, '.papreference .value', paper.reference);
          _.fillEls (paperTitleEl, '.papdescription .value', paper.description);
          _.fillEls (paperTitleEl, '.paplink .value', paper.link);
          _.setProps(paperTitleEl, '.paplink a.value', 'href', paper.link);
          _.fillEls (paperTitleEl, '.papdoi .value', paper.doi);
          _.setProps(paperTitleEl, '.papdoi a.value', 'href', function(el){return el.dataset.base + paper.doi});
          _.fillEls (paperTitleEl, '.papenteredby .value', paper.enteredBy);
          _.setProps(paperTitleEl, '.papenteredby .value', 'href', '/' + paper.enteredBy + '/');
          _.fillEls (paperTitleEl, '.papctime .value', _.formatDateTime(paper.ctime));
          _.fillEls (paperTitleEl, '.papmtime .value', _.formatDateTime(paper.mtime));

          _.setDataProps(paperTitleEl, '.papenteredby.needs-owner', 'owner', paper.enteredBy);

          addConfirmedUpdater(paperTitleEl, '.paplink span.editing', '.paplink button.confirm', '.paplink button.cancel', 'textContent', identity, paper, 'link');
          addConfirmedUpdater(paperTitleEl, '.papdoi span.editing', '.papdoi button.confirm', '.papdoi button.cancel', 'textContent', _.stripDOIPrefix, paper, 'doi');

          // workaround for chrome not focusing right
          // clicking on the placeholder 'doi' of an empty editable doi value focuses the element but doesn't react to subsequent key strokes
          _.addEventListener(paperTitleEl, '.paplink .value.editing', 'click', _.blurAndFocus);
          _.addEventListener(paperTitleEl, '.papdoi .value.editing', 'click', _.blurAndFocus);

          addOnInputUpdater(paperTitleEl, ".papreference .value", 'textContent', identity, paper, 'reference');
          addOnInputUpdater(paperTitleEl, ".papdescription .value", 'textContent', identity, paper, 'description');

          if (!paper.title) {
            _.addClass(tr, '.paptitle.editing', 'new');
            _.fillEls(tr, '.paptitle + .paptitlerename', 'confirm');
          } else {
            _.fillEls(tr, '.paptitle + .paptitlerename', 'rename');
          }

          _.setDataProps(tr, '.paptitle.editing', 'origTitle', paper.title);
          addConfirmedUpdater(tr, '.paptitle.editing', '.paptitle.editing + .paptitlerename', '.paptitle.editing ~ * .paprenamecancel', 'textContent', checkTitleUnique, paper, ['title'], deleteNewPaper);

          _.addEventListener(paperTitleEl, '.linkedit button.test', 'click', _.linkEditTest);
          _.addEventListener(paperTitleEl, '.linkedit button.test', 'mousedown', _.preventLinkEditBlur);
        }

        _.fillEls(tr, '.exptitle', experiment.title);
        _.fillEls(tr, '.popupbox .exptitle', experiment.title);
        _.fillEls(tr, '.expdescription', experiment.description);

        if (!experiment.title) {
          _.addClass(tr, '.exptitle.editing', 'new');
          _.fillEls(tr, '.exptitle + .exptitlerename', 'confirm');
        } else {
          _.fillEls(tr, '.exptitle + .exptitlerename', 'rename');
        }

        addOnInputUpdater(tr, ".expdescription.editing", 'textContent', identity, paper, ['experiments', expIndex, 'description']);

        _.setDataProps(tr, '.exptitle.editing', 'origTitle', experiment.title);
        addConfirmedUpdater(tr, '.exptitle.editing', '.exptitle + .exptitlerename', '.exptitle.editing ~ * .exprenamecancel', 'textContent', checkExperimentTitleUnique, paper, ['experiments', expIndex, 'title'], deleteNewExperiment);

        // Now we track paperinfo@<index> and experimentinfo@<paper>,<exp>
        setupPopupBoxPinning(tr, '.paperinfo.popupbox', papIndex);
        setupPopupBoxPinning(tr, '.experimentinfo.popupbox', papIndex+','+expIndex);

        metaanalysis.columns.forEach(function (col) {
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

            addOnInputUpdater(td, '.value', 'textContent', identity, paper, ['experiments', expIndex, 'data', col, 'value'], recalculateComputedData);

            var user = lima.getAuthenticatedUserEmail();
            _.fillEls (td, '.valenteredby', val && val.enteredBy || user);
            _.setProps(td, '.valenteredby', 'href', '/' + (val && val.enteredBy || user) + '/');
            _.fillEls (td, '.valctime', _.formatDateTime(val && val.ctime || Date.now()));

            setupPopupBoxPinning(td, '.datum.popupbox', papIndex + ',' + expIndex + ',' + col);

            // populate comments
            fillComments('comment-template', td, '.commentcount', '.datum.popupbox main', paper, ['experiments', expIndex, 'data', col, 'comments']);

            td.classList.add(lima.columns[col].type);
          } else {
            // computed column
            td.classList.add('computed');
            // todo computed from x and y

            addComputedDatumSetter(function() {
              var val = getDatumValue(col, expIndex, papIndex);

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
              var computedFrom ="";
              var formulaCount = col.formulaParams.length;
              for (var i = 0; i < formulaCount; i++) {
                var column = lima.columns[col.formulaParams[i]];
                computedFrom += column ? column.title : 'no column selected';
                if (i < formulaCount-2) { // more than one left
                  computedFrom += ", ";
                }
                else if (i == formulaCount-2) { // one more left..
                  computedFrom += " and ";
                }
              }
              _.fillEls(td,  '.computedfrom', computedFrom);
              _.fillEls(td, '.formula', lima.getFormulaOrAggregateLabelById(col.formulaName));
            });

            setupPopupBoxPinning(td, '.datum.popupbox', papIndex + ',' + expIndex + ',' + col.formula);

            td.classList.add('result');
          }

          if (col.new) {
            td.classList.add('newcol');
          }

        });
      });
    });

    _.addEventListener(table, 'tr:not(.add) .papertitle button.add', 'click', addExperimentRow);
    _.addEventListener(table, 'tr.add button.add', 'click', addPaperRow);

    _.addEventListener(table, 'th.add button.add', 'click', addExperimentColumn);
    _.addEventListener(table, 'th.add button.cancel', 'click', dismissAddExperimentColumn);
    _.addEventListener(table, 'th.add button.addnew', 'click', addNewExperimentColumn);
    _.addEventListener(table, 'th.add button.addcomp', 'click', addNewComputedColumn);

    var experimentsContainer = _.findEl('#metaanalysis .experiments');
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

    addConfirmedUpdater(th, '.coltitle.editing', '.coltitle ~ .coltitlerename', '.coltitle ~ * .colrenamecancel', 'textContent', checkColTitle, col, 'title', deleteNewColumn, function(){_.scheduleSave(currentMetaanalysis);});

    setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.id);

    _.addEventListener(th, '.coltype .switch', 'click', changeColumnType);
    _.addEventListener(th, '.coltypeconfirm button', 'click', changeColumnTypeConfirmOrCancel);

    _.setDataProps(th, '.needs-owner', 'owner', col.definedBy || user);

    return th;
  }

  function fillComputedColumnHeading(metaanalysis, col, columnIndex) {
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
      // we'll call setValidationErrorClass() in fillAggregateColumnsSelection

      // make sure formula columns array matches the number of expected parameters
      col.formulaParams.length = formula ? formula.parameters.length : 0;
      col.formula = lima.createFormulaString(col);

      // fill the columns selection
      fillFormulaColumnsSelection(currentMetaanalysis, col, th, formula);

      _.scheduleSave(metaanalysis);
      recalculateComputedData();
    };

    var formula = lima.getFormulaById(col.formulaName);
    fillFormulaColumnsSelection(currentMetaanalysis, col, th, formula);

    setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.formula);

    _.addEventListener(th, 'button.move', 'click', moveColumn);
    _.addEventListener(th, 'button.delete', 'click', deleteColumn);

    fillComments('comment-template', th, '.commentcount', '.fullcolinfo.popupbox main', metaanalysis, ['columns', columnIndex, 'comments']);

    return th;
  }

  function fillFormulaColumnsSelection(metaanalysis, col, computedColumnsOptionsEl, formula) {
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
      for (var j = 0; j < metaanalysis.columns.length; j++){
        var colId = metaanalysis.columns[j];
        var found = makeOption(colId, col, col.formulaParams[i], select);
        foundCurrentValue = foundCurrentValue || found;
      }

      // if the parameter is a computed value that isn't itself a column of the metaanalysis, add it as the last option
      if (!foundCurrentValue) {
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
          _.scheduleSave(metaanalysis);
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
    if (col.number !== undefined) retval += '<span>' + col.number + '. </span>';
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
      if (!col.formula) col.formula = lima.createFormulaString(col);
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

  function getDatumValue(col, expIndex, paperIndex) {
    if (typeof col === 'string' || expIndex != null) {
      return getExperimentsTableDatumValue(col, expIndex, paperIndex);
    } else if (col.formulaName) {
      return getAggregateDatumValue(col);
    }
  }

  function getAggregateDatumValue(aggregate) {
    if (!dataCache.aggr) dataCache.aggr = {};
    if (aggregate.formula in dataCache.aggr) {
      if (dataCache.aggr[aggregate.formula] === CIRCULAR_COMPUTATION_FLAG) {
        throw new Error('circular computation involving aggregate ' + aggregate.formula);
      }
      return dataCache.aggr[aggregate.formula];
    }

    dataCache.aggr[aggregate.formula] = CIRCULAR_COMPUTATION_FLAG;

    var inputs = [];
    var currentInputArray;

    var val;

    if (isColCompletelyDefined(aggregate)) {
      var formula = lima.getAggregateFormulaById(aggregate.formulaName);

      // compute the value
      // if anything here throws an exception, value cannot be computed
      for (var i=0; i<aggregate.formulaParams.length; i++) {
        currentInputArray = [];
        for (var paperIndex = 0; paperIndex < currentMetaanalysis.papers.length; paperIndex++) {
          for (var expIndex = 0; expIndex < currentMetaanalysis.papers[paperIndex].experiments.length; expIndex++) {
            currentInputArray.push(getDatumValue(aggregate.formulaParams[i], expIndex, paperIndex));
          }
        }
        inputs.push(currentInputArray);
      }

      val = formula.func.apply(null, inputs);
      dataCache.aggr[aggregate.formula] = val;
    }

    return val;
  }

  function getExperimentsTableDatumValue(colId, expIndex, paperIndex) {
    // check cache
    if (!dataCache.exp) dataCache.exp = {};
    var cacheId = typeof colId === 'string' ? colId : colId.formula;
    if (!(cacheId in dataCache.exp)) dataCache.exp[cacheId] = [];
    if (!(dataCache.exp[cacheId][paperIndex])) dataCache.exp[cacheId][paperIndex] = [];
    if (expIndex in dataCache.exp[cacheId][paperIndex]) {
      if (dataCache.exp[cacheId][paperIndex][expIndex] === CIRCULAR_COMPUTATION_FLAG) {
        throw new Error('circular computation involving col ' + cacheId);
      }
      return dataCache.exp[cacheId][paperIndex][expIndex];
    }

    dataCache.exp[cacheId][paperIndex][expIndex] = CIRCULAR_COMPUTATION_FLAG;

    var val = null;
    var paper = currentMetaanalysis.papers[paperIndex];
    if (typeof colId === 'string') {
      // not a computed column
      if (paper.experiments[expIndex] &&
          paper.experiments[expIndex].data &&
          paper.experiments[expIndex].data[colId] &&
          paper.experiments[expIndex].data[colId].value != null) {
        val = paper.experiments[expIndex].data[colId].value;
      }
    } else {
      // computed column
      var col = colId;
      var inputs = [];

      if (isColCompletelyDefined(col)) {
        var formula = lima.getFormulaById(colId.formulaName);

        // compute the value
        // if anything here throws an exception, value cannot be computed
        for (var i=0; i<col.formulaParams.length; i++) {
          inputs.push(getDatumValue(col.formulaParams[i], expIndex, paperIndex));
        }

        val = formula.func.apply(null, inputs);
      }

      // if the result is NaN but some of the inputs were empty, change the result to empty.
      if (typeof val == 'number' && isNaN(val)) {
        if (inputs.some(function (x) { return x == null || x === ''; })) val = null;
      }
    }

    dataCache.exp[cacheId][paperIndex][expIndex] = val;
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
    // if there are no pending changes and if the metaanalysis has any data, add a new column to the metaanalysis
    if (lima.checkToPreventForcedSaving()) {
      console.warn('cannot add a column with some edited values pending');
      return;
    }

    // show the add column box
    _.addClass('#metaanalysis table.experiments tr:first-child th.add', 'adding');
    _.addClass('body', 'addnewcolumn');

    lima.getColumns()
    .then(populateAddColumnsList);
  }

  function dismissAddExperimentColumn() {
    _.removeClass('#metaanalysis table.experiments tr:first-child th.add', 'adding');
    _.removeClass('body', 'addnewcolumn');
  }

  function populateAddColumnsList(columns) {
    var list = _.findEl('#metaanalysis table.experiments tr:first-child th.add .addcolumnbox > ul');
    list.innerHTML='';
    var user = lima.getAuthenticatedUserEmail();
    var ordered = {yours: { result: [], characteristic: []},
                   other: { result: [], characteristic: []},
                   already: { result: [], characteristic: []}
                  };
    Object.keys(columns).forEach(function(colId) {
      var col = columns[colId];
      var bucket = (col.definedBy === user || !col.definedBy) ? 'yours' : 'other';
      if (currentMetaanalysis.columns.indexOf(colId) > -1) bucket = 'already';
      ordered[bucket][col.type].push(col);
    })
    ordered.yours.result.sort(compareColumnsByAuthorAndTitle);
    ordered.yours.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.other.result.sort(compareColumnsByAuthorAndTitle);
    ordered.other.characteristic.sort(compareColumnsByAuthorAndTitle);
    ordered.already.result.sort(compareColumnsByAuthorAndTitle);
    ordered.already.characteristic.sort(compareColumnsByAuthorAndTitle);

    // todo add collapsing of these blocks on clicking the header
    var usedInTheMetaanalysis = [].concat(
      ordered.already.characteristic,
      ordered.already.result);
    addColumnsBlock(list, 'your characteristic/moderator columns:', ordered.yours.characteristic);
    addColumnsBlock(list, 'your result columns:', ordered.yours.result);
    addColumnsBlock(list, 'characteristic/moderator columns:', ordered.other.characteristic);
    addColumnsBlock(list, 'result columns:', ordered.other.result);
    addColumnsBlock(list, 'columns used in the meta-analysis:', usedInTheMetaanalysis);

    _.removeClass('#metaanalysis table.experiments tr:first-child th.add .addcolumnbox.loading', 'loading');
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

      if (currentMetaanalysis.columns.indexOf(col.id) > -1) {
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
    _.fillEls('#metaanalysis th.add .colinfo .coltitle', col.title);
    _.fillEls('#metaanalysis th.add .colinfo .coldescription', col.description);
    _.fillEls('#metaanalysis th.add .colinfo .colctime .value', _.formatDateTime(col.ctime));
    _.fillEls('#metaanalysis th.add .colinfo .colmtime .value', _.formatDateTime(col.mtime));
    _.fillEls('#metaanalysis th.add .colinfo .definedby .value', col.definedBy);
    _.setProps('#metaanalysis th.add .colinfo .definedby .value', 'href', '/' + col.definedBy + '/');
    _.setDataProps('#metaanalysis th.add .colinfo .needs-owner', 'owner', col.definedBy);

    lima.columnTypes.forEach(function (type) {
      _.removeClass('#metaanalysis th.add .colinfo .coltype', type);
    });
    _.addClass('#metaanalysis th.add .colinfo .coltype', col.type);

    _.removeClass('#metaanalysis th.add .colinfo', 'unpopulated');

    if (currentMetaanalysis.columns.indexOf(col.id) > -1) {
      _.addClass('#metaanalysis th.add .colinfo', 'alreadythere');
    } else {
      _.removeClass('#metaanalysis th.add .colinfo', 'alreadythere');
    }

    _.setYouOrName();
  }

  function emptyColInfo() {
    _.addClass('#metaanalysis th.add .colinfo', 'unpopulated');
  }

  function selectNewColumn(ev) {
    var el = ev.target;
    while (el && !el.dataset.colid) el = el.parentElement;
    var col = lima.columns[el.dataset.colid];
    if (!col) {
      console.warn('selectNewColumn on element that doesn\'t have a valid column ID: ' + ev.target.dataset.colid);
      return;
    }
    if (currentMetaanalysis.columns.indexOf(col.id) > -1) return; // do nothing on columns that are already there
    // todo this will change when un-hiding a column

    currentMetaanalysis.columns.push(col.id);
    moveResultsAfterCharacteristics(currentMetaanalysis);
    dismissAddExperimentColumn();
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);

    // the click will popup the wrong box, so delay popping up the right one until after the click is fully handled
    setTimeout(pinPopupBox, 0, 'fullcolinfo@' + el.dataset.colid);
  }

  function addNewExperimentColumn() {
    dismissAddExperimentColumn();
    var col = lima.newColumn();
    currentMetaanalysis.columns.push(col.id);
    moveResultsAfterCharacteristics(currentMetaanalysis);
    updateMetaanalysisView();
    setTimeout(focusFirstValidationError, 0);
  }

  function addNewComputedColumn() {
    dismissAddExperimentColumn();
    var col = {
      formula: 'undefined()',
      formulaName: null,
      formulaParams: [],
    };
    currentMetaanalysis.columns.push(col);
    renumberComputedColumns(currentMetaanalysis.columns);
    updateMetaanalysisView();
    setTimeout(focusFirstValidationError, 0);
  }

  function deleteNewColumn() {
    unpinPopupBox();
    for (var i = 0; i < currentMetaanalysis.columns.length; i++) {
      var colId = currentMetaanalysis.columns[i];
      var col = lima.columns[colId];
      if (col.new && !col.title) {
        currentMetaanalysis.columns.splice(i, 1);
        moveResultsAfterCharacteristics(currentMetaanalysis);
        break;
      }
    }
    updateMetaanalysisView();
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

  function addExperimentRow(e) {
    // if there are no pending changes, add a new experiment
    if (!lima.checkToPreventForcedSaving()) {
      var parentTr = _.findPrecedingEl(e.target, "tr");
      var paperIndex = parseInt(parentTr.dataset.paperIndex);
      var paper = currentMetaanalysis.papers[paperIndex];
      if (!paper) return console.error('cannot find paper with index ' + paperIndex + ' for button ', e.target);

      if (!Array.isArray(paper.experiments)) paper.experiments = [];
      paper.experiments.push({});
      updateMetaanalysisView();
      // focus the empty title of the new experiment
      setTimeout(focusFirstValidationError, 0);
    } else {
      console.warn('cannot add a row with some edited values pending');
    }
  }

  function deleteNewPaper(el) {
    var parentTr = _.findPrecedingEl(el, "tr");
    var paperIndex = parseInt(parentTr.dataset.paperIndex);
    // we only want this to delete the last paper
    if (currentMetaanalysis.papers.length-1 != paperIndex) return;

    var paper = currentMetaanalysis.papers[paperIndex];
    // don't delete if the paper is already saved
    if (paper.id) return;

    // if the user has been able to add a second experiment, the paper is no longer empty.
    if (paper.experiments.length > 1) return;
    var experiment = paper.experiments[0];
    if (experiment && Object.keys(experiment).length !== 0) return;

    // safe to delete paper.
    currentMetaanalysis.papers.pop();
    unpinPopupBox();
    updateMetaanalysisView();
    setTimeout(focusFirstValidationError, 0);
  }

  function deleteNewExperiment(el) {
    if (!lima.checkToPreventForcedSaving()) {
      var parentTr = _.findPrecedingEl(el, "tr");
      var paperIndex = parseInt(parentTr.dataset.paperIndex);
      var paper = currentMetaanalysis.papers[paperIndex];
      if (!paper) return console.error('cannot find paper with index ' + paperIndex + ' for editing field ', el);

      if (!Array.isArray(paper.experiments)) return;
      var lastExp = paper.experiments[paper.experiments.length - 1];
      if (lastExp && Object.keys(lastExp).length === 0) {
        paper.experiments.pop();
      }
      unpinPopupBox();
      updateMetaanalysisView();
      setTimeout(focusFirstValidationError, 0);
    }
  }

  function addPaperRow() {
    lima.requestPaper('new-paper')
    .then(function (newPaper) {
      // Populate an empty experiment
      newPaper.experiments.push({});
      // Fill in missing user information
      currentMetaanalysis.papers.push(newPaper);
      updateMetaanalysisView();
      setTimeout(focusFirstValidationError, 0);
    });
  }

  /* aggregates
   *
   *
   *     ##    ####   ####  #####  ######  ####    ##   ##### ######  ####
   *    #  #  #    # #    # #    # #      #    #  #  #    #   #      #
   *   #    # #      #      #    # #####  #      #    #   #   #####   ####
   *   ###### #  ### #  ### #####  #      #  ### ######   #   #           #
   *   #    # #    # #    # #   #  #      #    # #    #   #   #      #    #
   *   #    #  ####   ####  #    # ######  ####  #    #   #   ######  ####
   *
   *
   */
  function fillAggregateTable(metaanalysis) {
    var table = _.cloneTemplate('aggregates-table-template');
    var addAggregateNode = _.findEl(table, 'tr.add');

    metaanalysis.aggregates.forEach(function (aggregate, aggregateIndex) {
      var aggregateEl = _.cloneTemplate('aggregate-row-template').children[0];
      addAggregateNode.parentElement.insertBefore(aggregateEl, addAggregateNode);

      var aggregateValTd = _.findEl(aggregateEl, 'td');
      // Editing Options
      // Add an option for every aggregate formula we know
      var aggregateFormulas = lima.listAggregateFormulas();
      var aggregateFormulasDropdown = _.findEl(aggregateEl, 'select.aggregateformulas')
      for (var i = 0; i < aggregateFormulas.length; i++){
        var el = document.createElement("option");
        el.textContent = aggregateFormulas[i].label;
        el.value = aggregateFormulas[i].id;
        if (aggregate.formulaName === el.value) {
          el.selected = true;
          aggregateFormulasDropdown.classList.remove('validationerror');
        }
        aggregateFormulasDropdown.appendChild(el);
      }

      aggregateFormulasDropdown.onchange = function(e) {
        aggregate.formulaName = e.target.value;
        aggregate.formula = lima.createFormulaString(aggregate);

        var formula = lima.getAggregateFormulaById(aggregate.formulaName);
        if (formula) {
          aggregateFormulasDropdown.classList.remove('validationerror');
        } else {
          aggregateFormulasDropdown.classList.add('validationerror');
        }
        // we'll call setValidationErrorClass() in fillAggregateColumnsSelection

        // make sure formula columns array matches the number of expected parameters
        aggregate.formulaParams.length = formula ? formula.parameters.length : 0;

        // fill in the current formula
        _.fillEls(aggregateEl, '.formula', formula ? formula.label : 'error'); // the 'error' string should not be visible

        // fill the columns selection
        fillAggregateColumnsSelection(metaanalysis, aggregate, aggregateEl, formula);

        _.scheduleSave(metaanalysis);
        recalculateComputedData();
      };

      var aggrFormula = lima.getAggregateFormulaById(aggregate.formulaName);
      fillAggregateColumnsSelection(metaanalysis, aggregate, aggregateEl, aggrFormula);

      setupPopupBoxPinning(aggregateEl, '.datum.popupbox', aggregate.formula);
      _.setDataProps(aggregateEl, '.datum.popupbox', 'index', aggregateIndex);

      _.addEventListener(aggregateEl, 'button.move', 'click', moveAggregate);
      _.addEventListener(aggregateEl, 'button.delete', 'click', deleteAggregate);

      addComputedDatumSetter(function() {
        var val = getDatumValue(aggregate);

        // handle bad values like Excel
        if (val == null) {
          val = '';
          aggregateValTd.classList.add('empty');
        } else if (typeof val == 'number' && isNaN(val)) {
          val = '#VALUE!';
          aggregateValTd.classList.add('empty');
        } else {
          aggregateValTd.classList.remove('empty');
        }

        // only show three significant digits for numbers
        if (typeof val == 'number') val = val.toPrecision(3);

        _.fillEls(aggregateValTd, '.value', val);
      });

      fillAggregateInformation(aggregateEl, aggregate);
      fillComments('comment-template', aggregateValTd, '.commentcount', '.datum.popupbox main', metaanalysis, ['aggregates', aggregateIndex, 'comments']);
    });

    // Event handlers
    _.addEventListener(table, 'tr.add button.add', 'click', addNewAggregateToMetaanalysis);

    var aggregatesContainer = _.findEl('#metaanalysis .aggregates');
    aggregatesContainer.appendChild(table);
  }

  function fillAggregateInformation(aggregateEl, aggregate) {
    _.setProps(aggregateEl, '.richaggrlabel', 'innerHTML', getColTitle(aggregate, 1));
    _.setProps(aggregateEl, '.fullaggrlabel', 'innerHTML', getColTitle(aggregate, Infinity));
    // todo something for the non-editing case
  }

  function fillAggregateColumnsSelection(metaanalysis, aggregate, aggregateEl, formula) {
    // editing drop-down boxes for parameter columns
    var aggregateColumnsSelectionEl = _.findEl(aggregateEl, '.aggregatecolumnsselection');
    // clear out old children.
    aggregateColumnsSelectionEl.innerHTML = '';

    if (!formula) return;

    var noOfParams = formula.parameters.length;

    for (var i = 0; i < noOfParams; i++){
      // Make a select dropdown
      var label = document.createElement('label');
      label.textContent = formula.parameters[i] + ': ';
      aggregateColumnsSelectionEl.appendChild(label);

      var select = document.createElement("select");
      label.appendChild(select);

      // the first option is an instruction
      var op = document.createElement("option");
      op.textContent = 'Select a column';
      op.value = '';
      select.appendChild(op);
      select.classList.add('validationerror');

      // Now make an option for each column in metaanalysis
      for (var j = 0; j < metaanalysis.columns.length; j++){
        var colId = metaanalysis.columns[j];

        var el = document.createElement("option");

        el.innerHTML = getColTitle(colId);
        el.value = getColIdentifier(colId);

        if (getColIdentifier(aggregate.formulaParams[i]) === el.value) {
          el.selected = true;
          select.classList.remove('validationerror');
        }
        setValidationErrorClass();
        select.appendChild(el);
      }

      // listen to changes of the dropdown box
      // preserve the value of i inside this code
      (function(i, select){
        select.onchange = function(e) {
          aggregate.formulaParams[i] = e.target.value;
          aggregate.formula = lima.createFormulaString(aggregate);
          if (e.target.value) {
            select.classList.remove('validationerror');
          } else {
            select.classList.add('validationerror');
          }
          setValidationErrorClass();
          _.scheduleSave(metaanalysis);
          fillAggregateInformation(aggregateEl, aggregate);
          recalculateComputedData();
        };
      })(i, select);

    }

    fillAggregateInformation(aggregateEl, aggregate);
  }

  function addNewAggregateToMetaanalysis() {
    var aggregate = {formulaName: null, formulaParams: []};
    aggregate.formula = lima.createFormulaString(aggregate);
    currentMetaanalysis.aggregates.push(aggregate);
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
    setTimeout(focusFirstValidationError, 0);
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

  function fillComments(templateId, root, countSelector, textSelector, metaanalyses, commentsPropPath) {
    var comments = getDeepValue(metaanalyses, commentsPropPath) || [];

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

      addOnInputUpdater(el, '.text', 'textContent', identity, metaanalyses, commentsPropPath.concat(i, 'text'));
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
        var comments = getDeepValue(metaanalyses, commentsPropPath, []);
        comments.push({ text: text });
        fillComments(templateId, root, countSelector, textSelector, metaanalyses, commentsPropPath);
        _.setYouOrName(); // the new comment needs to be marked as "yours" so you can edit it
        _.scheduleSave(metaanalyses);
      }
    });

    // cancel
    _.addEventListener(root, '.comment.new .buttons .cancel', 'click', function() {
      newComment.textContent = '';
      newComment.oninput();
    });
  }

  var allTitles = [];
  var titlesNextUpdate = 0;

  // now retrieve the list of all titles for checking uniqueness
  function loadAllTitles() {
    var curtime = Date.now();
    if (titlesNextUpdate < curtime) {
      titlesNextUpdate = curtime + 5 * 60 * 1000; // update titles no less than 5 minutes from now
      fetch('/api/titles')
      .then(_.fetchJson)
      .then(function (titles) { allTitles = titles; })
      .catch(function (err) {
        console.error('problem getting metaanalysis titles');
        console.error(err);
      });
    }
  }

  // todo this should be shared with papers.js in tools.js
  function checkTitleUnique(title, el) {
    if (title === '') throw null; // no message necessary
    if (title === 'paper' || title === 'metaanalysis') throw '"paper/metaanalysis" are reserved titles';
    if (!title.match(/^[a-zA-Z0-9.-]+$/)) throw 'metaanalysis short name cannot contain spaces or special characters';
    loadAllTitles();
    if (title !== el.dataset.origTitle && allTitles.indexOf(title) !== -1) {
      // try to give a useful suggestion for common names like Juliet94a
      var match = title.match(/(^[a-zA-Z0-9]*[0-9]+)([a-zA-Z]?)$/);
      if (match) {
        var suggestion = match[1];
        var postfix = 97; // 97 is 'a'; 123 is beyond 'z'
        while (allTitles.indexOf(suggestion+String.fromCharCode(postfix)) > -1 && postfix < 123) postfix++;
        if (postfix < 123) throw 'try ' + suggestion + String.fromCharCode(postfix) + ', "' + title + '" is already used';
      }

      // otherwise just say this
      throw '"' + title + '" already exists, please try a different short name';
    }
    return title;
  }

  function checkExperimentTitleUnique(title, editingEl) {
    if (title === '') throw null; // no message necessary
    if (!title.match(/^[a-zA-Z0-9.-]+$/)) throw 'only characters and digits';
    var titles = currentMetaanalysis.papers.map(function(paper){paper.experiments.map(function (exp) { return paper.title+'-'+exp.title; })});

    if (title !== editingEl.dataset.origTitle && titles.indexOf(title) !== -1) {
      throw 'must be unique';
    }
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
    return _.findEl('#metaanalysis.savingerror') || _.findEl('#metaanalysis.validationerror') || _.findEl('#metaanalysis.unsaved');
  }

  // don't save at all when a validation error is there
  function checkToPreventForcedSaving() {
    return _.findEl('#metaanalysis.validationerror') || _.findEl('#metaanalysis.unsaved');
  }

  var savePendingInterval = null;
  var savePendingStart = 0;

  function savePendingStarted() {
    _.addClass('#metaanalysis', 'savepending');

    // every 60s update the screen to say something like "it's been minutes without saving, take a break!"
    savePendingStart = Date.now();
    savePendingInterval = setInterval(savePendingTick, 60000);
  }

  function savePendingTick() {
    // todo put a message in the page somewhere - like "will be saved soon... (3m without saving)"
    // console.log('save pending since ' + Math.round((Date.now()-savePendingStart)/1000) + 's');
  }

  function savePendingStopped() {
    _.removeClass('#metaanalysis', 'savepending');

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
    _.removeClass('#metaanalysis', 'savingerror');
    _.addClass('#metaanalysis', 'saving');
  }

  function saveStopped() {
    _.removeClass('#metaanalysis', 'saving');
    _.removeClass('#metaanalysis', 'editing-disabled-by-saving');
  }

  function saveError() {
    _.addClass('#metaanalysis', 'savingerror');
    _.removeClass('#metaanalysis', 'saving');
  }

  function saveMetaanalysis() {
    var self = this;
    return lima.getGapiIDToken()
      .then(function(idToken) {
        return fetch(currentMetaanalysisUrl, {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: JSON.stringify(currentMetaanalysis),
        });
      })
      .then(_.fetchJson)
      .then(function(metaanalysis) {
        if (!metaanalysis.papers) metaanalysis.papers = currentMetaanalysis.papers;
        return metaanalysis;
      })
      .then(function (metaanalysis) {
        return self.init(metaanalysis);
      })
      .then(lima.updateView)
      .then(lima.updatePageURL)
      .catch(function(err) {
        console.error('error saving metaanalysis');
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
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doMoveColumn, 0, this);
  }

  function doMoveColumn(el) {
    var left = el.classList.contains('left');
    var most = el.classList.contains('most');
    var colIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(colIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.columns[colIndex]) return console.error('columns[' + colIndex + '] not found in columns!');
    var newPosition = findNextNonHiddenCol(colIndex, left, most);
    _.moveArrayElement(currentMetaanalysis.columns, colIndex, newPosition);
    moveResultsAfterCharacteristics(currentMetaanalysis);
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }

  function moveResultsAfterCharacteristics(metaanalysis) {
    // make sure result columns come after characteristics columns
    var firstResult = 0;
    for (var i = 0; i < metaanalysis.columns.length; i++) {
      if (typeof metaanalysis.columns[i] === 'string' && lima.columns[metaanalysis.columns[i]].type === 'characteristic') {
        _.moveArrayElement(metaanalysis.columns, i, firstResult);
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
      while (isHiddenCol(currentMetaanalysis.columns[currentIndex]) && currentIndex > 0) {
        currentIndex -= 1;
      }
    } else {
      if (most) return currentMetaanalysis.columns.length - 1;
      currentIndex += 1;
      while (isHiddenCol(currentMetaanalysis.columns[currentIndex]) && currentIndex < currentMetaanalysis.columns.length - 1) {
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
    // this timeout makes sure the click gets processed first and then we do the change
    setTimeout(doChangeColumnTypeConfirmOrCancel, 0, ev.target);
  }

  function doChangeColumnTypeConfirmOrCancel(btn) {
    // find the element with the class 'coltype' before the button
    var coltypeEl = _.findPrecedingEl(btn, '.coltype');

    if (!coltypeEl) {
      console.warn('changeColumnTypeConfirmOrCancel called on a button before which there is no .coltype');
      return;
    }

    var colIndex = parseInt(_.findPrecedingEl(btn, 'div.popupbox').dataset.index);
    var colId = currentMetaanalysis.columns[colIndex];
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
      moveResultsAfterCharacteristics(currentMetaanalysis);
      updateMetaanalysisView();
      _.scheduleSave(col);
    }
  }

  function isHiddenCol(colid) {
    return currentMetaanalysis.hiddenCols.indexOf(colid) !== -1;
  }

  function hideColumn(e) {
    var colIndex = parseInt(_.findPrecedingEl(e.target, 'div.popupbox').dataset.index);
    if (isNaN(colIndex)) return; // we don't know what to move

    if (typeof currentMetaanalysis.columns[colIndex] !== 'string') return console.error('columns[' + colIndex + '] not a string!');

    currentMetaanalysis.hiddenCols.push(currentMetaanalysis.columns[colIndex]);
    unpinPopupBox();
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }

  function deleteColumn() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doDeleteColumn, 0, this);
  }

  function doDeleteColumn(el) {
    var columnIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(columnIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.columns[columnIndex]) return console.error('column[' + columnIndex + '] not found in columns!');
    currentMetaanalysis.columns.splice(columnIndex, 1);
    unpinPopupBox();
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }


  function addUnhideButton(colNode) {
    colNode.classList.add('lastcolumnhidden');
    _.addEventListener(colNode, '.unhide', 'click', unhideColumns);
  }

  // This function takes a colid to start counting back from in metaanalysis.columns.
  // It will unhide columns until a non-hidden column is found.
  // e.g. ['hidden0', 'col1', 'hidden2', 'hidden3', 'col4'].
  // Passing col1 will unhide hidden0, and passing col4 will unhide 2 and 3.
  function unhideColumns (e) {
    var index = parseInt(_.findEl(_.findPrecedingEl(e.target, 'th'), '.fullcolinfo.popupbox').dataset.index);

    // If we don't have a colId, it's the 'add column' button, so start at the end.
    if (isNaN(index)) {
      index = currentMetaanalysis.columns.length-1;
    } else {
      index -= 1;
    }

    for (var i = index; i >= 0; i--) {
      if (isHiddenCol(currentMetaanalysis.columns[i])) {
        _.removeFromArray(currentMetaanalysis.hiddenCols, currentMetaanalysis.columns[i]);
      } else {
        break;
      }
    }

    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }

  /* changing aggregates
   *
   *
   *    ####  #    #   ##   #    #  ####  # #    #  ####       ##    ####   ####  #####  ######  ####    ##   ##### ######  ####
   *   #    # #    #  #  #  ##   # #    # # ##   # #    #     #  #  #    # #    # #    # #      #    #  #  #    #   #      #
   *   #      ###### #    # # #  # #      # # #  # #         #    # #      #      #    # #####  #      #    #   #   #####   ####
   *   #      #    # ###### #  # # #  ### # #  # # #  ###    ###### #  ### #  ### #####  #      #  ### ######   #   #           #
   *   #    # #    # #    # #   ## #    # # #   ## #    #    #    # #    # #    # #   #  #      #    # #    #   #   #      #    #
   *    ####  #    # #    # #    #  ####  # #    #  ####     #    #  ####   ####  #    # ######  ####  #    #   #   ######  ####
   *
   *
   */


  function moveAggregate() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doMoveAggregate, 0, this);
  }

  function doMoveAggregate(el) {
    var up = el.classList.contains('up');
    var most = el.classList.contains('most');
    var aggregateIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(aggregateIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.aggregates[aggregateIndex]) return console.error('aggregate[' + aggregateIndex + '] not found in aggregates!');
    var newPosition = findNextAggr(aggregateIndex, up, most);
    _.moveArrayElement(currentMetaanalysis.aggregates, aggregateIndex, newPosition);
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }

  /*
   * find where to move an aggregate from its current index;
   * `up` indicates direction (up meaning left in array order); if `most`, move to the beginning (top) or end (bottom) of the aggregate list.
   */
  function findNextAggr(currentIndex, up, most) {
    if (up) {
      if (most || currentIndex <= 0) return 0;
      currentIndex -= 1;
    } else {
      if (most) return currentMetaanalysis.aggregates.length - 1;
      currentIndex += 1;
    }
    return currentIndex;
  }

  function deleteAggregate() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doDeleteAggregate, 0, this);
  }

  function doDeleteAggregate(el) {
    var aggregateIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(aggregateIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.aggregates[aggregateIndex]) return console.error('aggregate[' + aggregateIndex + '] not found in aggregates!');
    currentMetaanalysis.aggregates.splice(aggregateIndex, 1);
    unpinPopupBox();
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
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
      editingEl.oninput(true);
    }

    editingEl.onkeydown = function (ev) {
      if (ev.keyCode === 27) {
        if (editingEl.classList.contains('new') && deleteFunction) {
          editingEl.classList.remove('unsaved');
          editingEl.classList.remove('validationerror');
          setUnsavedClass();
          setValidationErrorClass();
          deleteFunction(editingEl);
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
      updateMetaanalysisView();
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
    if (_.findEl('#metaanalysis .validationerror')) _.addClass('#metaanalysis', 'validationerror');
    else _.removeClass('#metaanalysis', 'validationerror');
  }

  function setUnsavedClass() {
    if (_.findEl('#metaanalysis .unsaved')) _.addClass('#metaanalysis', 'unsaved');
    else _.removeClass('#metaanalysis', 'unsaved');
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
      _.addClass('#metaanalysis', 'editing-disabled-by-saving');
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
    return focusElement(_.findEl('#metaanalysis .unsaved'));
  }

  function focusFirstValidationError() {
    return focusElement(_.findEl('#metaanalysis .validationerror'));
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
  lima.extractMetaanalysisTitleFromUrl = extractMetaanalysisTitleFromUrl;
  lima.requestAndFillMetaanalysisList = requestAndFillMetaanalysisList;
  lima.requestAndFillMetaanalysis = requestAndFillMetaanalysis;

  lima.Metaanalysis = Metaanalysis;

  lima.initMetaanalysesJS = function () {
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
    lima.updateView = updateMetaanalysisView;

    // for testing
    lima.pinPopupBox = pinPopupBox;
    lima.unpinPopupBox = unpinPopupBox;
    lima.updateMetaanalysisView = updateMetaanalysisView;
    lima.assignDeepValue = assignDeepValue;
    lima.getDeepValue = getDeepValue;
    lima.getAllTitles = function(){return allTitles;};
    lima.getCurrentMetaanalysis = function(){return currentMetaanalysis;};
    lima.savePendingMax = 0;
  }

  window._ = _;

})(window, document);
