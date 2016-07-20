(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.extractPaperTitleFromUrl = function extractPaperTitleFromUrl() {
    // the path of a page for a paper will be '/email/title/*',
    // so extract the 'title' portion here:

    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    return window.location.pathname.substring(start, window.location.pathname.indexOf('/', start));
  }


  limeta.requestAndFillPaperList = function requestAndFillPaperList() {
    limeta.getGapiIDToken()
    .then(function (idToken) {
      var email = limeta.extractUserProfileEmailFromUrl();
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
      limeta.apiFail();
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

  var currentPaperUrl, currentPaper;

  limeta.extractAndFillPaper = function extractAndFillPaper() {
    var email = limeta.extractUserProfileEmailFromUrl();
    var title = limeta.extractPaperTitleFromUrl();
    _.fillEls('#paper .title', title);

    limeta.getColumns() // todo getColumns could run in parallel with everything before fillPaper
    .then(limeta.getGapiIDToken)
    .then(function (idToken) {
      currentPaperUrl = '/api/papers/' + email + '/' + title;
      return fetch(currentPaperUrl, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(fillPaper)
    .catch(function (err) {
      console.error("problem getting paper");
      console.error(err);
      limeta.apiFail();
    });
  }

  function fillPaper(paper) {
    currentPaper = paper;

    var oldPaperEl = _.byId('paper');
    if (oldPaperEl) oldPaperEl.parentElement.removeChild(oldPaperEl);

    var paperTemplate = _.byId('paper-template');
    var paperEl = _.cloneTemplate(paperTemplate);
    paperTemplate.parentElement.insertBefore(paperEl, paperTemplate);


    // fill the data table first in case the templates use any of the data below
    fillPaperExperimentTable();

    _.fillEls('#paper .title', paper.title);
    _.fillTags('#paper .tags', paper.tags);
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

    if (limeta.extractUserProfileEmailFromUrl() === paper.enteredBy) {
      _.addClass('#paper .enteredby', 'only-not-yours');
    }

    _.removeClass('body', 'loading');

    _.setYouOrName();

    _.addEventListener('#paper .savingerror', 'click', savePaper);
    _.addEventListener('#paper .description .value', 'input', setPendingPaperSave);

    // todo
    // in fillPaper, only replace values if they have changed
    // in fillPaper, do nothing if save is pending?
  }

  function fillPaperExperimentTable() {
    var experiments = currentPaper.experiments;
    if (!Array.isArray(experiments)) experiments = currentPaper.experiments = [];

    _.findEls('#paper table.experiments').forEach(function(el) {
      el.parentElement.removeChild(el);
    });

    var table = _.cloneTemplate('experiments-table-template');
    // show the table if it's not empty or
    // hide the empty experiment data table if the user can't edit it
    if (experiments.length) {
      table.children[0].classList.remove('editing');
    } else {
      table.children[0].classList.add('editing');
    }

    var showColumns = findColumnsInPaper();

    // fill the row of headings
    var headingsRowNode = _.findEl(table, 'tr:first-child');
    var addColumnNode = _.findEl(table, 'tr:first-child > th.add');
    showColumns.forEach(function (col) {
      var th = _.cloneTemplate('col-heading-template');
      _.fillEls(th, '.coltitle', col.title);
      _.addClass(th, '.coltype', col.type);
      _.fillEls(th, '.coldescription', col.description);
      _.fillEls(th, '.colctime .value', _.formatDateTime(col.ctime));
      _.fillEls(th, '.definedby .value', col.definedBy);
      _.setProps(th, '.definedby .value', 'href', '/' + col.definedBy + '/');
      if (limeta.extractUserProfileEmailFromUrl() === col.definedBy) {
        _.addClass(th, '.definedby', 'only-not-yours');
      }
      _.findEls(th, 'button.move').forEach(function (el) {
        el.addEventListener('click', moveColumn);
        el.dataset.id = col.id;
      });
      th.children[0].classList.add(col.type);
      headingsRowNode.insertBefore(th, addColumnNode);
    });

    var tableBodyNode = _.findEl(table, 'tbody');
    var addRowNode = _.findEl(table, 'tbody > tr.add');
    experiments.forEach(function (experiment) {
      var tr = _.cloneTemplate('experiment-row-template');
      _.fillEls(tr, '.exptitle', experiment.title);
      _.fillEls(tr, '.expdescription', experiment.description);

      showColumns.forEach(function (col) {
        var colId = col.id;
        var value = ' ';
        var comments;
        if (experiment.data && experiment.data[colId]) {
          value = experiment.data[colId].value;
          comments = experiment.data[colId].comments;
        }
        var td = _.cloneTemplate('experiment-datum-template');
        _.fillEls(td, '.value', value);
        if (Array.isArray(comments) && comments.length > 0) {
          td.children[0].classList.add('hascomments');
          _.fillEls(td, '.commentcount', comments.length);
          fillComments('comment-template', td, '.comments main', comments);
        }
        td.children[0].classList.add(col.type);
        tr.children[0].appendChild(td);
      });

      tableBodyNode.insertBefore(tr, addRowNode);
    });

    showColumns.forEach(function (col) {
      var td = document.createElement('td');
      td.classList.add(col.type);
      addRowNode.appendChild(td);
    });

    var noTableMarker = _.findEl('#paper .no-table');
    noTableMarker.parentElement.insertBefore(table, noTableMarker);
  }

  function fillComments(templateId, root, selector, comments) {
    var targetEl = _.findEl(root, selector);
    comments.forEach(function (comment, index) {
      var el = _.cloneTemplate(templateId);
      _.fillEls(el, '.by', comment.by);
      _.fillEls(el, '.commentnumber', index+1);
      _.setProps(el, '.by', 'href', '/' + comment.by + '/');
      _.fillEls(el, '.ctime', _.formatDateTime(comment.ctime));
      _.fillEls(el, '.text', comment.text);
      targetEl.appendChild(el);
    })
  }

  function findColumnsInPaper() {
    // find the columns used in the experiments
    var showColumnsHash= {};
    var showCharacteristicColumns = [];
    var showResultColumns = [];
    currentPaper.experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        if (!(key in showColumnsHash)) {
          var col = limeta.columns[key];
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
  }

  function compareColsByOrder(c1, c2) {
    if (!Array.isArray(currentPaper.columnOrder)) return 0;
    var i1 = currentPaper.columnOrder.indexOf(c1.id);
    var i2 = currentPaper.columnOrder.indexOf(c2.id);
    if (i1 === i2) return 0;
    if (i1 === -1) return 1;
    if (i2 === -1) return -1;
    return i1 - i2;
  }

  function moveColumn() {
    var left = this.classList.contains('left');
    var most = this.classList.contains('most');
    var colId = this.dataset.id;
    if (!colId) return; // we don't know what to move

    regenerateColumnOrder();
    var i = currentPaper.columnOrder.indexOf(colId);
    if (i === -1) return console.error('column ' + colId + ' not found in newly regenerated order!');
    _.moveInArray(currentPaper.columnOrder, i, left, most);
    moveResultsAfterCharacteristics();
    fillPaper(currentPaper);
    setPendingPaperSave();
  }

  function regenerateColumnOrder() {
    if (!Array.isArray(currentPaper.columnOrder)) currentPaper.columnOrder = [];

    var columns = findColumnsInPaper();
    columns.forEach(function (col) {
      if (currentPaper.columnOrder.indexOf(col.id) === -1) {
        currentPaper.columnOrder.push(col.id);
      }
    })

    moveResultsAfterCharacteristics();
  }

  function moveResultsAfterCharacteristics() {
    // make sure result columns come after characteristics columns
    var firstResult = 0;
    for (var i = 0; i < currentPaper.columnOrder.length; i++) {
      if (limeta.columns[currentPaper.columnOrder[i]].type === 'characteristic') {
        _.moveArrayElement(currentPaper.columnOrder, i, firstResult);
        firstResult++;
      }
    }

  }

  var pendingSaveTimeout = null;
  var pendingSaveForceTime = null;

  function setPendingPaperSave() {
    // don't save automatically after an error
    if (_.findEl('#paper.savingerror')) return;

    // setTimeout for save in 1s
    // if already set, cancel the old one and set a new one
    // but only replace the old one if the pending save started less than 10s ago
    _.addClass('#paper', 'savepending');
    if (pendingSaveTimeout && pendingSaveForceTime > Date.now()) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    if (!pendingSaveTimeout) pendingSaveTimeout = setTimeout(savePaper, 1000);
    if (!pendingSaveForceTime) pendingSaveForceTime = Date.now() + 10 * 1000; // ten seconds
  }

  function savePaper() {
    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;
    pendingSaveForceTime = null;

    limeta.getGapiIDToken()
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
      if (!pendingSaveTimeout) fillPaper(json);
    })
    .catch(function(err) {
      console.error('error saving paper');
      console.error(err);
      _.addClass('#paper', 'savingerror');
      _.removeClass('#paper', 'saving');
      if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
      pendingSaveForceTime = null;
    })

  }

})(window, document);
