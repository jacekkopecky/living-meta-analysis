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
        id: 'weight',
        label: 'Weight',
        func: weight,
        parameters: [ 'experimental outcome', 'experimental N', 'control outcome', 'control N' ]
      },
      {
        id: 'lowerConfidenceLimit',
        label: 'Lower Confidence Limit',
        func: lowerConfidenceLimit,
        parameters: [ 'experimental outcome', 'experimental N', 'control outcome', 'control N' ]
      },
      {
        id: 'upperConfidenceLimit',
        label: 'Upper Confidence Limit',
        func: upperConfidenceLimit,
        parameters: [ 'experimental outcome', 'experimental N', 'control outcome', 'control N' ]
      },
      {
        id: 'logOddsRatioPercent',
        label: 'Log Odds Ratio (percentages)',
        func: logOddsRatioPercent,
        parameters: [ 'experimental (%)', 'control (%)' ]
      },
      {
        id: 'weightPercent',
        label: 'Weight (percentages)',
        func: weightPercent,
        parameters: [ 'experimental outcome (%)', 'experimental N', 'control outcome (%)', 'control N' ]
      },
      {
        id: 'lowerConfidenceLimitPercent',
        label: 'Lower Confidence Limit (percentages)',
        func: lowerConfidenceLimitPercent,
        parameters: [ 'experimental outcome (%)', 'experimental N', 'control outcome (%)', 'control N' ]
      },
      {
        id: 'upperConfidenceLimitPercent',
        label: 'Upper Confidence Limit (percentages)',
        func: upperConfidenceLimitPercent,
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

  function variance (Me, Ne, Mc, Nc) {
    // validate the input
    Me = _.strictToNumber(Me);
    Ne = _.strictToNumber(Ne);
    Mc = _.strictToNumber(Mc);
    Nc = _.strictToNumber(Nc);

    // perform the calculation
    // may return NaN or infinities
    return 1/(Me*Ne) + 1/((1-Me)*Ne) + 1/(Mc*Nc) + 1/((1-Mc)*Nc);
  }

  function weight (Me, Ne, Mc, Nc) {
    return 1 / variance(Me, Ne, Mc, Nc);
  }

  function weightPercent (Me, Ne, Mc, Nc) {
    return weight(Me/100, Ne, Mc/100, Nc);
  }

  function standardError (Me, Ne, Mc, Nc) {
    return Math.sqrt(variance(Me, Ne, Mc, Nc));
  }

  function lowerConfidenceLimit (Me, Ne, Mc, Nc) {
    return logOddsRatio(Me, Mc) - 1.96 * standardError(Me, Ne, Mc, Nc);
  }

  function upperConfidenceLimit (Me, Ne, Mc, Nc) {
    return logOddsRatio(Me, Mc) + 1.96 * standardError(Me, Ne, Mc, Nc);
  }

  function lowerConfidenceLimitPercent (Me, Ne, Mc, Nc) {
    return lowerConfidenceLimit(Me/100, Ne, Mc/100, Nc);
  }

  function upperConfidenceLimitPercent (Me, Ne, Mc, Nc) {
    return upperConfidenceLimit(Me/100, Ne, Mc/100, Nc);
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
  //  - Parameters must be arrays; may contain null/undefined values.
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

  /* parsing
   *
   *
   *   #####    ##   #####   ####  # #    #  ####
   *   #    #  #  #  #    # #      # ##   # #    #
   *   #    # #    # #    #  ####  # # #  # #
   *   #####  ###### #####       # # #  # # #  ###
   *   #      #    # #   #  #    # # #   ## #    #
   *   #      #    # #    #  ####  # #    #  ####
   *
   *
   */

  // this regexp matches simple formulas of the type "sumproduct(/id/col/1473674381680,/id/col/1473674325686)"
  var functionRegex = /^\s*([^(\s]+)\s*\(((\s*[^,()\s]+\s*,)*\s*[^,()\s]+)?\s*\)\s*$/;

  // this only parses one-level (non-recursive) formulas for now
  lima.parseFormulaString = function parseFormulaString(str) {
    if (typeof str !== 'string') return null;

    var match = str.match(functionRegex);
    if (!match) return null;

    var retval = {}
    retval.formulaName = match[1];
    if (match[2]) {
      retval.formulaParams = match[2].split(',').map(function (val) { return val.trim(); });
    } else {
      retval.formulaParams = [];
    }

    return retval;
  }

  lima.createFormulaString = function createFormulaString(obj) {
    var retval = '';
    retval += obj.formulaName || 'undefined';
    retval += '(';
    if (Array.isArray(obj.formulaParams)) retval += obj.formulaParams.map(function (param) { return param || 'undefined'; }).join(',');
    retval += ')';
    return retval;
  }


  /* tests
   *
   *
   *   ##### ######  ####  #####  ####
   *     #   #      #        #   #
   *     #   #####   ####    #    ####
   *     #   #           #   #        #
   *     #   #      #    #   #   #    #
   *     #   ######  ####    #    ####
   *
   *
   */

  _.addTest(function testCreateFormulaString(assert) {
    function testObject(obj, expected) {
      var str = lima.createFormulaString(obj);
      assert(str == expected, 'wrong formula string ' + str + ' for ' + JSON.stringify(obj) + ', expecting ' + expected);
    }

    testObject({}, 'undefined()');
    testObject({formulaName: 'a'}, 'a()');
    testObject({formulaName: 'a', formulaParams: ['b', 'c']}, 'a(b,c)');
    testObject({formulaParams: ['b', 'c']}, 'undefined(b,c)');
    testObject({formulaParams: [ null, 'c']}, 'undefined(undefined,c)');
  });

  _.addTest(function testParseFormulaString(assert) {
    var val = lima.parseFormulaString('a(b)');
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 1, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'b', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString("undefined(undefined,undefined)");
    assert(val.formulaName == 'undefined', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 2, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'undefined', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == 'undefined', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b,c)');
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 2, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'b', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == 'c', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('logOddsRatio(/id/col/3490,/id/col/49306,/id/col/493)');
    assert(val.formulaName == 'logOddsRatio', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 3, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == '/id/col/3490', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == '/id/col/49306', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[2] == '/id/col/493', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3490/4836()');
    assert(val.formulaName == 'a3490/4836', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 0, "bad formula params len in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3490/4836(  )');
    assert(val.formulaName == 'a3490/4836', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 0, "bad formula params len in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3 490/4836()');
    assert(val == null, "erroneously parsed formula " + JSON.stringify(val));
  });

  _.addTest(function testFunctionRegex(assert) {
    var testCase;

    function shouldPass() {
      assert(testCase.match(functionRegex), '"' + testCase + '" should match but does not');
    }

    function shouldFail() {
      assert(!testCase.match(functionRegex), '"' + testCase + '" should not match but does');
    }

    // positive test cases
    testCase = "f(a,b)"; shouldPass();
    testCase = "f(ab)"; shouldPass();
    testCase = "f()"; shouldPass();
    testCase = "f(  )"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632 ,b)"; shouldPass();
    testCase = " flskjdf/ewr(a/ewr/436632 ,b)"; shouldPass();
    testCase = "  flskjdf/ewr(a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr (a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr( a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632 , b)"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632 ,b )"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632 ,b) "; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632, b ,4390) "; shouldPass();
    testCase = "  flskjdf/ewr ( a/ewr/436632 , b , 4390)"; shouldPass();

    // negative test cases
    testCase = ""; shouldFail();
    testCase = "  "; shouldFail();
    testCase = "  fls kjdf/ewr ( a/ewr/436632 , b , 4390)"; shouldFail();
    testCase = "  flskjdf/ewr ( a/ewr/436 632 , b , 4390)"; shouldFail();
    testCase = "  flskjdf/ewr ( a/ewr/436632 , b , 43 90)"; shouldFail();
    testCase = "  flskjdf/ewr ( a/ewr/436632 , b , 4390) s"; shouldFail();
    testCase = "fa,b)"; shouldFail();
    testCase = "f(a,b"; shouldFail();
    testCase = "(a,b)"; shouldFail();
    testCase = "f(,b)"; shouldFail();
    testCase = "f(a,)"; shouldFail();
    testCase = "f(a,b,)"; shouldFail();
  });


})(window, document);
