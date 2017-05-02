(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';

  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  lima.listGraphFormulas = function listGraphFormulas() {
    return [
      {
        id: 'forestPlotPercentGraph',
        label: 'Forest Plot (percentages)',
        func: forestPlotPercentGraph,
        parameters: [ 'group 1 (e.g. experimental percentage)', 'group 1 N', 'group 2 (e.g. control percentage)', 'group 2 N' ],
      },
      {
        id: 'forestPlotNumberGraph',
        label: 'Forest Plot (numbers affected)',
        func: forestPlotNumberGraph,
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N' ],
      },
      {
        id: 'grapeChartPercentGraph',
        label: 'Grape Chart (percentages)',
        func: grapeChartPercentGraph,
        parameters: [ 'group 1 (e.g. experimental percentage)', 'group 1 N', 'group 2 (e.g. control percentage)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'grapeChartNumberGraph',
        label: 'Grape Chart (numbers affected)',
        func: grapeChartNumberGraph,
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N', 'moderator' ],
      },
    ];
  }

lima.getGraphFormulaById = function getGraphFormulaById(id) {
  var graphFormulas = lima.listGraphFormulas();
  for (var i=0; i<graphFormulas.length; i++) {
    if (graphFormulas[i].id === id) return graphFormulas[i];
  }
  return null;
}

// here start the functions implementing the graphs
// Key structure to a graph function:
//  - Parameters must be arrays; may contain null/undefined values.
//  - The functions return a single numerical value.
//  - May return NaN or infinities.
//  - Must gracefully handle wacko figures, including !VALUE and nulls.

// TODO: Revisit, do we need to be the same as aggregates now?
// todo this is just a placeholder
function forestPlotPercentGraph () {
  return 'see above';
}
function grapeChartPercentGraph () {
  return 'see above';
}
function forestPlotNumberGraph () {
  return 'see above';
}
function grapeChartNumberGraph () {
  return 'see above';
}

})(window, document);
