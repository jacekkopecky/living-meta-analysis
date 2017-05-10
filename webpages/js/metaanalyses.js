(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  function extractMetaanalysisTitleFromUrl(path) {
    // the path of a page for a metaanalysis will be '/email/title/*',
    // so extract the 'title' portion here:

    if (!path) path = window.location.pathname;

    var start = path.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    var rest = path.indexOf('/', start);
    if (rest === -1) rest = Infinity;

    return path.substring(start, rest);
  }

  function updatePageURL() {
    if (extractMetaanalysisTitleFromUrl() == currentMetaanalysis.title) return; // all done

    // the path of a page for a metaanalysis will be '/email/title/*',
    // so update the 'title' portion here from the current metaanalysis (in case the user changes the title)
    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    var rest = window.location.pathname.indexOf('/', start);

    var url = window.location.pathname.substring(0, start) + currentMetaanalysis.title;
    if (rest > -1) url += window.location.pathname.substring(rest);

    if (lima.userLocalStorage) url += '?type=metaanalysis';

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
    .then(function (papers) {
      return papers.concat(loadAllLocalMetaanalyses());
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
        var li = _.cloneTemplate('metaanalysis-list-item-template').children[0];
        _.fillEls(li, '.name', metaanalysis.title);
        _.fillEls(li, '.published', metaanalysis.published);
        _.setProps(li, '.published', 'title', metaanalysis.published);
        _.fillEls(li, '.description', metaanalysis.description);
        _.setProps(li, '.description', 'title', metaanalysis.description);
        if (!metaanalysis.storedLocally) {
          _.setProps(li, 'a.mainlink', 'href', metaanalysis.title);
        } else {
          _.setProps(li, 'a.mainlink', 'href', '/' + lima.localStorageUserEmailAddress + '/' + metaanalysis.title + '?type=metaanalysis'); // hint in case of local storage
          li.classList.add('local');
          // todo do something with the above class - highlight local papers
        }
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

  function requestMetaanalysis(title) {
    var email = lima.extractUserProfileEmailFromUrl();

    if (lima.userLocalStorage) {
      return Promise.resolve()
      .then(loadLocalMetaanalysesList)
      .then(function() { return loadLocalMetaanalysis('/' + email + '/' + title); })
      .catch(function (err) {
        console.log("could not get local metaanalysis, trying server for " + title, err);
        return requestServerMetaanalysis(email, title)
        .then(function(ma) {
          // force saving in local storage
          // then all papers are also saved in local storage
          ma.save();
          return ma;
        });
      });
    }

    return requestServerMetaanalysis(email, title);
  }

  function requestServerMetaanalysis(email, title) {
    return lima.getGapiIDToken()
    .then(function (idToken) {
      currentMetaanalysisUrl = '/api/metaanalyses/' + email + '/' + title;
      return fetch(currentMetaanalysisUrl, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(initMetaanalysis)
  }

  function requestAndFillMetaanalysis() {
    var title = lima.extractMetaanalysisTitleFromUrl();
    _.fillEls('#metaanalysis .title', title);

    lima.getColumns() // todo getColumns could run in parallel with everything before updateMetaanalysisView
    .then(function() { return requestMetaanalysis(title); })
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
  Metaanalysis.prototype.saveOrder = 3; // after columns and papers

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

    // clean metaanalysis columns, aggregates, and graphs
    lima.updateColumnListAfterColumnSave(currentMetaanalysis.columns);
    lima.updateColumnListAfterColumnSave(currentMetaanalysis.aggregates);
    lima.updateColumnListAfterColumnSave(currentMetaanalysis.graphs);

    updateMetaanalysisView();
  }

  function initMetaanalysis(newMetaanalysis) {
    var self = this;
    if (!(self instanceof Metaanalysis)) self = new Metaanalysis();

    var oldId = self.id;

    // clean all properties of this paper
    for (var prop in self) { if (self.hasOwnProperty(prop)) { delete self[prop]; } }

    // get data from the new paper
    Object.assign(self, newMetaanalysis);

    if (!self.id) {
      self.id = oldId || _.createId('metaanalysis');
      self.new = true;
    } else if (oldId != self.id) {
      self.oldTemporaryId = oldId;
    }

    if (!Array.isArray(self.paperOrder)) self.paperOrder = [];
    if (!Array.isArray(self.papers)) self.papers = [];
    if (!Array.isArray(self.columns)) self.columns = [];
    if (!Array.isArray(self.hiddenCols)) self.hiddenCols = [];
    if (!Array.isArray(self.tags)) self.tags = [];
    if (!Array.isArray(self.aggregates)) self.aggregates = [];
    if (!Array.isArray(self.graphs)) self.graphs = [];
    if (!Array.isArray(self.excludedExperiments)) self.excludedExperiments = [];

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
    self.columns = self.columns.filter(function (col) {
      if (typeof col === 'string' && !lima.columns[col]) {
        console.error('don\'t have column', col);
        return false;
      } else {
        return true;
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

    //TODO: If this stays the same - factor out with above.
    self.graphs.forEach(function (graph) {
      var parsed = lima.parseFormulaString(graph.formula);
      if (parsed != null) {
        graph.formulaName = parsed.formulaName;
        graph.formulaParams = parsed.formulaParams;
      } else {
        graph.formulaName = null;
        graph.formulaParams = [];
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
        if (typeof column === 'string' && self.columns.indexOf(column) === -1) {
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

    fillMetaanalysis(currentMetaanalysis);

    // for a new metaanalysis, go to editing the title
    if (currentMetaanalysis.new) focusFirstValidationError();
  }

  function updateAfterPaperSave() {
    if (!currentMetaanalysis) return;
    currentMetaanalysis.papers.forEach(function(paper){
      // check for papers that we don't have in paperOrder
      // those will be newly added papers that just got saved and now have a new ID
      if (currentMetaanalysis.paperOrder.indexOf(paper.id) == -1) {
        var oldIndex = currentMetaanalysis.paperOrder.indexOf(paper.oldTemporaryId);
        if (oldIndex !== -1) {
          currentMetaanalysis.paperOrder[oldIndex] = paper.id;
        } else {
          // old ID not found, strange, just add the paper to the end
          console.error(new Error('did not have paper in the metaanalysis paperorder: ' + paper.id));
          currentMetaanalysis.paperOrder.push(paper.id);
        }
        _.scheduleSave(currentMetaanalysis);
      }

      // also replace oldTemporaryId with the new id in excludedExperiments
      if (replaceExcludedPaperId(paper.oldTemporaryId, paper.id)) {
        _.scheduleSave(currentMetaanalysis);
      }
    });

    // also schedule save in localStorage mode - it's cheap and it may save new papers
    // as with localStorage, they don't get a new ID on save
    if (lima.userLocalStorage) _.scheduleSave(currentMetaanalysis);
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

    if (metaanalysis.new) {
      _.addClass('body', 'new');
    } else {
      _.removeClass('body', 'new');
    }

    if (metaanalysis.new || lima.userLocalStorage) {
      lima.toggleEditing(true);
    }

    var metaanalysisTemplate = _.byId('metaanalysis-template');
    var metaanalysisEl = _.cloneTemplate(metaanalysisTemplate).children[0];
    metaanalysisTemplate.parentElement.insertBefore(metaanalysisEl, metaanalysisTemplate);

    fillTags(metaanalysisEl, metaanalysis);
    fillMetaanalysisExperimentTable(metaanalysis);
    fillAggregateTable(metaanalysis);
    fillGraphTable(metaanalysis);

    // for now, do local storage "edit your copy"
    // var ownURL = createPageURL(lima.getAuthenticatedUserEmail(), metaanalysis.title);
    var ownURL = createPageURL(lima.localStorageUserEmailAddress, metaanalysis.title);
    _.setProps(metaanalysisEl, '.edityourcopy', 'href', ownURL + '?type=metaanalysis');

    metaanalysisEl.classList.toggle('localsaving', !!lima.userLocalStorage);

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
    _.addEventListener(metaanalysisEl, '.savepending', 'click', _.manualSave);
    _.addEventListener(metaanalysisEl, '.validationerrormessage', 'click', focusFirstValidationError);
    _.addEventListener(metaanalysisEl, '.unsavedmessage', 'click', focusFirstUnsaved);

    document.addEventListener('keydown', moveBetweenDataCells, true);

    if (pinnedBox) pinPopupBox(pinnedBox);

    setValidationErrorClass();
    setUnsavedClass();

    addComputedDatumSetter(drawForestPlot);
    addComputedDatumSetter(drawForestPlotGroup);
    addComputedDatumSetter(drawGrapeChart);

    recalculateComputedData();
  }

  /* forest plot
   *
   *
   *   ######  ####  #####  ######  ####  #####    #####  #       ####  #####
   *   #      #    # #    # #      #        #      #    # #      #    #   #
   *   #####  #    # #    # #####   ####    #      #    # #      #    #   #
   *   #      #    # #####  #           #   #      #####  #      #    #   #
   *   #      #    # #   #  #      #    #   #      #      #      #    #   #
   *   #       ####  #    # ######  ####    #      #      ######  ####    #
   *
   *
   */

  function drawForestPlot() {
    // prepare data:
    // first find the forestPlot aggregate, it gives us the parameters
    // then for every paper and every experiment, call appropriate functions to get or,lcl,ucl,wt
    // then get the aggregates or,lcl,ucl
    //   lines (array)
    //     title (paper and maybe experiment)
    //     or
    //     lcl
    //     ucl
    //     wt
    //   aggregated
    //     or
    //     lcl
    //     ucl

    var plotsContainer = _.findEl('#metaanalysis > .plots');

    for (var k=0; k<currentMetaanalysis.graphs.length; k++) {
      var orFunc, wtFunc, lclFunc, uclFunc, params;

      if (currentMetaanalysis.graphs[k].formulaName && currentMetaanalysis.graphs[k].formulaName.indexOf('grapeChart') != -1) {
        continue;
      }

      // TODO: HEDGEHOG
      // todo the plot should be associated with its parameters differently, not through an aggregate
      // todo there should be the possibility to have more forest plots
      for (var i=k; i<currentMetaanalysis.graphs.length; i++) {
        if (currentMetaanalysis.graphs[i].formulaName === 'forestPlotNumberGraph' && isColCompletelyDefined(currentMetaanalysis.graphs[i])) {
          params = currentMetaanalysis.graphs[i].formulaParams;
          orFunc = { formulaName: "logOddsRatioNumber", formulaParams: params };
          wtFunc = { formulaName: "weightNumber", formulaParams: params };
          lclFunc = { formulaName: "lowerConfidenceLimitNumber", formulaParams: params };
          uclFunc = { formulaName: "upperConfidenceLimitNumber", formulaParams: params };
          break;
        }
        if (currentMetaanalysis.graphs[i].formulaName === 'forestPlotPercentGraph' && isColCompletelyDefined(currentMetaanalysis.graphs[i])) {
          params = currentMetaanalysis.graphs[i].formulaParams;
          orFunc = { formulaName: "logOddsRatioPercent", formulaParams: [params[0], params[2]] };
          wtFunc = { formulaName: "weightPercent", formulaParams: params };
          lclFunc = { formulaName: "lowerConfidenceLimitPercent", formulaParams: params };
          uclFunc = { formulaName: "upperConfidenceLimitPercent", formulaParams: params };
          break;
        }
      }

      if (i === currentMetaanalysis.graphs.length) {
        // we don't have any parameters for the forestPlot        console.log(i);
        return;
      }

      // get the data
      orFunc.formula = lima.createFormulaString(orFunc);
      wtFunc.formula = lima.createFormulaString(wtFunc);
      lclFunc.formula = lima.createFormulaString(lclFunc);
      uclFunc.formula = lima.createFormulaString(uclFunc);

      var lines=[];

      for (i=0; i<currentMetaanalysis.papers.length; i+=1) {
        for (var j=0; j<currentMetaanalysis.papers[i].experiments.length; j+=1) {
          if (isExcludedExp(currentMetaanalysis.papers[i].id, j)) continue;
          var line = {};
          line.title = currentMetaanalysis.papers[i].title || 'new paper';
          if (currentMetaanalysis.papers[i].experiments.length > 1) {
            var expTitle = currentMetaanalysis.papers[i].experiments[j].title || 'new experiment';
            if (expTitle.match(/^\d+$/)) expTitle = 'Exp. ' + expTitle;
            line.title += ' (' + expTitle + ')';
          }
          line.or = getDatumValue(orFunc, j, i);
          line.wt = getDatumValue(wtFunc, j, i);
          line.lcl = getDatumValue(lclFunc, j, i);
          line.ucl = getDatumValue(uclFunc, j, i);
          lines.push(line);

          // if any of the values is NaN or ±Infinity, disregard this experiment
          if (isNaN(line.or*0) || isNaN(line.lcl*0) || isNaN(line.ucl*0) || isNaN(line.wt*0) ||
              line.or == null || line.lcl == null || line.ucl == null || line.wt == null) {
            delete line.or;
            delete line.lcl;
            delete line.ucl;
            delete line.wt;
          }
        }
      }

      // add indication to the graph when there is no data
      if (lines.length === 0) {
        var noDataLine = {title: "No data"};
        lines.push(noDataLine);
      }

      var plotEl = _.cloneTemplate('forest-plot-template').children[0];
      var forestPlotId = 'forest-plot-' + k;

      plotEl.classList.toggle('maximized', !!localStorage.plotMaximized);
      plotsContainer.appendChild(plotEl);

      var orAggrFunc = { formulaName: "weightedMeanAggr", formulaParams: [ orFunc, wtFunc ] };
      var lclAggrFunc = { formulaName: "lowerConfidenceLimitAggr", formulaParams: [ orFunc, wtFunc ] };
      var uclAggrFunc = { formulaName: "upperConfidenceLimitAggr", formulaParams: [ orFunc, wtFunc ] };

      orAggrFunc.formula = lima.createFormulaString(orAggrFunc);
      lclAggrFunc.formula = lima.createFormulaString(lclAggrFunc);
      uclAggrFunc.formula = lima.createFormulaString(uclAggrFunc);

      var aggregates = {
        or: getDatumValue(orAggrFunc),
        lcl: getDatumValue(lclAggrFunc),
        ucl: getDatumValue(uclAggrFunc),
      }

      if (isNaN(aggregates.or*0) || isNaN(aggregates.lcl*0) || isNaN(aggregates.ucl*0)) {
      /////////////////////////////////////  aggregates.lcl = 0;
        aggregates.ucl = 0;
      }

      // compute
      //   sum of wt
      //   min and max of wt
      //   min of lcl and aggr lcl
      //   max of ucl and aggr ucl
      var sumOfWt = 0;
      var minWt = Infinity;
      var maxWt = -Infinity;
      var minLcl = aggregates.lcl;
      var maxUcl = aggregates.ucl;

      if (isNaN(minLcl)) minLcl = 0;
      if (isNaN(maxUcl)) maxUcl = 0;

      lines.forEach(function (line) {
        if (line.or == null) return;
        sumOfWt += line.wt;
        if (line.wt < minWt) minWt = line.wt;
        if (line.wt > maxWt) maxWt = line.wt;
        if (line.lcl < minLcl) minLcl = line.lcl;
        if (line.ucl > maxUcl) maxUcl = line.ucl;
      });

      if (minLcl < -10) minLcl = -10;
      if (maxUcl > 10) maxUcl = 10;

      if (minWt == Infinity) minWt = maxWt = 1;
      if (sumOfWt == 0) sumOfWt = 1;

      var TICK_SPACING;


      // select tick spacing based on a rough estimate of how many ticks we'll need anyway
      var clSpread = (maxUcl - minLcl) / Math.LN10; // how many orders of magnitude we cover
      if (clSpread > 3) TICK_SPACING = [100];
      else if (clSpread > 1.3) TICK_SPACING = [10];
      else TICK_SPACING = [ 2, 2.5, 2 ]; // ticks at 1, 2, 5, 10, 20, 50, 100...


      // adjust minimum and maximum around decimal non-logarithmic values
      var newBound = 1;
      var tickNo = 0;
      while (Math.log(newBound) > minLcl) {
        tickNo -= 1;
        newBound /= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)]; // JS % can be negative
      }
      minLcl = Math.log(newBound) - .1;

      var startingTickVal = newBound;
      var startingTick = tickNo;

      newBound = 1;
      tickNo = 0;
      while (Math.log(newBound) < maxUcl) {
        newBound *= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)];
        tickNo += 1;
      }
      maxUcl = Math.log(newBound) + .1;

      var xRatio = 1/(maxUcl-minLcl)*parseInt(plotEl.dataset.graphWidth);

      // return the X coordinate on the graph that corresponds to the given logarithmic value
      function getX(val) {
        return (val-minLcl)*xRatio;
      }

      // adjust weights so that in case of very similar weights they don't range from minimum to maximum
      var MIN_WT_SPREAD=2.5;
      if (maxWt/minWt < MIN_WT_SPREAD) {
        minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
        maxWt = minWt * MIN_WT_SPREAD;
      }

      // minWt = 0; // todo we can uncomment this to make all weights relative to only the maximum weight
      var minWtSize = parseInt(plotEl.dataset.minWtSize);
      // square root the weights because we're using them as lengths of the side of a square whose area should correspond to the weight
      maxWt = Math.sqrt(maxWt);
      minWt = Math.sqrt(minWt);
      var wtRatio = 1/(maxWt-minWt)*(parseInt(plotEl.dataset.maxWtSize)-minWtSize);

      // return the box size for a given weight
      function getBoxSize(wt) {
        return (Math.sqrt(wt)-minWt)*wtRatio + minWtSize;
      }

      var currY = parseInt(plotEl.dataset.startHeight);

      // put experiments into the plot
      lines.forEach(function (line) {
        var expT = _.findEl(plotEl, 'template.experiment');
        var expEl = _.cloneTemplate(expT);

        expEl.setAttribute('transform', 'translate(' + plotEl.dataset.padding + ',' + currY + ')');

        _.fillEls(expEl, '.expname', line.title);
        if (line.or != null) {
          _.fillEls(expEl, '.or', Math.exp(line.or).toPrecision(3));
          _.fillEls(expEl, '.lcl', "" + Math.exp(line.lcl).toPrecision(3) + ",");
          _.fillEls(expEl, '.ucl', Math.exp(line.ucl).toPrecision(3));
          _.fillEls(expEl, '.wt', '' + (Math.round(line.wt / sumOfWt * 1000)/10) + '%');

          _.setAttrs(expEl, 'line.confidenceinterval', 'x1', getX(line.lcl));
          _.setAttrs(expEl, 'line.confidenceinterval', 'x2', getX(line.ucl));

          _.setAttrs(expEl, 'rect.weightbox', 'x', getX(line.or));
          _.setAttrs(expEl, 'rect.weightbox', 'width', getBoxSize(line.wt));
          _.setAttrs(expEl, 'rect.weightbox', 'height', getBoxSize(line.wt));
        } else {
          expEl.classList.add('invalid');
        }

        expT.parentElement.insertBefore(expEl, expT);

        currY += parseInt(plotEl.dataset.lineHeight);
      })


      // put summary into the plot
      if (!isNaN(aggregates.or*0)) {
        var sumT = _.findEl(plotEl, 'template.summary');
        var sumEl = _.cloneTemplate(sumT);

        sumEl.setAttribute('transform', 'translate(' + plotEl.dataset.padding + ',' + currY + ')');

        _.fillEls(sumEl, '.or', Math.exp(aggregates.or).toPrecision(3));
        _.fillEls(sumEl, '.lcl', "" + Math.exp(aggregates.lcl).toPrecision(3) + ",");
        _.fillEls(sumEl, '.ucl', Math.exp(aggregates.ucl).toPrecision(3));

        var lclX = getX(aggregates.lcl);
        var uclX = getX(aggregates.ucl);
        var orX = getX(aggregates.or);
        if ((uclX - lclX) < parseInt(plotEl.dataset.minDiamondWidth)) {
          var ratio = (uclX - lclX) / parseInt(plotEl.dataset.minDiamondWidth);
          lclX = orX + (lclX - orX) / ratio;
          uclX = orX + (uclX - orX) / ratio;
        }

        var confidenceInterval = "" + lclX + ",0 " + orX + ",-10 " + uclX + ",0 " + orX + ",10";

        _.setAttrs(sumEl, 'polygon.confidenceinterval', 'points', confidenceInterval);

        _.setAttrs(sumEl, 'line.guideline', 'x1', getX(aggregates.or));
        _.setAttrs(sumEl, 'line.guideline', 'x2', getX(aggregates.or));
        _.setAttrs(sumEl, 'line.guideline', 'y2', currY+parseInt(plotEl.dataset.lineHeight)+parseInt(plotEl.dataset.extraLineLen));

        sumT.parentElement.insertBefore(sumEl, sumT);
        currY += parseInt(plotEl.dataset.lineHeight);
      }


      // put axes into the plot
      var axesT = _.findEl(plotEl, 'template.axes');
      var axesEl = _.cloneTemplate(axesT);

      axesEl.setAttribute('transform', 'translate(' + plotEl.dataset.padding + ',' + currY + ')');

      _.setAttrs(axesEl, 'line.yaxis', 'y2', currY+parseInt(plotEl.dataset.extraLineLen));
      _.setAttrs(axesEl, 'line.yaxis', 'x1', getX(0));
      _.setAttrs(axesEl, 'line.yaxis', 'x2', getX(0));

      var tickT = _.findEl(axesEl, 'template.tick');
      var tickVal;
      while ((tickVal = Math.log(startingTickVal)) < maxUcl) {
        var tickEl = _.cloneTemplate(tickT);
        tickEl.setAttribute('transform', 'translate(' + getX(tickVal) + ',0)');
        _.fillEls(tickEl, 'text', (tickVal < 0 ? startingTickVal.toPrecision(1) : Math.round(startingTickVal)));
        tickT.parentElement.insertBefore(tickEl, tickT);
        startingTickVal = startingTickVal * TICK_SPACING[_.mod(startingTick, TICK_SPACING.length)];
        startingTick += 1;
      }


      axesT.parentElement.insertBefore(axesEl, axesT);

      _.addEventListener(axesEl, '.positioningbutton', 'click', function (e) {
        plotEl.classList.toggle('maximized');
        localStorage.plotMaximized = plotEl.classList.contains('maximized') ? '1' : '';
        e.stopPropagation();
      })
      // add an id to the current graph
      plotEl.setAttribute('data-graph-id', forestPlotId);

      plotEl.setAttribute('height', parseInt(plotEl.dataset.endHeight) + currY);
      plotEl.setAttribute('viewBox', "0 0 " + plotEl.getAttribute('width') + " " + plotEl.getAttribute('height'));
      // todo set plot widths based on maximum text sizes
    }
  }

  function drawForestPlotGroup() {
    // prepare data:
    // first find the forestPlot aggregate, it gives us the parameters
    // then for every paper and every experiment, call appropriate functions to get or,lcl,ucl,wt
    // then get the aggregates or,lcl,ucl
    //   lines (array)
    //     title (paper and maybe experiment)
    //     or
    //     lcl
    //     ucl
    //     wt
    //   aggregated
    //     or
    //     lcl
    //     ucl

    var orFunc, wtFunc, lclFunc, uclFunc, moderatorParam, params;

    // todo the plot should be associated with its parameters differently, not through an aggregate
    // todo there should be the possibility to have more forest plots
    for (var i=0; i<currentMetaanalysis.aggregates.length; i++) {
      if (currentMetaanalysis.aggregates[i].formulaName === 'forestPlotGroupNumberAggr' && isColCompletelyDefined(currentMetaanalysis.aggregates[i])) {
        params = currentMetaanalysis.aggregates[i].formulaParams;
        orFunc = { formulaName: "logOddsRatioNumber", formulaParams: params };
        wtFunc = { formulaName: "weightNumber", formulaParams: params };
        lclFunc = { formulaName: "lowerConfidenceLimitNumber", formulaParams: params };
        uclFunc = { formulaName: "upperConfidenceLimitNumber", formulaParams: params };
        moderatorParam = params[4];
        break;
      }
      if (currentMetaanalysis.aggregates[i].formulaName === 'forestPlotGroupPercentAggr' && isColCompletelyDefined(currentMetaanalysis.aggregates[i])) {
        params = currentMetaanalysis.aggregates[i].formulaParams;
        orFunc = { formulaName: "logOddsRatioPercent", formulaParams: [params[0], params[2]] };
        wtFunc = { formulaName: "weightPercent", formulaParams: params };
        lclFunc = { formulaName: "lowerConfidenceLimitPercent", formulaParams: params };
        uclFunc = { formulaName: "upperConfidenceLimitPercent", formulaParams: params };
        moderatorParam = params[4];
        break;
      }
    }

    if (i === currentMetaanalysis.aggregates.length) {
      // we don't have any parameters for the forestPlot
      return;
    }

    var plotsContainer = _.findEl('#metaanalysis > .plots');
    plotsContainer.innerHTML = '';

    var plotEl = _.cloneTemplate('forest-plot-group-template').children[0];
    plotEl.classList.toggle('maximized', !!localStorage.plotMaximized);

    // get the data
    orFunc.formula = lima.createFormulaString(orFunc);
    wtFunc.formula = lima.createFormulaString(wtFunc);
    lclFunc.formula = lima.createFormulaString(lclFunc);
    uclFunc.formula = lima.createFormulaString(uclFunc);

    var lines = [];
    var groups = [];

    for (i=0; i<currentMetaanalysis.papers.length; i+=1) {
      for (var j=0; j<currentMetaanalysis.papers[i].experiments.length; j+=1) {
        if (isExcludedExp(currentMetaanalysis.papers[i].id, j)) continue;
        var line = {};
        line.title = currentMetaanalysis.papers[i].title || 'new paper';
        if (currentMetaanalysis.papers[i].experiments.length > 1) {
          var expTitle = currentMetaanalysis.papers[i].experiments[j].title || 'new experiment';
          if (expTitle.match(/^\d+$/)) expTitle = 'Exp. ' + expTitle;
          line.title += ' (' + expTitle + ')';
        }
        line.or = getDatumValue(orFunc, j, i);
        line.wt = getDatumValue(wtFunc, j, i);
        line.lcl = getDatumValue(lclFunc, j, i);
        line.ucl = getDatumValue(uclFunc, j, i);
        line.group = getDatumValue(moderatorParam, j, i);

        if (line.group != null && line.group != '' && groups.indexOf(line.group) === -1) groups.push(line.group);
        // if any of the values is NaN or ±Infinity, disregard this experiment
        if (isNaN(line.or*0) || isNaN(line.lcl*0) || isNaN(line.ucl*0) || isNaN(line.wt*0) ||
            line.or == null || line.lcl == null || line.ucl == null || line.wt == null) {
          delete line.or;
          delete line.lcl;
          delete line.ucl;
          delete line.wt;
        }

        lines.push(line);
      }
    }

    // add indication to the graph when there is no data
    if (lines.length === 0) {
      var noDataLine = {
        title: "No data",
        group: "No data"
      };
      groups.push(noDataLine.group)
      lines.push(noDataLine);
    }

    groups.sort(); // alphabetically

    // calculating wtg
    groups.forEach(function (group) {
      var sumOfWtg = 0;
      lines.forEach(function (line) {
        if (line.group == group) {
          sumOfWtg += line.wt;
        }
      });

      lines.forEach(function (line) {
        if (line.group == group) {
          line.wtg = line.wt / sumOfWtg * 1000;
        }
      });
    });

    var dataGroups =
      groups.map(function (group) {
        return lines.filter(function (exp) { return exp.group == group; });
      });

    // todo use per-group aggregates here
    var perGroup = {};
    dataGroups.forEach(function (dataGroup) {
      perGroup[dataGroup[0].group] = {};
      perGroup[dataGroup[0].group].wt = dataGroup.reduce(function sum(acc, line) {return line.wt != null ? acc+line.wt : acc;}, 0);
      if (perGroup[dataGroup[0].group].wt == 0) perGroup[dataGroup[0].group].wt = 1;
      perGroup[dataGroup[0].group].or = dataGroup.reduce(function sumproduct(acc, line) {return line.wt != null ? acc+line.or*line.wt : acc;}, 0) / perGroup[dataGroup[0].group].wt;
    });

    var orAggrFunc = { formulaName: "weightedMeanAggr", formulaParams: [ orFunc, wtFunc ] };
    var lclAggrFunc = { formulaName: "lowerConfidenceLimitAggr", formulaParams: [ orFunc, wtFunc ] };
    var uclAggrFunc = { formulaName: "upperConfidenceLimitAggr", formulaParams: [ orFunc, wtFunc ] };

    orAggrFunc.formula = lima.createFormulaString(orAggrFunc);
    lclAggrFunc.formula = lima.createFormulaString(lclAggrFunc);
    uclAggrFunc.formula = lima.createFormulaString(uclAggrFunc);

    var aggregates = {
      or: getDatumValue(orAggrFunc),
      lcl: getDatumValue(lclAggrFunc),
      ucl: getDatumValue(uclAggrFunc),
    }

    if (isNaN(aggregates.or*0) || isNaN(aggregates.lcl*0) || isNaN(aggregates.ucl*0)) {
      aggregates.lcl = 0;
      aggregates.ucl = 0;
    }

    // compute
    //   sum of wt
    //   min and max of wt
    //   min of lcl and aggr lcl
    //   max of ucl and aggr ucl
    var sumOfWt = 0;
    var minWt = Infinity;
    var maxWt = -Infinity;
    var minLcl = aggregates.lcl;
    var maxUcl = aggregates.ucl;

    if (isNaN(minLcl)) minLcl = 0;
    if (isNaN(maxUcl)) maxUcl = 0;

    lines.forEach(function (line) {
      if (line.or == null) return;
      sumOfWt += line.wt;
      if (line.wt < minWt) minWt = line.wt;
      if (line.wt > maxWt) maxWt = line.wt;
      if (line.lcl < minLcl) minLcl = line.lcl;
      if (line.ucl > maxUcl) maxUcl = line.ucl;
    });

    if (minLcl < -10) minLcl = -10;
    if (maxUcl > 10) maxUcl = 10;

    if (minWt == Infinity) minWt = maxWt = 1;
    if (sumOfWt == 0) sumOfWt = 1;

    var TICK_SPACING;


    // select tick spacing based on a rough estimate of how many ticks we'll need anyway
    var clSpread = (maxUcl - minLcl) / Math.LN10; // how many orders of magnitude we cover
    if (clSpread > 3) TICK_SPACING = [100];
    else if (clSpread > 1.3) TICK_SPACING = [10];
    else TICK_SPACING = [ 2, 2.5, 2 ]; // ticks at 1, 2, 5, 10, 20, 50, 100...


    // adjust minimum and maximum around decimal non-logarithmic values
    var newBound = 1;
    var tickNo = 0;
    while (Math.log(newBound) > minLcl) {
      tickNo -= 1;
      newBound /= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)]; // JS % can be negative
    }
    minLcl = Math.log(newBound) - .1;

    var startingTickVal = newBound;
    var startingTick = tickNo;

    newBound = 1;
    tickNo = 0;
    while (Math.log(newBound) < maxUcl) {
      newBound *= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)];
      tickNo += 1;
    }
    maxUcl = Math.log(newBound) + .1;

    var xRatio = 1/(maxUcl-minLcl)*parseInt(plotEl.dataset.graphWidth);

    // return the X coordinate on the graph that corresponds to the given logarithmic value
    function getX(val) {
      return (val-minLcl)*xRatio;
    }

    // adjust weights so that in case of very similar weights they don't range from minimum to maximum
    var MIN_WT_SPREAD=2.5;
    if (maxWt/minWt < MIN_WT_SPREAD) {
      minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
      maxWt = minWt * MIN_WT_SPREAD;
    }

    // minWt = 0; // todo we can uncomment this to make all weights relative to only the maximum weight
    var minWtSize = parseInt(plotEl.dataset.minWtSize);
    // square root the weights because we're using them as lengths of the side of a square whose area should correspond to the weight
    maxWt = Math.sqrt(maxWt);
    minWt = Math.sqrt(minWt);
    var wtRatio = 1/(maxWt-minWt)*(parseInt(plotEl.dataset.maxWtSize)-minWtSize);

    // return the box size for a given weight
    function getBoxSize(wt) {
      return (Math.sqrt(wt)-minWt)*wtRatio + minWtSize;
    }

    var currY = parseInt(plotEl.dataset.startHeight);
    var currGY = parseInt(plotEl.dataset.groupStartHeight);
    var hasInvalid = false;

    groups.forEach(function (group) {
      var groupAggregates = {
        or: 0,
        lcl: 0,
        ucl: 0,
        wt: 0
      };

      var groupMembers = 0; // counter
      var groupHasInvalid = false;

      var forestGroupT = _.findEl(plotEl, 'template.forest-group');
      var forestGroupEl = _.cloneTemplate(forestGroupT);

      currGY = parseInt(plotEl.dataset.groupStartHeight);

      forestGroupEl.setAttribute('transform', 'translate(' + plotEl.dataset.headingOffset + ',' + currY + ')');

      _.fillEls(forestGroupEl, '.label', group);

      var groupExperimentsEl = _.findEl(forestGroupEl, '.group-experiments');
      forestGroupT.parentElement.insertBefore(forestGroupEl, forestGroupT);

      // put experiments into the plot
      lines.forEach(function (line) {
        if (line.group === group) {
          var expT = _.findEl(plotEl, 'template.experiment');
          var expEl = _.cloneTemplate(expT);

          expEl.setAttribute('transform', 'translate(' + plotEl.dataset.groupLineOffset + ',' + currGY + ')');

          _.fillEls(expEl, '.expname', line.title);
          if (line.or != null) {
            groupMembers += 1;
            _.fillEls(expEl, '.or.lcl.ucl', Math.exp(line.or).toPrecision(3) + ' [' + Math.exp(line.lcl).toPrecision(3) + ", " + Math.exp(line.ucl).toPrecision(3) + ']');
            _.fillEls(expEl, '.wt', '' + (Math.round(line.wt / sumOfWt * 1000)/10) + '%');
            _.fillEls(expEl, '.wtg', (Math.round(line.wtg)/10) + '%');
            _.setAttrs(expEl, 'line.confidenceinterval', 'x1', getX(line.lcl));
            _.setAttrs(expEl, 'line.confidenceinterval', 'x2', getX(line.ucl));

            _.setAttrs(expEl, 'rect.weightbox', 'x', getX(line.or));
            _.setAttrs(expEl, 'rect.weightbox', 'width', getBoxSize(line.wt));
            _.setAttrs(expEl, 'rect.weightbox', 'height', getBoxSize(line.wt));

            groupAggregates.or += line.or;
            groupAggregates.lcl += line.lcl;
            groupAggregates.ucl += line.ucl;
            groupAggregates.wt += (Math.round(line.wt / sumOfWt * 1000)/10);
          } else {
            expEl.classList.add('invalid');
            hasInvalid = true;
            groupHasInvalid = true;
          }

          groupExperimentsEl.appendChild(expEl);

          currGY += parseInt(plotEl.dataset.lineHeight);
        }
      });

      // if stat != wt, then divide the groupAggregate sums by the number of valid lines in the group.
      for (var stat in groupAggregates) {
        if (stat != "wt") {
          groupAggregates[stat] /= groupMembers;
        }
        else {
          // avoid having too much decimals
          groupAggregates[stat] = groupAggregates[stat].toFixed(1);
        }
      }

      // put group summary into the plot
      if (!groupHasInvalid) {
        var sumT = _.findEl(plotEl, 'template.group-summary');
        var sumEl = _.cloneTemplate(sumT);

        _.fillEls(sumEl, '.sumname', "Total for " + group);
        sumEl.setAttribute('transform', 'translate(' + plotEl.dataset.groupLineOffset + ',' + currGY + ')');

        _.fillEls(sumEl, '.or.lcl.ucl', Math.exp(groupAggregates.or).toPrecision(3) + ' [' + Math.exp(groupAggregates.lcl).toPrecision(3) + ", " + Math.exp(groupAggregates.ucl).toPrecision(3) + ']');
        _.fillEls(sumEl, '.wt', groupAggregates.wt + '%');

        var lclX = getX(groupAggregates.lcl);
        var uclX = getX(groupAggregates.ucl);
        var orX = getX(groupAggregates.or);
        if ((uclX - lclX) < parseInt(plotEl.dataset.minDiamondWidth)) {
          var ratio = (uclX - lclX) / parseInt(plotEl.dataset.minDiamondWidth);
          lclX = orX + (lclX - orX) / ratio;
          uclX = orX + (uclX - orX) / ratio;
        }

        var confidenceInterval = "" + lclX + ",0 " + orX + ",-10 " + uclX + ",0 " + orX + ",10";

        _.setAttrs(sumEl, 'polygon.confidenceinterval', 'points', confidenceInterval);

        var groupSummaryEl = _.findEl(forestGroupEl, '.group-summary');
        groupSummaryEl.appendChild(sumEl);

        currGY += parseInt(plotEl.dataset.lineHeight);
      }
      currY += (currGY+ parseInt(plotEl.dataset.heightBetweenGroups));
    })




    // put axes into the plot
    var axesT = _.findEl(plotEl, 'template.axes');
    var axesEl = _.cloneTemplate(axesT);

    axesEl.setAttribute('transform', 'translate(' + plotEl.dataset.padding + ',' + currY + ')');

    _.setAttrs(axesEl, 'line.yaxis', 'y2', currY+parseInt(plotEl.dataset.extraLineLen));
    _.setAttrs(axesEl, 'line.yaxis', 'x1', getX(0));
    _.setAttrs(axesEl, 'line.yaxis', 'x2', getX(0));

    var tickT = _.findEl(axesEl, 'template.tick');
    var tickVal;
    while ((tickVal = Math.log(startingTickVal)) < maxUcl) {
      var tickEl = _.cloneTemplate(tickT);
      tickEl.setAttribute('transform', 'translate(' + getX(tickVal) + ',0)');
      _.fillEls(tickEl, 'text', (tickVal < 0 ? startingTickVal.toPrecision(1) : Math.round(startingTickVal)));
      tickT.parentElement.insertBefore(tickEl, tickT);
      startingTickVal = startingTickVal * TICK_SPACING[_.mod(startingTick, TICK_SPACING.length)];
      startingTick += 1;
    }

    plotEl.appendChild(axesEl);


    // put summary into the plot
    if (!isNaN(aggregates.or*0) && !hasInvalid) {
      currY += 2 * parseInt(plotEl.dataset.lineHeight);
      var sumT = _.findEl(plotEl, 'template.summary');
      var sumEl = _.cloneTemplate(sumT);

      sumEl.setAttribute('transform', 'translate(' + plotEl.dataset.padding + ',' + currY + ')');

      _.fillEls(sumEl, '.or.lcl.ucl', Math.exp(aggregates.or).toPrecision(3) + ' [' + Math.exp(aggregates.lcl).toPrecision(3) + ", " + Math.exp(aggregates.ucl).toPrecision(3) + ']');

      var lclX = getX(aggregates.lcl);
      var uclX = getX(aggregates.ucl);
      var orX = getX(aggregates.or);
      if ((uclX - lclX) < parseInt(plotEl.dataset.minDiamondWidth)) {
        var ratio = (uclX - lclX) / parseInt(plotEl.dataset.minDiamondWidth);
        lclX = orX + (lclX - orX) / ratio;
        uclX = orX + (uclX - orX) / ratio;
      }

      var confidenceInterval = "" + lclX + ",0 " + orX + ",-10 " + uclX + ",0 " + orX + ",10";

      _.setAttrs(sumEl, 'polygon.confidenceinterval', 'points', confidenceInterval);

      _.setAttrs(sumEl, 'line.guideline', 'x1', getX(aggregates.or));
      _.setAttrs(sumEl, 'line.guideline', 'x2', getX(aggregates.or));
      _.setAttrs(sumEl, 'line.guideline', 'y2', currY+parseInt(plotEl.dataset.lineHeight)+parseInt(plotEl.dataset.extraLineLen));

      plotEl.appendChild(sumEl);

      _.addEventListener(sumEl, '.positioningbutton', 'click', function (e) {
        plotEl.classList.toggle('maximized');
        localStorage.plotMaximized = plotEl.classList.contains('maximized') ? '1' : '';
        e.stopPropagation();

      })
    }

    // finish up
    plotEl.setAttribute('height', parseInt(plotEl.dataset.endHeight) + currY);
    plotEl.setAttribute('viewBox', "0 0 " + plotEl.getAttribute('width') + " " + plotEl.getAttribute('height'));
    // todo set plot widths based on maximum text sizes

    plotsContainer.appendChild(plotEl);
  }

  /* grape chart
   *
   *
   *    ####  #####    ##   #####  ######     ####  #    #   ##   #####  #####
   *   #    # #    #  #  #  #    # #         #    # #    #  #  #  #    #   #
   *   #      #    # #    # #    # #####     #      ###### #    # #    #   #
   *   #  ### #####  ###### #####  #         #      #    # ###### #####    #
   *   #    # #   #  #    # #      #         #    # #    # #    # #   #    #
   *    ####  #    # #    # #      ######     ####  #    # #    # #    #   #
   *
   *
   */

  function drawGrapeChart() {
    // prepare data:
    // first find the grapeChart aggregate, it gives us the parameters
    // then for every paper and every experiment, call appropriate functions to get or,lcl,ucl,wt
    //   data (array)
    //     paper
    //     exp
    //     group
    //     or
    //     lcl
    //     ucl
    //     wt
    //   aggregated
    //     or
    //     lcl
    //     ucl

    var plotsContainer = _.findEl('#metaanalysis > .plots');

    for (var k=0; k<currentMetaanalysis.graphs.length; k++) {
      var orFunc, wtFunc, lclFunc, uclFunc, moderatorParam, params, dataParams;

      if (currentMetaanalysis.graphs[k].formulaName && currentMetaanalysis.graphs[k].formulaName.indexOf('forestPlot') != -1) {
        continue;
      }

      for (var i=k; i<currentMetaanalysis.graphs.length; i++) {
        if (currentMetaanalysis.graphs[i].formulaName === 'grapeChartNumberGraph' && isColCompletelyDefined(currentMetaanalysis.graphs[i])) {
          params = currentMetaanalysis.graphs[i].formulaParams;
          dataParams = params.slice(0, 4); // the first param is for grouping
          orFunc = { formulaName: "logOddsRatioNumber", formulaParams: dataParams };
          wtFunc = { formulaName: "weightNumber", formulaParams: dataParams };
          lclFunc = { formulaName: "lowerConfidenceLimitNumber", formulaParams: dataParams };
          uclFunc = { formulaName: "upperConfidenceLimitNumber", formulaParams: dataParams };
          moderatorParam = params[4];
          break;
        }
        if (currentMetaanalysis.graphs[i].formulaName === 'grapeChartPercentGraph' && isColCompletelyDefined(currentMetaanalysis.graphs[i])) {
          params = currentMetaanalysis.graphs[i].formulaParams;
          dataParams = params.slice(0, 4); // the first param is for grouping
          orFunc = { formulaName: "logOddsRatioPercent", formulaParams: [dataParams[0], dataParams[2]] };
          wtFunc = { formulaName: "weightPercent", formulaParams: dataParams };
          lclFunc = { formulaName: "lowerConfidenceLimitPercent", formulaParams: dataParams };
          uclFunc = { formulaName: "upperConfidenceLimitPercent", formulaParams: dataParams };
          moderatorParam = params[4];
          break;
        }

      }

      if (i === currentMetaanalysis.graphs.length) {
        // we don't have any parameters for the grapeChart
        return;
      }

      // get the data
      orFunc.formula = lima.createFormulaString(orFunc);
      wtFunc.formula = lima.createFormulaString(wtFunc);
      lclFunc.formula = lima.createFormulaString(lclFunc);
      uclFunc.formula = lima.createFormulaString(uclFunc);

      var data = [];
      var groups = [];

      for (i=0; i<currentMetaanalysis.papers.length; i+=1) {
        for (var j=0; j<currentMetaanalysis.papers[i].experiments.length; j+=1) {
          if (isExcludedExp(currentMetaanalysis.papers[i].id, j)) continue;
          var line = {};
          line.paper = currentMetaanalysis.papers[i].title || 'new paper';
          line.exp = currentMetaanalysis.papers[i].experiments[j].title || 'new experiment';
          if (line.exp.match(/^\d+$/)) line.exp = 'Exp. ' + line.exp;
          line.or = getDatumValue(orFunc, j, i);
          line.wt = getDatumValue(wtFunc, j, i);
          line.lcl = getDatumValue(lclFunc, j, i);
          line.ucl = getDatumValue(uclFunc, j, i);
          line.group = getDatumValue(moderatorParam, j, i);

          if (line.group != null && line.group != '' && groups.indexOf(line.group) === -1) groups.push(line.group);

          // if any of the values is NaN or ±Infinity, disregard this experiment
          if (isNaN(line.or*0) || isNaN(line.lcl*0) || isNaN(line.ucl*0) || isNaN(line.wt*0) ||
              line.or == null || line.lcl == null || line.ucl == null || line.wt == null) {
            delete line.or;
            delete line.lcl;
            delete line.ucl;
            delete line.wt;
          }
          data.push(line);
        }
      }

      // add indication to the graph when there is no data
      if (data.length == 0) {
        var noDataLine = {
          paper: "No paper",
          exp: "No experiment",
          group: "No data"
        };
        groups.push(noDataLine.group);
        data.push(noDataLine);
      }

      var plotEl = _.cloneTemplate('grape-chart-template').children[0];
      var grapeChartId = 'grape-chart-' + k;

      plotEl.classList.toggle('maximized', !!localStorage.plotMaximized);
      plotsContainer.appendChild(plotEl);

      groups.sort(); // alphabetically

      var dataGroups =
        groups.map(function (group) {
          return data.filter(function (exp) { return exp.group == group; });
        });

      // todo use per-group aggregates here
      var perGroup = {};
      dataGroups.forEach(function (dataGroup) {
        perGroup[dataGroup[0].group] = {};
        perGroup[dataGroup[0].group].wt = dataGroup.reduce(function sum(acc, line) {return line.wt != null ? acc+line.wt : acc;}, 0);
        if (perGroup[dataGroup[0].group].wt == 0) perGroup[dataGroup[0].group].wt = 1;
        perGroup[dataGroup[0].group].or = dataGroup.reduce(function sumproduct(acc, line) {return line.wt != null ? acc+line.or*line.wt : acc;}, 0) / perGroup[dataGroup[0].group].wt;
      });

      // todo highlight the current experiment in forest plot and in grape chart

      // add an id to the current graph
      plotEl.setAttribute('data-graph-id', grapeChartId);

      // set chart width based on number of groups
      plotEl.setAttribute('width', parseInt(plotEl.dataset.zeroGroupsWidth) + groups.length * parseInt(plotEl.dataset.groupSpacing));
      plotEl.setAttribute('viewBox', "0 0 " + plotEl.getAttribute('width') + " " + plotEl.getAttribute('height'));

      var minWt = Infinity;
      var maxWt = -Infinity;
      var minOr = Infinity;
      var maxOr = -Infinity;

      data.forEach(function (exp) {
        if (exp.or == null) return;
        if (exp.wt < minWt) minWt = exp.wt;
        if (exp.wt > maxWt) maxWt = exp.wt;
        if (exp.or < minOr) minOr = exp.or;
        if (exp.or > maxOr) maxOr = exp.or;
      });

      if (minOr < -10) minOr = -10;
      if (maxOr > 10) maxOr = 10;

      if (minOr == Infinity) minOr = maxOr = 0;
      if (minWt == Infinity) minWt = maxWt = 1;

      var TICK_SPACING;

      // select tick spacing based on a rough estimate of how many ticks we'll need anyway
      var clSpread = (maxOr - minOr) / Math.LN10; // how many orders of magnitude we cover
      if (clSpread > 5) TICK_SPACING = [100];
      else if (clSpread > 2) TICK_SPACING = [10];
      else TICK_SPACING = [ 2, 2.5, 2 ]; // ticks at 1, 2, 5, 10, 20, 50, 100...

      // adjust minimum and maximum around decimal non-logarithmic values
      var newBound = 1;
      var tickNo = 0;
      while (Math.log(newBound) > minOr) {
        tickNo -= 1;
        newBound /= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)]; // JS % can be negative
      }
      minOr = Math.log(newBound) - .1;

      var startingTickVal = newBound;
      var startingTick = tickNo;

      newBound = 1;
      tickNo = 0;
      while (Math.log(newBound) < maxOr) {
        newBound *= TICK_SPACING[_.mod(tickNo, TICK_SPACING.length)];
        tickNo += 1;
      }
      maxOr = Math.log(newBound) + .1;

      var midOr = (minOr + maxOr) / 2;

      var yRatio = 1/(maxOr-minOr)*parseInt(plotEl.dataset.graphHeight);
      function getY(logVal) {
        if (logVal == null) return 0;
        return -(logVal-minOr)*yRatio;
      }

      function isTopHalf(logVal) {
        return logVal > midOr;
      }


      var MIN_WT_SPREAD=2.5;
      if (maxWt/minWt < MIN_WT_SPREAD) {
        minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
        maxWt = minWt * MIN_WT_SPREAD;
      }

      // minWt = 0; // todo we can uncomment this to make all weights relative to only the maximum weight
      var minGrapeSize = parseInt(plotEl.dataset.minGrapeSize);
      // square root the weights because we're using them as lengths of the side of a square whose area should correspond to the weight
      maxWt = Math.sqrt(maxWt);
      minWt = Math.sqrt(minWt);
      var wtRatio = 1/(maxWt-minWt)*(parseInt(plotEl.dataset.maxGrapeSize)-minGrapeSize);

      // return the grape radius for a given weight
      function getGrapeRadius(wt) {
        if (wt == null) return minGrapeSize;
        return (Math.sqrt(wt)-minWt)*wtRatio + minGrapeSize;
      }

      var groupT = _.findEl(plotEl, 'template.group-grapes');
      var groupTooltipsT= _.findEl(plotEl, 'template.group-tooltips');
      groups.forEach(function (group, index) {
        var groupData = dataGroups[index];

        var groupEl = _.cloneTemplate(groupT);
        var groupTooltipsEl = _.cloneTemplate(groupTooltipsT);
        groupT.parentElement.insertBefore(groupEl, groupT);
        groupTooltipsT.parentElement.insertBefore(groupTooltipsEl,groupTooltipsT);

        groupEl.setAttribute('transform', 'translate(' + (+plotEl.dataset.firstGroup + plotEl.dataset.groupSpacing*index) + ',0)');
        groupTooltipsEl.setAttribute('transform', 'translate(' + (+plotEl.dataset.firstGroup + plotEl.dataset.groupSpacing*index) + ',0)');

        _.fillEls(groupEl, 'text.label', group);
        _.setAttrs(groupEl, 'g.guideline', 'transform', 'translate(0,' + getY(perGroup[group].or) + ')');

        if (index === 0) groupEl.classList.add('with-legend');
        if (index === groups.length - 1) {
          groupEl.classList.add('with-pos-button');
          _.addEventListener(groupEl, '.positioningbutton', 'click', function (e) {
            plotEl.classList.toggle('maximized');
            localStorage.plotMaximized = plotEl.classList.contains('maximized') ? '1' : '';
            e.stopPropagation();
          })
        }

        var grapeT = _.findEl(groupEl, 'template.group-grapes-grape');
        var tooltipT = _.findEl(groupTooltipsEl, 'template.group-tooltips-grape');

        resetPositioning();
        groupData.forEach(function (exp, index) {
          precomputePosition(index, getY(exp.or), getGrapeRadius(exp.wt) + +plotEl.dataset.grapeSpacing); // distance the bubbles a bit
        });
        finalizePositioning();

        groupData.forEach(function (exp, index) {
          // grape
          var grapeEl = _.cloneTemplate(grapeT);
          var tooltipEl = _.cloneTemplate(tooltipT);
          grapeT.parentElement.insertBefore(grapeEl, grapeT);
          tooltipT.parentElement.insertBefore(tooltipEl, tooltipT);

          grapeEl.setAttribute('r', getGrapeRadius(exp.wt));
          _.setAttrs(tooltipEl, '.grape', 'r', getGrapeRadius(exp.wt));

          // x-position so grapes don't overlap
          var grapeX = getPosition(index);
          grapeEl.setAttribute('transform', 'translate(' + grapeX + ', ' + getY(exp.or) + ')')
          tooltipEl.setAttribute('transform', 'translate(' + grapeX + ', ' + getY(exp.or) + ')')

          _.fillEls(tooltipEl, 'text.paper', exp.paper);
          _.fillEls(tooltipEl, 'text.exp', exp.exp);
          if (exp.or != null) {
            _.fillEls(tooltipEl, 'text.or', Math.exp(exp.or).toPrecision(3));
            _.fillEls(tooltipEl, 'text.wt', '' + (exp.wt*100/perGroup[group].wt).toPrecision(3) + '%');
            _.fillEls(tooltipEl, 'text.ci', "" + exp.lcl.toPrecision(3) + ", " + exp.ucl.toPrecision(3));
          } else {
            grapeEl.classList.add('invalid');
            tooltipEl.classList.add('invalid');
          }

          if (isTopHalf(exp.or)) {
            _.addClass(tooltipEl, '.tooltip', 'tophalf');
          }

          var boxWidth = +plotEl.dataset.tooltipMinWidth;
          _.findEls(tooltipEl, '.tooltip text').forEach(function (text) {
            try {
              var w = text.getBBox().width;
              boxWidth = Math.max(boxWidth, w);
            } catch (e) {
              // firefox doesn't handle getBBox well, see https://bugzilla.mozilla.org/show_bug.cgi?id=612118
              // ignore the error, use default width
            }
          });

          _.setAttrs(tooltipEl, '.tooltip rect', 'width', boxWidth + (+plotEl.dataset.tooltipPadding));
        });
      });


      // put ticks onto the Y axis
      var tickT = _.findEl(plotEl, 'template.tick');
      var tickVal;
      while ((tickVal = Math.log(startingTickVal)) < maxOr) {
        var tickEl = _.cloneTemplate(tickT);
        tickEl.setAttribute('transform', 'translate(0,' + getY(tickVal) + ')');
        _.fillEls(tickEl, 'text', (tickVal < 0 ? startingTickVal.toPrecision(1) : Math.round(startingTickVal)));
        tickT.parentElement.insertBefore(tickEl, tickT);
        startingTickVal = startingTickVal * TICK_SPACING[_.mod(startingTick, TICK_SPACING.length)];
        startingTick += 1;
      }
    }
  }

  var positionedGrapes;
  function resetPositioning() {
    positionedGrapes = {
      pre: [],
      sorted: [],
      post: [],
      ybounds: new _.Bounds(), // this helps us center blocks of grapes
    };
  }

  function precomputePosition(index, y, r) {
    positionedGrapes.ybounds.add(y-r, y+r);
    positionedGrapes.pre[index] = positionedGrapes.sorted[index] = { index: index, y: y, r: r };
  }

  function finalizePositioning() {
    // position big grapes first so they tend to be more central
    var sortingStrategy = function (a,b) { return b.r - a.r; };
    positionedGrapes.sorted.sort(sortingStrategy);

    // compute X coordinates
    positionedGrapes.sorted.forEach(function (g1, index) {
      var xbounds = new _.Bounds();
      positionedGrapes.post.forEach(function (g2) {
        // check that the current grape is close enough to g on the y axis that they can touch
        if (Math.abs(g1.y - g2.y) < (g1.r + g2.r)) {

          // presence of g means current grape cannot be at g.x ± delta
          var delta = Math.sqrt((g1.r + g2.r)*(g1.r + g2.r) - (g1.y - g2.y)*(g1.y - g2.y));
          var min = g2.x - delta;
          var max = g2.x + delta;

          xbounds.add(min, max);
        }
      });

      // choose the nearest available x to 0
      g1.x = xbounds.getNearestOutsideValue(0);

      // todo? if 0, maybe keep left- and right-slack so we can move things around a bit afterwards

      positionedGrapes.post[index] = g1;
    });

    // center connecting groups
    // use ybounds to group grapes in buckets so we can center them together
    var buckets = [];
    positionedGrapes.pre.forEach(function (g) {
      var bucketNo = positionedGrapes.ybounds.indexOf(g.y);
      if (bucketNo == -1) throw new Error('assertion failed: grape not in ybounds'); // should never happen
      if (!buckets[bucketNo]) buckets[bucketNo] = [];
      buckets[bucketNo].push(g);
    });

    buckets.forEach(function (bucket) {
      var min = Infinity;
      var max = -Infinity;
      bucket.forEach(function (g) {
        min = Math.min(min, g.x - g.r);
        max = Math.max(max, g.x + g.r);
      })

      if (min < Infinity && Math.abs(min + max) > 1) {
        // got a connecting group that wants to be moved, move it to center
        var dx = (max + min) / 2;
        bucket.forEach(function (g) { g.x -= dx; });
      }
    })
  }

  function getPosition(i) {
    return positionedGrapes.pre[i].x;
  }


  /* edit tags
   *
   *
   *   ###### #####  # #####    #####   ##    ####   ####
   *   #      #    # #   #        #    #  #  #    # #
   *   #####  #    # #   #        #   #    # #       ####
   *   #      #    # #   #        #   ###### #  ###      #
   *   #      #    # #   #        #   #    # #    # #    #
   *   ###### #####  #   #        #   #    #  ####   ####
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

          // Excluding
          setPaperExclusionState(paper, tr);
          _.setDataProps(tr, '.papertitle .exclude', 'index', papIndex);
          _.addEventListener(tr, '.papertitle .exclude', 'click', excludePaper);
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
        addConfirmedUpdater(tr, '.exptitle.editing', '.exptitle + .exptitlerename', '.exptitle.editing ~ * .exprenamecancel', 'textContent', checkExperimentTitle, paper, ['experiments', expIndex, 'title'], deleteNewExperiment);

        // Now we track paperinfo@<index> and experimentinfo@<paper>,<exp>
        setupPopupBoxPinning(tr, '.paperinfo.popupbox', papIndex);
        setupPopupBoxPinning(tr, '.experimentinfo.popupbox', papIndex+','+expIndex);

        // Excluding
        setExperimentExclusionState(paper, expIndex, tr);
        _.setDataProps(tr, '.experimenttitle .exclude', 'id', paper.id+','+expIndex);
        _.addEventListener(tr, '.experimenttitle .exclude', 'click', excludeExperiment);

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

            addOnInputUpdater(td, '.value', 'textContent', trimmingSanitizer, paper, ['experiments', expIndex, 'data', col, 'value'], recalculateComputedData);

            var user = lima.getAuthenticatedUserEmail();
            _.fillEls (td, '.valenteredby', val && val.enteredBy || user);
            _.setProps(td, '.valenteredby', 'href', '/' + (val && val.enteredBy || user) + '/');
            _.fillEls (td, '.valctime', _.formatDateTime(val && val.ctime || Date.now()));

            setupPopupBoxPinning(td, '.datum.popupbox', papIndex + ',' + expIndex + ',' + col);

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
              _.setProps(td, '.formula', 'innerHTML', getColTitle(col, Infinity));
            });

            setupPopupBoxPinning(td, '.datum.popupbox', papIndex + ',' + expIndex + ',' + col.formula);

            td.classList.add('result');
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

  function fillComputedColumnHeading(metaanalysis, col /*, columnIndex */) {
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
      // we'll call setValidationErrorClass() in fillFormulaColumnsSelection

      // make sure formula columns array matches the number of expected parameters
      col.formulaParams.length = formula ? formula.parameters.length : 0;
      col.formula = lima.createFormulaString(col);

      // fill the columns selection
      fillFormulaColumnsSelection(metaanalysis, col, th, formula);

      _.scheduleSave(metaanalysis);
      recalculateComputedData();
    };

    var formula = lima.getFormulaById(col.formulaName);
    fillFormulaColumnsSelection(metaanalysis, col, th, formula);

    setupPopupBoxPinning(th, '.fullcolinfo.popupbox', col.formula);

    _.addEventListener(th, 'button.move', 'click', moveColumn);
    _.addEventListener(th, 'button.delete', 'click', deleteColumn);

    // fillComments('comment-template', th, '.commentcount', '.fullcolinfo.popupbox main', metaanalysis, ['columns', columnIndex, 'comments']);

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
    if (level != Infinity && col.number !== undefined) retval += '<span>' + col.number + '. </span>';
    retval += '<span>' + lima.getRichLabelById(col.formulaName) + '</span> (';

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
      if (!col.formula) throw new Error('every computed column/aggregate/graph should always have formula');
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
    // we need to empty the content to avoid graphs duplicates and drawing errors
    var plotsContainer = _.findEl('.plots');
    plotsContainer.innerHTML = '';
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
    var cacheId = getColIdentifier(aggregate);
    if (cacheId in dataCache.aggr) {
      if (dataCache.aggr[cacheId] === CIRCULAR_COMPUTATION_FLAG) {
        throw new Error('circular computation involving aggregate ' + cacheId);
      }
      return dataCache.aggr[cacheId];
    }

    dataCache.aggr[cacheId] = CIRCULAR_COMPUTATION_FLAG;

    var inputs = [];
    var currentInputArray;

    var val;

    if (isColCompletelyDefined(aggregate)) {
      var formula = lima.getAggregateFormulaById(aggregate.formulaName);
      if (formula == null) return NaN;

      // compute the value
      // if anything here throws an exception, value cannot be computed
      for (var i=0; i<aggregate.formulaParams.length; i++) {
        currentInputArray = [];
        for (var paperIndex = 0; paperIndex < currentMetaanalysis.papers.length; paperIndex++) {
          for (var expIndex = 0; expIndex < currentMetaanalysis.papers[paperIndex].experiments.length; expIndex++) {
            if (!isExcludedExp(currentMetaanalysis.papers[paperIndex].id, expIndex)) {
              currentInputArray.push(getDatumValue(aggregate.formulaParams[i], expIndex, paperIndex));
            }
          }
        }
        inputs.push(currentInputArray);
      }

      val = formula.func.apply(null, inputs);
      dataCache.aggr[cacheId] = val;
    }

    return val;
  }

  function getExperimentsTableDatumValue(colId, expIndex, paperIndex) {
    // check cache
    if (!dataCache.exp) dataCache.exp = {};
    var cacheId = getColIdentifier(colId);
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
        var formula = lima.getFormulaById(col.formulaName);
        if (formula == null) return NaN;

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
        !lima.getAggregateFormulaById(col.formulaName) &&
        !lima.getGraphFormulaById(col.formulaName)) return false;

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
    if (!paper.new) return;

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
      currentMetaanalysis.papers.push(newPaper);
      currentMetaanalysis.paperOrder.push(newPaper.id);
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

      var foundCurrentValue = false;

      // Now make an option for each column in metaanalysis
      // account for computed columns in metaanalysis.columns
      for (var j = 0; j < metaanalysis.columns.length; j++){
        var colId = metaanalysis.columns[j];
        var found = makeOption(colId, aggregate, aggregate.formulaParams[i], select);
        foundCurrentValue = foundCurrentValue || found;
      }

      // if the parameter is a computed value that isn't itself a column of the metaanalysis, add it as the last option
      if (!foundCurrentValue && aggregate.formulaParams[i]) {
        colId = aggregate.formulaParams[i];
        makeOption(colId, aggregate, colId, select);
      }

      setValidationErrorClass();

      // listen to changes of the dropdown box
      // preserve the value of i inside this code
      (function(i, select){
        select.onchange = function(e) {
          aggregate.formulaParams[i] = lima.parseFormulaString(e.target.value);
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


/* BANNER HERE FOR 'graphs'

*/

// TODO: Revisit, trim unnecessary bits
function fillGraphTable(metaanalysis) {
  var table = _.cloneTemplate('graphs-table-template');
  var addGraphNode = _.findEl(table, 'tr.add');

  metaanalysis.graphs.forEach(function (graph, graphIndex) {
    var graphEl = _.cloneTemplate('graph-row-template').children[0];
    addGraphNode.parentElement.insertBefore(graphEl, addGraphNode);

    var graphValTd = _.findEl(graphEl, 'td');
    // Editing Options
    // Add an option for every graph formula we know
    var graphFormulas = lima.listGraphFormulas();
    var graphFormulasDropdown = _.findEl(graphEl, 'select.graphformulas')
    for (var i = 0; i < graphFormulas.length; i++){
      var el = document.createElement("option");
      el.textContent = graphFormulas[i].label;
      el.value = graphFormulas[i].id;
      if (graph.formulaName === el.value) {
        el.selected = true;
        graphFormulasDropdown.classList.remove('validationerror');
      }
      graphFormulasDropdown.appendChild(el);
    }

    graphFormulasDropdown.onchange = function(e) {
      graph.formulaName = e.target.value;
      graph.formula = lima.createFormulaString(graph);

      var formula = lima.getGraphFormulaById(graph.formulaName);
      if (formula) {
        graphFormulasDropdown.classList.remove('validationerror');
      } else {
        graphFormulasDropdown.classList.add('validationerror');
      }
      // we'll call setValidationErrorClass() in fillGraphColumnsSelection

      // make sure formula columns array matches the number of expected parameters
      graph.formulaParams.length = formula ? formula.parameters.length : 0;

      // fill in the current formula
      _.fillEls(graphEl, '.formula', formula ? formula.label : 'error'); // the 'error' string should not be visible

      // fill the columns selection
      fillGraphColumnsSelection(metaanalysis, graph, graphEl, formula);

      _.scheduleSave(metaanalysis);
      recalculateComputedData();
    };

    var graphFormula = lima.getGraphFormulaById(graph.formulaName);
    fillGraphColumnsSelection(metaanalysis, graph, graphEl, graphFormula);

    setupPopupBoxPinning(graphEl, '.datum.popupbox', graph.formula);
    _.setDataProps(graphEl, '.datum.popupbox', 'index', graphIndex);

    _.addEventListener(graphEl, 'button.move', 'click', moveGraph);
    _.addEventListener(graphEl, 'button.delete', 'click', deleteGraph);

    fillGraphInformation(graphEl, graph);
    fillComments('comment-template', graphValTd, '.commentcount', '.datum.popupbox main', metaanalysis, ['graphs', graphIndex, 'comments']);
  });

  // Event handlers
  _.addEventListener(table, 'tr.add button.add', 'click', addNewGraphToMetaanalysis);

  var graphsContainer = _.findEl('#metaanalysis .graphs');
  graphsContainer.appendChild(table);
}

function fillGraphInformation(graphEl, graph) {
  _.setProps(graphEl, '.richgraphlabel', 'innerHTML', getColTitle(graph, 1));
  _.setProps(graphEl, '.fullgraphlabel', 'innerHTML', getColTitle(graph, Infinity));
  // todo something for the non-editing case
}

function fillGraphColumnsSelection(metaanalysis, graph, graphEl, formula) {
  // editing drop-down boxes for parameter columns
  var graphColumnsSelectionEl = _.findEl(graphEl, '.graphcolumnsselection');
  // clear out old children.
  graphColumnsSelectionEl.innerHTML = '';

  if (!formula) return;

  var noOfParams = formula.parameters.length;

  for (var i = 0; i < noOfParams; i++){
    // Make a select dropdown
    var label = document.createElement('label');
    label.textContent = formula.parameters[i] + ': ';
    graphColumnsSelectionEl.appendChild(label);

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
      var found = makeOption(colId, graph, graph.formulaParams[i], select);
      foundCurrentValue = foundCurrentValue || found;
    }

    // if the parameter is a computed value that isn't itself a column of the metaanalysis, add it as the last option
    if (!foundCurrentValue) {
      colId = graph.formulaParams[i];
      makeOption(colId, graph, colId, select);
    }

    setValidationErrorClass();

    // listen to changes of the dropdown box
    // preserve the value of i inside this code
    (function(i, select){
      select.onchange = function(e) {
        graph.formulaParams[i] = lima.parseFormulaString(e.target.value);
        graph.formula = lima.createFormulaString(graph);
        if (e.target.value) {
          select.classList.remove('validationerror');
        } else {
          select.classList.add('validationerror');
        }
        setValidationErrorClass();
        _.scheduleSave(metaanalysis);
        fillGraphInformation(graphEl, graph);
        recalculateComputedData();
      };
    })(i, select);

  }

  fillGraphInformation(graphEl, graph);
}

function addNewGraphToMetaanalysis() {
  var graph = {formulaName: null, formulaParams: []};
  graph.formula = lima.createFormulaString(graph);
  currentMetaanalysis.graphs.push(graph);
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
  var allTitlesNextUpdate = 0;

  // now retrieve the list of all titles for checking uniqueness
  function loadAllTitles() {
    var curtime = Date.now();
    if (allTitlesNextUpdate < curtime) {
      allTitlesNextUpdate = curtime + 5 * 60 * 1000; // update titles no less than 5 minutes from now
      fetch('/api/titles')
      .then(_.fetchJson)
      .then(function (titles) {
        allTitles = titles;
        if (lima.userLocalStorage) {
          loadLocalMetaanalysesList();
          Object.keys(localMetaanalyses).forEach(function (localURL) {
            var title = extractMetaanalysisTitleFromUrl(localURL);
            if (allTitles.indexOf(title) === -1) allTitles.push(title);
          })
        }
      })
      .catch(function (err) {
        console.error('problem getting metaanalysis titles');
        console.error(err);
      });
    }
  }

  // todo this should be shared with papers.js in tools.js
  function checkTitleUnique(title, el) {
    if (title === '') throw null; // no message necessary
    if (title === 'new-paper' || title === 'new-metaanalysis') throw '"new-paper/new-metaanalysis" are reserved titles';
    if (!title.match(_.lettersAndNumbersRE)) throw 'metaanalysis short name cannot contain spaces or special characters';
    loadAllTitles();
    if (title !== el.dataset.origTitle && allTitles.indexOf(title) !== -1) {
      // try to give a useful suggestion for common names like Juliet94a
      var match = title.match(/(^.*[0-9]+)([a-zA-Z]?)$/);
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
    if (!savePendingInterval) savePendingInterval = setInterval(savePendingTick, 60000);
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

    if (lima.userLocalStorage) return saveMetaanalysisLocally(self);

    return lima.getGapiIDToken()
      .then(function(idToken) {

        // don't send paper data unnecessarily, it'd get ignored by the server anyway
        // so create a shallow copy without the papers and send that
        var toSend = Object.assign({}, currentMetaanalysis);
        delete toSend.papers;
        if (toSend.new) delete toSend.id;

        return fetch(currentMetaanalysisUrl, {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: JSON.stringify(toSend),
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

  var localMetaanalyses;

  function loadLocalMetaanalysesList() {
    if (!localMetaanalyses) {
      if (localStorage.metaanalyses) {
        localMetaanalyses = JSON.parse(localStorage.metaanalyses);
      } else {
        localMetaanalyses = {};
      }
    }
    return localMetaanalyses;
  }

  function loadAllLocalMetaanalyses() {
    loadLocalMetaanalysesList();
    return Object.keys(localMetaanalyses).map(loadLocalMetaanalysisWithoutPapers);
  }

  function loadLocalMetaanalysisWithoutPapers(path) {
    var val = localStorage[localMetaanalyses[path]];
    if (!val) throw new Error('cannot find local metaanalysis at ' + path);

    return JSON.parse(val);
  }

  function loadLocalMetaanalysis(path) {
    var val = loadLocalMetaanalysisWithoutPapers(path);

    val.papers = [];

    var loadingPromises = [];

    // load all the papers in this metaanalysis
    if (Array.isArray(val.paperOrder)) {
      val.paperOrder.forEach(function (id, index) {
        loadingPromises.push(
          Promise.resolve(id)
          .then(lima.requestPaperById)
          .then(function (paper) { val.papers[index] = paper; }));
      });
    }

    return Promise.all(loadingPromises)
      .then(function() { return initMetaanalysis(val); });
    // todo also load the metaanalysis from the server and check if it is outdated
  }

  function saveMetaanalysisLocally(metaanalysis) {
    try {
      loadLocalMetaanalysesList();
      if (lima.updatePageURL && metaanalysis.new) lima.updatePageURL();
      var localURL = createPageURL(lima.localStorageUserEmailAddress, metaanalysis.title);
      localMetaanalyses[localURL] = metaanalysis.id;

      if (!metaanalysis.storedLocally) {
        console.log('forcing save of all papers');
        metaanalysis.papers.forEach(function (paper) { paper.save(); });
      }

      metaanalysis.storedLocally = Date.now();

      // don't save paper data, it's saved elsewhere
      // so create a shallow copy without the papers and save that
      var toSave = Object.assign({}, metaanalysis);
      delete toSave.papers;

      localStorage[metaanalysis.id] = JSON.stringify(toSave);
      localStorage.metaanalyses = JSON.stringify(localMetaanalyses);
      console.log('metaanalysis ' + metaanalysis.id + ' saved locally');
    } catch (e) {
      console.error(e);
      return Promise.reject(new Error('failed to save metaanalysis ' + metaanalysis.id + ' locally'));
    }
  }

  /* excluding
   *
   *
   *   ###### #    #  ####  #      #    # #####  # #    #  ####
   *   #       #  #  #    # #      #    # #    # # ##   # #    #
   *   #####    ##   #      #      #    # #    # # # #  # #
   *   #        ##   #      #      #    # #    # # #  # # #  ###
   *   #       #  #  #    # #      #    # #    # # #   ## #    #
   *   ###### #    #  ####  ######  ####  #####  # #    #  ####
   *
   *
   */
  function excludePaper() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the excluding
    setTimeout(doExcludePaper, 0, this);
  }

  function doExcludePaper(el) {
    var papIndex = el.dataset.index;
    var paper = currentMetaanalysis.papers[papIndex];

    paper.experiments.forEach(function(exp, expIndex) {
      var index = currentMetaanalysis.excludedExperiments.indexOf(paper.id+','+expIndex);
      if (el.checked) { // include experiments
        if (index !== -1) currentMetaanalysis.excludedExperiments.splice(index, 1);
      } else { // exclude
        if (index === -1) currentMetaanalysis.excludedExperiments.push(paper.id+','+expIndex);
      }
      setExperimentExclusionState(paper, expIndex);
    });

    var tr = _.findPrecedingEl(el, 'tr');
    setPaperExclusionState(paper, tr);
    recalculateComputedData();

    _.scheduleSave(currentMetaanalysis);
  }

  function setPaperExclusionState(paper, tr) {
    var paperIndex;
    if (typeof paper === 'string') {
      // we got a paperID instead of paper
      for (paperIndex=0; paperIndex<currentMetaanalysis.papers.length; paperIndex+=1) {
        if (currentMetaanalysis.papers[paperIndex].id === paper) {
          paper = currentMetaanalysis.papers[paperIndex];
          break;
        }
      }
    }
    if (!tr && paperIndex != null) {
      var checkbox = _.findEl('#metaanalysis table.experiments .papertitle input.exclude[data-index="' + paperIndex + '"]');
      tr = _.findPrecedingEl(checkbox, 'tr');
    }
    var excluded = excludedExperimentsInPaper(paper);
    if (excluded == paper.experiments.length) { // all
      _.setProps(tr, '.papertitle .exclude', 'checked', false);
      _.setProps(tr, '.papertitle .exclude', 'indeterminate', false);
      tr.classList.add("papexcluded");
    } else if (excluded > 0) { // at least one
      _.setProps(tr, '.papertitle .exclude', 'indeterminate', true);
      tr.classList.remove("papexcluded");
    } else {
      _.setProps(tr, '.papertitle .exclude', 'checked', true);
      _.setProps(tr, '.papertitle .exclude', 'indeterminate', false);
      tr.classList.remove("papexcluded");
    }
  }

  function setExperimentExclusionState(paper, expIndex, tr) {
    var paperId = typeof paper === 'string' ? paper : paper.id;

    if (!tr) {
      // find the row for this experiment through its exclusion checkbox
      var checkbox = _.findEl('#metaanalysis table.experiments .experimenttitle input.exclude[data-id="' + paperId + ',' + expIndex + '"]');
      tr = _.findPrecedingEl(checkbox, 'tr');
    }
    if (isExcludedExp(paperId, expIndex)) {
      _.setProps(tr, '.experimenttitle .exclude', 'checked', false)
      tr.classList.add('excluded');
    } else {
      _.setProps(tr, '.experimenttitle .exclude', 'checked', true)
      tr.classList.remove('excluded');
    }
  }

  function excludeExperiment() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doExcludeExperiment, 0, this);
  }

  function doExcludeExperiment(el) {
    // takes the form of paperId,expIndex
    var id = el.dataset.id;

    // include experiment
    if (el.checked) {
      var index = currentMetaanalysis.excludedExperiments.indexOf(id);
      currentMetaanalysis.excludedExperiments.splice(index, 1);
    } else { // exclude
      currentMetaanalysis.excludedExperiments.push(id);
    }

    var splitId = id.split(',');
    setExperimentExclusionState(splitId[0], splitId[1]);
    setPaperExclusionState(splitId[0]);
    recalculateComputedData();
    _.scheduleSave(currentMetaanalysis);
  }

  // take paper and expIndex, use it to check if Id in the form <paperId>,<expIndex>
  // exists in excludedExperiments
  function isExcludedExp(paperId, expIndex) {
    return currentMetaanalysis.excludedExperiments.indexOf(paperId+','+expIndex) !== -1;
  }

  // Return No of excludedExperiments within a paper
  function excludedExperimentsInPaper(paper) {
    var excluded = 0;
    paper.experiments.forEach(function(experiment, expIndex) {
      if (isExcludedExp(paper.id, expIndex)) {
        excluded++;
      }
    });

    return excluded;
  }

  function replaceExcludedPaperId(oldId, newId) {
    var retval = false;
    if (oldId == null) return false;
    currentMetaanalysis.excludedExperiments.forEach(function (expId, index) {
      var split = expId.split(',');
      if (split[0] == oldId) {
        currentMetaanalysis.excludedExperiments[index] = newId + ',' + split[1];
        retval = true;
      }
    });
    return retval;
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
    var element = _.findEl(_.findPrecedingEl(e.target, 'th'), '.fullcolinfo.popupbox');
    var index = 0;

    // If element == null, it's the 'add column' button, so start at the end.
    if (element == null) {
      index = currentMetaanalysis.columns.length-1;
    } else {
      index = parseInt(element.dataset.index)-1;
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

/* BANNER FOR 'changing graphs' HERE
*/

// TODO: Revisit this to make sure it makes sense still

  function moveGraph() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doMoveGraph, 0, this);
  }

  function doMoveGraph(el) {
    var up = el.classList.contains('up');
    var most = el.classList.contains('most');
    var graphIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(graphIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.graphs[graphIndex]) return console.error('graph[' + graphIndex + '] not found in graphs!');
    var newPosition = findNextGraph(graphIndex, up, most);
    _.moveArrayElement(currentMetaanalysis.graphs, graphIndex, newPosition);
    updateMetaanalysisView();
    _.scheduleSave(currentMetaanalysis);
  }

  /*
   * find where to move an graph from its current index;
   * `up` indicates direction (up meaning left in array order); if `most`, move to the beginning (top) or end (bottom) of the graph list.
   */
  function findNextGraph(currentIndex, up, most) {
    if (up) {
      if (most || currentIndex <= 0) return 0;
      currentIndex -= 1;
    } else {
      if (most) return currentMetaanalysis.graphs.length - 1;
      currentIndex += 1;
    }
    return currentIndex;
  }

  function deleteGraph() {
    // a click will pin the box,
    // this timeout makes sure the click gets processed first and then we do the moving
    setTimeout(doDeleteGraph, 0, this);
  }

  function doDeleteGraph(el) {
    var graphIndex = parseInt(_.findPrecedingEl(el, 'div.popupbox').dataset.index);
    if (isNaN(graphIndex)) return; // we don't know what to move

    if (!currentMetaanalysis.graphs[graphIndex]) return console.error('graph[' + graphIndex + '] not found in graphs!');
    currentMetaanalysis.graphs.splice(graphIndex, 1);
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
    // this happens in metaanalysis.html
    lima.checkToPreventForcedSaving = checkToPreventForcedSaving;
    lima.checkToPreventLeaving = checkToPreventSaving;
    lima.checkToPreventSaving = checkToPreventSaving;
    lima.saveError = saveError;
    lima.savePendingStarted = savePendingStarted;
    lima.savePendingStopped = savePendingStopped;
    lima.saveStarted = saveStarted;
    lima.saveStopped = saveStopped;
    lima.updateAfterColumnSave = updateAfterColumnSave;
    lima.updateAfterPaperSave = updateAfterPaperSave;
    lima.updatePageURL = updatePageURL;
    lima.updateView = updateMetaanalysisView;

    // for testing
    lima.pinPopupBox = pinPopupBox;
    lima.unpinPopupBox = unpinPopupBox;
    lima.assignDeepValue = assignDeepValue;
    lima.getDeepValue = getDeepValue;
    lima.getAllTitles = function(){return allTitles;};
    lima.getCurrentMetaanalysis = function(){return currentMetaanalysis;};
    lima.savePendingMax = 0;
  }

})(window, document);
