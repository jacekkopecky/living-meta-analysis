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
      throw _.apiFail();
    })
    .then(loadPaperTitles); // ignoring any errors here
  }

  function Paper() {}
  Paper.prototype.save = savePaper;

  function updatePaperView(paper) {
    if (!paper) paper = currentPaper;

    if (!(paper instanceof Paper)) {
      paper = Object.assign(new Paper(), paper);
    }

    var isSmallChange = currentPaper != null && paperChangeVerifiers.every(function (verifier) { return verifier(paper); });
    if (currentPaper !== paper) regenerateColumnOrder(paper);
    currentPaper = paper;
    if (!isSmallChange) fillPaper(paper);
    callPaperDOMSetters(paper);
  }

  var startNewTag = null;
  var flashTag = null;
  var fillingTags = false;

  function fillPaper(paper) {
    resetDOMSetters();

    // cleanup
    var oldPaperEl = _.byId('paper');
    if (oldPaperEl) oldPaperEl.parentElement.removeChild(oldPaperEl);

    var paperTemplate = _.byId('paper-template');
    var paperEl = _.cloneTemplate(paperTemplate);
    paperTemplate.parentElement.insertBefore(paperEl, paperTemplate);

    addPaperChangeVerifier(function (newPaper) { return paper.id === newPaper.id; });
    addPaperDOMSetter(function(paper) {
      _.fillEls('#paper .title:not(.unsaved):not(.validationerror)', paper.title);
      fillingTags = true; // because that causes onBlur on a new tag and that mustn't be a save
      _.fillTags('#paper .tags', paper.tags, flashTag); flashTag = null;
      fillingTags = false;
      _.fillEls ('#paper .authors .value', paper.authors);
      _.fillEls ('#paper .reference .value', paper.reference);
      _.fillEls ('#paper .description .value', paper.description);
      _.fillEls ('#paper .link .value:not(.unsaved):not(.validationerror)', paper.link);
      _.setProps('#paper .link a.value', 'href', paper.link);
      _.fillEls ('#paper .doi .value:not(.unsaved):not(.validationerror)', paper.doi);
      _.setProps('#paper .doi a.value', 'href', function(el){return el.dataset.base + paper.doi});
      _.fillEls ('#paper .enteredby .value', paper.enteredBy);
      _.setProps('#paper .enteredby .value', 'href', '/' + paper.enteredBy + '/');
      _.fillEls ('#paper .ctime .value', _.formatDateTime(paper.ctime));
      _.fillEls ('#paper .mtime .value', _.formatDateTime(paper.mtime));

      _.setDataProps('#paper .enteredby.needs-owner', 'owner', paper.enteredBy);

      addConfirmedUpdater('#paper .link span.editing', '#paper .link button.confirm', '#paper .link button.cancel', 'textContent', identity, paper, 'link');
      addConfirmedUpdater('#paper .doi span.editing', '#paper .doi button.confirm', '#paper .doi button.cancel', 'textContent', identity, paper, 'doi');

      addOnInputUpdater("#paper .authors .value", 'textContent', identity, paper, 'authors');
      addOnInputUpdater("#paper .reference .value", 'textContent', identity, paper, 'reference');
      addOnInputUpdater("#paper .description .value", 'textContent', identity, paper, 'description');

      currentPaperOrigTitle = paper.title;
      addConfirmedUpdater('#paper .title.editing', '#paper .title + .titlerename', '#paper .title ~ * .titlerenamecancel', 'textContent', checkPaperTitleUnique, paper, 'title');

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

      if (!paper.tags) paper.tags = [];

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
              _.scheduleSave(paper);
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
              _.scheduleSave(paper);
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
          else _.deferScheduledSave();
        }
      })

    });

    fillPaperExperimentTable(paper);

    _.removeClass('body', 'loading');

    addPaperDOMSetter(_.setYouOrName);

    // now that the paper is all there, install various general and specific event listeners
    _.addEventListener('[contenteditable].oneline', 'keydown', blurOnEnter);

    _.addEventListener('#paper .linkedit button.test', 'click', linkEditTest);
    _.addEventListener('#paper .linkedit button.test', 'mousedown', preventLinkEditBlur);

    _.addEventListener('#paper [data-focuses]', 'click', focusAnotherElementOnClick);

    _.addEventListener('#paper .savingerror', 'click', _.manualSave);
    _.addEventListener('#paper .validationerrormessage', 'click', focusFirstValidationError);
    _.addEventListener('#paper .unsavedmessage', 'click', focusFirstUnsaved);

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
      _.removeClass('#paper', 'no-data');
    } else {
      _.addClass('#paper', 'no-data');
    }

    var showColumns = findColumnsInPaper(paper);
    // when accessing showColumns members, need to do a lookup through lima.columns
    // because showColumns[i] may be a temporary ID of a new column, which gets renamed on save

    // a small change doesn't add/remove or change columns
    addPaperChangeVerifier(function (newPaper) {
      var newPaperShowColumns = findColumnsInPaper(newPaper);
      if (newPaperShowColumns.length !== showColumns.length) return false;

      for (var i = 0; i < showColumns.length; i++) {
        if (lima.columns[showColumns[i]].id !== newPaperShowColumns[i]) return false;
      }

      return true;
    });

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

    // fill column headings
    var headingsRowNode = _.findEl(table, 'tr:first-child');
    var addColumnNode = _.findEl(table, 'tr:first-child > th.add');
    showColumns.forEach(function (colId) {
      var th = _.cloneTemplate('col-heading-template').children[0];
      _.addEventListener(th, 'button.move', 'click', moveColumn);
      headingsRowNode.insertBefore(th, addColumnNode);
      addPaperDOMSetter(function () {
        var col = lima.columns[colId];
        // fix up colId in case it got updated by saving a new column
        colId = col.id;

        var user = lima.getAuthenticatedUserEmail();
        var curtime = Date.now();
        _.fillEls(th, '.coltitle:not(.unsaved):not(.validationerror)', col.title);
        _.fillEls(th, '.coldescription', col.description);
        _.fillEls(th, '.colctime .value', _.formatDateTime(col.ctime || curtime));
        _.fillEls(th, '.colmtime .value', _.formatDateTime(col.mtime || curtime));
        _.fillEls(th, '.definedby .value', col.definedBy || user);
        _.setProps(th, '.definedby .value', 'href', '/' + (col.definedBy || user) + '/');

        _.setDataProps(th, '.needs-owner', 'owner', col.definedBy || user);

        _.setDataProps(th, 'button', 'id', col.id);

        lima.columnTypes.forEach(function (type) {
          _.removeClass(th, '.coltype', type);
          th.classList.remove(type);
        });
        th.classList.add(col.type);
        _.addClass(th, '.coltype', col.type);

        if (col.new) {
          th.classList.add('newcol');
          _.addClass(th, '.coltype', 'newcol');
          _.setDataProps(th, '.coltype', 'id', col.id);
          _.fillEls(th, '.coltitle + .coltitlerename', 'confirm');
          _.addClass(th, '.coltitle.editing:not(.unsaved):not(.validationerror)', 'new');
        } else {
          th.classList.remove('newcol');
          _.removeClass(th, '.coltype', 'newcol');
          _.fillEls(th, '.coltitle + .coltitlerename', 'rename');
          _.removeClass(th, '.coltitle.editing:not(.unsaved):not(.validationerror)', 'new');
        }

        addOnInputUpdater(th, '.coldescription', 'textContent', identity, col, ['description']);

        addConfirmedUpdater(th, '.coltitle.editing', '.coltitle ~ .coltitlerename', '.coltitle ~ * .colrenamecancel', 'textContent', checkColTitle, col, 'title', deleteNewColumn);

        lima.columnTypes.forEach(function (type) {
          _.setDataProps(th, '.coltype .switch.type-' + type, 'newType', type);
        });

        setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.id);
      });

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

      addPaperDOMSetter(function (paper) {
        _.fillEls(tr, '.exptitle:not(.unsaved):not(.validationerror)', paper.experiments[expIndex].title);
        _.fillEls(tr, '.expdescription', paper.experiments[expIndex].description);

        if (!paper.experiments[expIndex].title) {
          _.addClass(tr, '.exptitle.editing:not(.unsaved):not(.validationerror)', 'new');
          _.fillEls(tr, '.exptitle + .exptitlerename', 'confirm');
        } else {
          _.removeClass(tr, '.exptitle.editing:not(.unsaved):not(.validationerror)', 'new');
          _.fillEls(tr, '.exptitle + .exptitlerename', 'rename');
        }

        addOnInputUpdater(tr, ".expdescription.editing", 'textContent', identity, paper, ['experiments', expIndex, 'description']);

        _.setDataProps(tr, '.exptitle.editing', 'origTitle', paper.experiments[expIndex].title);
        addConfirmedUpdater(tr, '.exptitle.editing', '.exptitle + .exptitlerename', null, 'textContent', checkExperimentTitleUnique, paper, ['experiments', expIndex, 'title'], deleteNewExperiment);

        setupPopupBoxPinning(tr, '.fullrowinfo.popupbox', expIndex);
      })

      showColumns.forEach(function (colId) {
        var td = _.cloneTemplate('experiment-datum-template').children[0];
        tr.appendChild(td);

        // populate the value
        addPaperDOMSetter(function (paper) {
          var col = lima.columns[colId];
          // fix up colId in case it got updated by saving a new column
          colId = col.id;

          var val = null;
          var experiment = paper.experiments[expIndex];
          if (experiment.data && experiment.data[colId]) {
            val = experiment.data[colId];
          }

          if (val && val.value != null) {
            td.classList.remove('empty');
          } else {
            td.classList.add('empty');
          }

          _.fillEls(td, '.value', val && val.value || '');
          addOnInputUpdater(td, '.value', 'textContent', identity, paper, ['experiments', expIndex, 'data', colId, 'value']);

          var user = lima.getAuthenticatedUserEmail();
          _.fillEls (td, '.valenteredby', val && val.enteredBy || user);
          _.setProps(td, '.valenteredby', 'href', '/' + (val && val.enteredBy || user) + '/');
          _.fillEls (td, '.valctime', _.formatDateTime(val && val.ctime || Date.now()));

          lima.columnTypes.forEach(function (type) {td.classList.remove(type);});
          td.classList.add(col.type);

          setupPopupBoxPinning(td, '.datum.popupbox', expIndex + '$' + colId);
        });

        // oldCommentsLength is a static snapshot of the size in case comments change underneath us by adding a comment
        var oldCommentsLength = 0;
        if (experiment.data && experiment.data[colId] && experiment.data[colId].comments) {
          oldCommentsLength = experiment.data[colId].comments.length;
        }
        addPaperChangeVerifier(function (newPaper) {
          // fix up colId in case it got updated by saving a new column
          colId = lima.columns[colId].id;

          var newComments = [];
          if (newPaper.experiments[expIndex].data && newPaper.experiments[expIndex].data[colId]) {
            newComments = newPaper.experiments[expIndex].data[colId].comments || [];
          }
          return oldCommentsLength === newComments.length;
        });

        // populate comments
        addPaperDOMSetter(function (newPaper) {
          var col = lima.columns[colId];
          // fix up colId in case it got updated by saving a new column
          colId = col.id;

          var newComments = [];
          if (newPaper.experiments[expIndex].data && newPaper.experiments[expIndex].data[colId]) {
            newComments = newPaper.experiments[expIndex].data[colId].comments || [];
          }

          if (newComments.length > 0) {
            td.classList.add('hascomments');
          } else {
            td.classList.remove('hascomments');
          }

          if (col.new) {
            td.classList.add('newcol');
          } else {
            td.classList.remove('newcol');
          }
          _.fillEls(td, '.commentcount', newComments.length);
        });

        fillComments('comment-template', td, '.datum.popupbox main', paper, ['experiments', expIndex, 'data', colId, 'comments']);
      });

    });

    // fill in the empty last row of the table
    showColumns.forEach(function (colId) {
      var td = document.createElement('td');
      addRowNode.appendChild(td);

      addPaperDOMSetter(function () {
        lima.columnTypes.forEach(function (type) {td.classList.remove(type);});
        td.classList.add(lima.columns[colId].type);
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

  function fillComments(templateId, root, selector, oldPaper, commentsPropPath) {
    var targetEl = _.findEl(root, selector);
    targetEl.innerHTML = '';
    var oldComments = getDeepValue(oldPaper, commentsPropPath) || [];
    for (var index = 0; index < oldComments.length; index++) {
      (function (index) {
        // inline function to save `index` and `el`
        var el = _.cloneTemplate(templateId).children[0];
        addPaperDOMSetter(function (paper) {
          var user = lima.getAuthenticatedUserEmail();
          var comments = getDeepValue(paper, commentsPropPath);
          var comment = comments[index];
          if (index === comments.length - 1) {
            _.setDataProps(el, '.needs-owner', 'owner', comment.by);
          } else {
            // this will disable editing of any comment but the last
            _.setDataProps(el, '.needs-owner', 'owner', '');
          }
          _.fillEls(el, '.commentnumber', index+1);
          _.fillEls(el, '.by', comment.by || user);
          _.setProps(el, '.by', 'href', '/' + (comment.by || user) + '/');
          _.fillEls(el, '.ctime', _.formatDateTime(comment.ctime || Date.now()));
          _.fillEls(el, '.text', comment.text);

          addOnInputUpdater(el, '.text', 'textContent', identity, paper, commentsPropPath.concat(index, 'text'));
        });
        targetEl.appendChild(el);
      })(index);
    }

    addPaperDOMSetter(function (paper) {
      // events for adding a comment
      _.findEls(root, '.comment.new .text').forEach(function (el) {
        el.onblur = function () {
          var text = el.textContent;
          el.textContent = '';
          if (text.trim()) {
            var comments = getDeepValue(paper, commentsPropPath, []);
            comments.push({ text: text });
            updatePaperView();
            _.scheduleSave(paper);
          }
        }
      });
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

  lima.savePendingStarted = function savePendingStarted() {
    _.addClass('#paper', 'savepending');
  }

  lima.savePendingStopped = function savePendingStopped() {
    _.removeClass('#paper', 'savepending');
  }

  lima.saveStarted = function saveStarted() {
    _.removeClass('#paper', 'savingerror');
    _.addClass('#paper', 'saving');
  }

  lima.saveStopped = function saveStopped() {
    _.removeClass('#paper', 'saving');
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

  function findColumnsInPaper(paper) {
    if (!paper.experiments) return [];

    // find the columns used in the experiments
    var showColumnsHash = {};
    var showCharacteristicColumns = [];
    var showResultColumns = [];

    // clean experiment data and columnOrder of new columns that got new ID when they were saved
    paper.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        var col = lima.columns[key];
        if (col && col.id !== key) {
          experiment.data[col.id] = experiment.data[key];
          delete experiment.data[key];
        }
      });
    });

    if (Array.isArray(paper.columnOrder)) paper.columnOrder.forEach(function (key, index) {
      var col = lima.columns[key];
      if (col && col.id !== key) {
        paper.columnOrder[index] = col.id;
      }
    });

    // now gather columns in the paper, then sort the columns by type and order
    paper.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(addColumn);
    });

    if (Array.isArray(paper.columnOrder)) paper.columnOrder.forEach(addColumn);

    function addColumn(key) {
      if (!(key in showColumnsHash)) {
        var col = lima.columns[key];
        showColumnsHash[key] = col;
        switch (col.type) {
          case 'characteristic': showCharacteristicColumns.push(col.id); break;
          case 'result':         showResultColumns.push(col.id); break;
        }
      }
    }

    showCharacteristicColumns.sort(compareColsByOrder);
    showResultColumns.sort(compareColsByOrder);

    return showCharacteristicColumns.concat(showResultColumns);

    function compareColsByOrder(c1, c2) {
      if (!Array.isArray(paper.columnOrder)) return 0;
      var i1 = paper.columnOrder.indexOf(c1);
      var i2 = paper.columnOrder.indexOf(c2);
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
    _.scheduleSave(currentPaper);
  }

  function regenerateColumnOrder(paper) {
    if (!Array.isArray(paper.columnOrder)) paper.columnOrder = [];

    var columns = findColumnsInPaper(paper);
    columns.forEach(function (colId) {
      if (paper.columnOrder.indexOf(colId) === -1) {
        paper.columnOrder.push(colId);
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

  function changeColumnType(ev) {
    var newTypeEl = ev.target;

    // find the element with the class 'coltype' before the button
    var coltypeEl = newTypeEl;
    while (coltypeEl && !coltypeEl.classList.contains('coltype')) coltypeEl = coltypeEl.previousElementSibling || coltypeEl.parentElement;

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
    var coltypeEl = btn;
    while (coltypeEl && !coltypeEl.classList.contains('coltype')) coltypeEl = coltypeEl.previousElementSibling || coltypeEl.parentElement;

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
  var paperDOMSetters;
  var paperChangeVerifiers;

  resetDOMSetters();

  function resetDOMSetters() {
    paperDOMSetters = [];
    paperChangeVerifiers = [];
  }

  function addPaperDOMSetter (f) {
    if (f && paperDOMSetters.indexOf(f) === -1) paperDOMSetters.push(f);
  }

  function addPaperChangeVerifier (f) {
    if (paperChangeVerifiers.indexOf(f) === -1) paperChangeVerifiers.push(f);
  }

  function callPaperDOMSetters(paper) {
    paperDOMSetters.forEach(function (setter) { setter(paper); });
  }

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
        el.classList.remove('validationerror');
        setValidationErrorClass();
        el.addEventListener('keydown', _.deferScheduledSave);
        el.oninput = function () {
          var value = el[property];
          if (typeof value === 'string' && value.trim() === '') value = '';
          try {
            if (validatorSanitizer) value = validatorSanitizer(value, el, property);
          } catch (err) {
            // this class will be removed by updatePaperView when validation succeeds again
            el.classList.add('validationerror');
            el.dataset.validationmessage = err.message || err;
            setValidationErrorClass();
            _.cancelScheduledSave(target);
            return;
          }
          assignDeepValue(target, targetProp, value);
          updatePaperView();
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

    editingEl.oninput = editingEl.onblur = function () {
      var value = editingEl[property];
      if (typeof value === 'string' && value.trim() === '') value = '';
      try {
        if (validatorSanitizer) value = validatorSanitizer(value, editingEl, property);
      } catch (err) {
        editingEl.classList.add('validationerror');
        confirmEl.disabled = true;
        editingEl.dataset.validationmessage = err && err.message || err || '';
        setValidationErrorClass();
        _.cancelScheduledSave(target);
        return;
      }
      editingEl.classList.remove('validationerror');
      setValidationErrorClass();
      if (value !== getDeepValue(target, targetProp)) {
        confirmEl.disabled = false;
        editingEl.classList.add('unsaved');
      } else {
        confirmEl.disabled = true;
        editingEl.classList.remove('unsaved');
      }
      setUnsavedClass();
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
  document.addEventListener('keydown', dismissOrBlurOnEscape);
  document.addEventListener('click', popupOnClick);

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

  // for testing
  lima.pinPopupBox = pinPopupBox;
  lima.unpinPopupBox = unpinPopupBox;
  lima.updatePaperView = updatePaperView;
  lima.assignDeepValue = assignDeepValue;
  lima.getDeepValue = getDeepValue;
  lima.getPaperTitles = function(){return paperTitles;};
  lima.getCurrentPaper = function(){return currentPaper;};
  lima.findColumnsInPaper = findColumnsInPaper;

  window._ = _;

})(window, document);
