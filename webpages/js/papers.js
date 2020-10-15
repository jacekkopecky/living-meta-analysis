(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js


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

  function requestPaper(title) {
    var email = lima.extractUserProfileEmailFromUrl();

    if (lima.userLocalStorage) {
      return Promise.resolve()
      .then(loadLocalPapersList)
      .then(function() { return loadLocalPaper('/' + email + '/' + title); })
      .then(initPaper)
      .catch(function (err) {
        console.log("could not get local paper, trying server for " + title, err);
        return requestServerPaper(email, title);
      });
    }

    return requestServerPaper(email, title);
  }

  // todo this needs to be not only local
  function requestPaperById(id) {
    if (lima.userLocalStorage) {
      return Promise.resolve()
      .then(function() { return loadLocalPaperById(id); })
      .then(initPaper)
      .catch(function (err) {
        console.log("problem getting local paper by id " + id, err);
        throw err;
      });
    }

    return Promise.reject(new Error('cannot request paper by id from server yet'));
  }

  function requestServerPaper(email, title) {
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

  function Paper() {}
  Paper.prototype.save = savePaper;
  Paper.prototype.init = initPaper;
  Paper.prototype.saveOrder = 2; // between columns and metaanalyses
  Paper.prototype.addExperimentColumn = addExperimentColumn;

  function initPaper(newPaper) {
    var self = this;
    if (!(self instanceof Paper)) self = new Paper();

    var oldId = self.id;

    // clean all properties of this paper
    for (var prop in self) { if (Object.prototype.hasOwnProperty.call(self, prop)) { delete self[prop]; } }

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

    // give experiments IDs so they can be referenced from metaanalysis
    self.experiments.forEach(function (experiment, expIndex) {
      if (!experiment.id) {
        experiment.id = self.id + ',' + expIndex;
      }
    });

    return self;
  }

  function addExperimentColumn(title, description, type) {
    var col = {
      title: title,
      description: description,
      type: type,
      id: _.getNextID(this.columns)
    };
    this.columns.push(col);
    return col;
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

  function savePaper() {
    var self = this;

    if (lima.userLocalStorage) return savePaperLocally(self);

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
        if (err instanceof Response) err.text().then(function (t) {console.error(t);});
        else console.error(err);
        throw err;
      });
  }

  var localPapers;

  function loadLocalPapersList() {
    if (!localPapers) {
      if (localStorage.papers) {
        localPapers = JSON.parse(localStorage.papers);
      } else {
        localPapers = {};
      }
    }
    return localPapers;
  }

  function loadLocalPaper(path) {
    return loadLocalPaperById(localPapers[path]);
  }

  function loadLocalPaperById(id) {
    var val = localStorage[id];
    if (!val) throw new Error('cannot find local paper id ' + id);
    return JSON.parse(val);
    // todo also load the paper from the server and check if it is outdated
  }

  function savePaperLocally(paper) {
    try {
      loadLocalPapersList();
      if (lima.updatePageURL && paper.new) lima.updatePageURL();
      var localURL = createPageURL(lima.localStorageUsername, paper.title);
      localPapers[localURL] = paper.id;

      paper.storedLocally = Date.now();

      localStorage[paper.id] = JSON.stringify(paper);
      localStorage.papers = JSON.stringify(localPapers);
      console.log('paper ' + paper.id + ' saved locally');
      if (lima.updateAfterPaperSave) lima.updateAfterPaperSave();
    } catch (e) {
      console.error(e);
      return Promise.reject(new Error('failed to save paper ' + paper.id + ' locally'));
    }
  }

  function createPageURL(email, title) {
    return '/' + email + '/' + title;
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
  lima.requestPaper = requestPaper;
  lima.requestPaperById = requestPaperById;

  lima.Paper = Paper;

})(window, document);
