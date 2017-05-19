(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';

  var lima = window.lima;

  lima.GRAPH_TYPE = { type: 'graph' };

  lima.listGraphFormulas = function listGraphFormulas() {
    var retval = [
      {
        id: 'forestPlotGraph',
        label: 'Forest Plot (fractions)',
        parameters: [ 'group 1 (e.g. experimental)', 'group 1 N', 'group 2 (e.g. control)', 'group 2 N' ],
      },
      {
        id: 'forestPlotPercentGraph',
        label: 'Forest Plot (percentages)',
        parameters: [ 'group 1 (e.g. experimental percentage)', 'group 1 N', 'group 2 (e.g. control percentage)', 'group 2 N' ],
      },
      {
        id: 'forestPlotNumberGraph',
        label: 'Forest Plot (numbers affected)',
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N' ],
      },
      {
        id: 'forestPlotGroupGraph',
        label: 'Forest Plot With Groups (fractions)',
        parameters: [ 'group 1 (e.g. experimental)', 'group 1 N', 'group 2 (e.g. control)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'forestPlotGroupPercentGraph',
        label: 'Forest Plot With Groups (percentages)',
        parameters: [ 'group 1 (e.g. experimental percentage)', 'group 1 N', 'group 2 (e.g. control percentage)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'forestPlotGroupNumberGraph',
        label: 'Forest Plot With Groups (numbers affected)',
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'grapeChartGraph',
        label: 'Grape Chart (fractions)',
        parameters: [ 'group 1 (e.g. experimental)', 'group 1 N', 'group 2 (e.g. control)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'grapeChartPercentGraph',
        label: 'Grape Chart (percentages)',
        parameters: [ 'group 1 (e.g. experimental percentage)', 'group 1 N', 'group 2 (e.g. control percentage)', 'group 2 N', 'moderator' ],
      },
      {
        id: 'grapeChartNumberGraph',
        label: 'Grape Chart (numbers affected)',
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N', 'moderator' ],
      },
    ];
    retval.forEach(function(graph) { graph.type = lima.GRAPH_TYPE; });
    return retval;
  };

  lima.getGraphFormulaById = function getGraphFormulaById(id) {
    var graphFormulas = lima.listGraphFormulas();
    for (var i=0; i<graphFormulas.length; i++) {
      if (graphFormulas[i].id === id) return graphFormulas[i];
    }
    return null;
  };

})(window, document);
