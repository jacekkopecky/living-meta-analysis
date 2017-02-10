(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';

  var lima = window.lima;
  var _ = lima._;

  /* simple formulas
   *
   *
   *    ####  # #    # #####  #      ######    ######  ####  #####  #    # #    # #        ##    ####
   *   #      # ##  ## #    # #      #         #      #    # #    # ##  ## #    # #       #  #  #
   *    ####  # # ## # #    # #      #####     #####  #    # #    # # ## # #    # #      #    #  ####
   *        # # #    # #####  #      #         #      #    # #####  #    # #    # #      ######      #
   *   #    # # #    # #      #      #         #      #    # #   #  #    # #    # #      #    # #    #
   *    ####  # #    # #      ###### ######    #       ####  #    # #    #  ####  ###### #    #  ####
   *
   *
   */

  lima.listFormulas = function listFormulas() {
    // at some point, the server api might want to host a list of formulas with their definitions
    return [
      {
        id: 'logOddsRatio',
        label: 'Log Odds Ratio',
        func: logOddsRatio,
        parameters: [ 'experimental', 'control' ]
      },
      {
        id: 'logOddsRatioPercent',
        label: 'Log Odds Ratio (percentages)',
        func: logOddsRatioPercent,
        parameters: [ 'experimental (%)', 'control (%)' ]
      },
      {
        id: 'weight',
        label: 'Weight',
        func: weight,
        parameters: [ 'experimental outcome', 'experimental N', 'control outcome', 'control N' ]
      },
      {
        id: 'weightPercent',
        label: 'Weight (percentages)',
        func: weightPercent,
        parameters: [ 'experimental outcome (%)', 'experimental N', 'control outcome (%)', 'control N' ]
      },
    ];
  }

  lima.getFormulaById = function getFormulaById(id) {
    var formulas = lima.listFormulas();
    for (var i=0; i<formulas.length; i++) {
      if (formulas[i].id === id) return formulas[i];
    }
    return null;
  }

  // here start the functions implementing the formulas

  function logOddsRatio (experimental, control) {
    // validate the input
    experimental = _.strictToNumber(experimental);
    control = _.strictToNumber(control);

    // perform the calculation
    // may return NaN or infinities
    return Math.log((control/(1-control))/(experimental/(1-experimental)));
  }

  function logOddsRatioPercent (experimental, control) {
    // validate the input
    experimental = _.strictToNumber(experimental);
    control = _.strictToNumber(control);

    // perform the calculation
    // may return NaN or infinities
    return logOddsRatio(experimental/100, control/100);
  }

  function weight (Me, Ne, Mc, Nc) {
    // validate the input
    Me = _.strictToNumber(Me);
    Ne = _.strictToNumber(Ne);
    Mc = _.strictToNumber(Mc);
    Nc = _.strictToNumber(Nc);

    // perform the calculation
    // may return NaN or infinities
    return 1 / ( 1/(Me*Ne) + 1/((1-Me)*Ne) + 1/(Mc*Nc) + 1/((1-Mc)*Nc) );
  }

  function weightPercent (Me, Ne, Mc, Nc) {
    // validate the input
    Me = _.strictToNumber(Me);
    Ne = _.strictToNumber(Ne);
    Mc = _.strictToNumber(Mc);
    Nc = _.strictToNumber(Nc);

    // perform the calculation
    // may return NaN or infinities
    return weight(Me/100, Ne, Mc/100, Nc);
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

  lima.listAggregateFormulas = function listAggregateFormulas() {
    return [
      {
        id: 'sum',
        label: 'Sum',
        func: sum,
        parameters: ['values']
      },
      {
        id: 'sumproduct',
        label: 'Sum of Product',
        func: sumproduct,
        parameters: ['values1', 'values2'] // There might be more appropriate names for these. Factor1/2?
      },
    ];
  }

  lima.getAggregateFormulaById = function getAggregateFormulaById(id) {
    var aggregateFormulas = lima.listAggregateFormulas();
    for (var i=0; i<aggregateFormulas.length; i++) {
      if (aggregateFormulas[i].id === id) return aggregateFormulas[i];
    }
    return null;
  }

  // here start the functions implementing the aggregates
  // Key structure to an aggregate function:
  //  - Parameters must be arrays
  //  - The functions return a single numerical value.
  //  - May return NaN or infinities.
  //  - Must gracefully handle wacko figures, including !VALUE and nulls.

  function sum (valueArray) {
    var total = 0;
    valueArray.forEach(function(value) {
      total += _.strictToNumberOrNull(value);
    })

    return total;
  }

  // TODO: Depending on implementation further in the future, this may require extra
  // validation, to be sure we are given correct Arrays.
  function sumproduct (valueArray1, valueArray2) {
    var total = 0;

    for (var i=0; i<valueArray1.length; i++) {
      var value1 = _.strictToNumberOrNull(valueArray1[i]);
      var value2 = _.strictToNumberOrNull(valueArray2[i]);
      total += value1 * value2;
    }

    return total;
  }


})(window, document);
