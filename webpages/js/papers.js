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
        var li = _.cloneTemplateById('paper-list-item-template');
        _.fillEls(li, '.name', paper.title);
        _.fillEls(li, '.date', paper.published);
        _.fillEls(li, '.description', paper.description);
        _.setProps(li, '.description', 'title', paper.description);
        _.setProps(li, 'a.mainlink', 'href', paper.title);
        _.fillTags(_.findEl(li, '.tags'), paper.tags);
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.cloneTemplateById('empty-list-template'));
    }

    _.setYouOrName();
  }

  var currentPaperUrl, currentPaper;

  limeta.extractAndFillPaper = function extractAndFillPaper() {
    var email = limeta.extractUserProfileEmailFromUrl();
    var title = limeta.extractPaperTitleFromUrl();
    _.fillEls('#paper .title', title);

    limeta.getGapiIDToken()
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

    // fill the data table first in case the templates use any of the data below
    fillPaperExperimentTable(paper.experiments);

    _.fillEls('#paper .title', paper.title);
    _.fillTags(_.findEl('#paper .tags'), paper.tags);
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

    _.removeClass('#paper', 'loading');

    _.setYouOrName();

    if (!addedPaperListeners) {
      addedPaperListeners = true;
      _.findEl('#paper .savingerror').addEventListener('click', savePaper);
      _.findEl('#paper .description .value').addEventListener('input', setPendingPaperSave);
    }

    // todo
    // in fillPaper, only replace values if they have changed
    // in fillPaper, do nothing if save is pending?
  }

  function fillPaperExperimentTable(experiments) {
    _.findEls('#paper table.experiments').forEach(function(el) {
      el.parentElement.removeChild(el);
    });

    var table = _.cloneTemplateById('experiments-table-template');
    // show the table if it's not empty or
    // hide the empty experiment data table if the user can't edit it
    if (Array.isArray(experiments) && experiments.length) {
      table.children[0].classList.remove('only-yours');
    } else {
      table.children[0].classList.add('only-yours');
    }

    // find the properties used in the experiments
    var usedProperties = {};
    experiments.forEach(function (experiment) {
      if (experiment.data) Object.keys(experiment.data).forEach(function (key) {
        usedProperties[key] = limeta.properties[key];
      });
    });

    // fill the row of headings
    var headingsRowNode = _.findEl(table, 'tr:first-child');
    var addPropertyNode = _.findEl(table, 'tr:first-child > th.add');
    Object.keys(usedProperties).forEach(function (propId) {
      var prop = usedProperties[propId];
      var th = _.cloneTemplateById('prop-heading-template');
      _.fillEls(th, '.proptitle', prop.title);
      _.fillEls(th, '.propdescription', prop.description);
      _.fillEls(th, '.propctime .value', _.formatDateTime(prop.ctime));
      _.fillEls(th, '.definedby .value', prop.definedBy);
      _.setProps(th, '.definedby .value', 'href', '/' + prop.definedBy + '/');
      if (limeta.extractUserProfileEmailFromUrl() === prop.definedBy) {
        _.addClass(th, '.definedby', 'only-not-yours');
      }
      headingsRowNode.insertBefore(th, addPropertyNode);
    });

    var tableBodyNode = _.findEl(table, 'tbody');
    var addRowNode = _.findEl(table, 'tbody > tr.add');
    experiments.forEach(function (experiment) {
      var tr = _.cloneTemplateById('experiment-row-template');
      _.fillEls(tr, '.exptitle', experiment.title);

      Object.keys(usedProperties).forEach(function (propId) {
        var value = ' ';
        if (experiment.data && experiment.data[propId]) value = experiment.data[propId].value;
        var td = _.cloneTemplateById('experiment-datum-template');
        _.fillEls(td, '.value', value);
        tr.children[0].appendChild(td);
      });

      tableBodyNode.insertBefore(tr, addRowNode);
    });

    Object.keys(usedProperties).forEach(function () {
      addRowNode.appendChild(document.createElement('td'));
    });

    _.byId('paper').appendChild(table);
  }

  var addedPaperListeners = false;

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

    updatePaperFromDom();
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

  function updatePaperFromDom() {
    // todo require title
    // todo suggest default title: first word in authors and last two digits or the first four-digit sequence in published with 'a' or so appended to make unique
    // todo on title change, check that it didn't exist

    // ignoring rich formatting in description
    currentPaper.description = _.findEl('#paper .description .value').textContent;
    // todo
  }

})(window, document);
