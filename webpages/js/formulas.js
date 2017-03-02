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
        parameters: [ 'group 1 (e.g. experimental)', 'group 2 (e.g. control)' ]
      },
      {
        id: 'weight',
        label: 'Weight',
        func: weight,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimit',
        label: 'Lower Confidence Limit',
        func: lowerConfidenceLimit,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimit',
        label: 'Upper Confidence Limit',
        func: upperConfidenceLimit,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'logOddsRatioPercent',
        label: 'Log Odds Ratio (percentages)',
        func: logOddsRatioPercent,
        parameters: [ 'group 1 (e.g. experimental %)', 'group 2 (e.g. control %)' ]
      },
      {
        id: 'weightPercent',
        label: 'Weight (percentages)',
        func: weightPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimitPercent',
        label: 'Lower Confidence Limit (percentages)',
        func: lowerConfidenceLimitPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimitPercent',
        label: 'Upper Confidence Limit (percentages)',
        func: upperConfidenceLimitPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'logOddsRatioNumber',
        label: 'Log Odds Ratio (numbers affected)',
        func: logOddsRatioNumber,
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N' ]
      },
      {
        id: 'weightNumber',
        label: 'Weight (numbers affected)',
        func: weightNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimitNumber',
        label: 'Lower Confidence Limit (numbers affected)',
        func: lowerConfidenceLimitNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimitNumber',
        label: 'Upper Confidence Limit (numbers affected)',
        func: upperConfidenceLimitNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
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

  lima.getFormulaOrAggregateLabelById = function getFormulaOrAggregateLabelById(id) {
    var formula = lima.getFormulaById(id) || lima.getAggregateFormulaById(id);
    return (formula ? formula.label : 'no formula selected');
  }

  // here start the functions implementing the formulas

  function logOddsRatio (group1, group2) {
    // validate the input
    group1 = _.strictToNumber(group1);
    group2 = _.strictToNumber(group2);

    // perform the calculation
    // may return NaN or infinities
    return Math.log((group1/(1-group1))/(group2/(1-group2)));
  }

  function logOddsRatioPercent (group1, group2) {
    // validate the input
    group1 = _.strictToNumber(group1);
    group2 = _.strictToNumber(group2);

    // perform the calculation
    // may return NaN or infinities
    return logOddsRatio(group1/100, group2/100);
  }

  function logOddsRatioNumber (group1, n1, group2, n2) {
    // validate the input
    group1 = _.strictToNumber(group1);
    group2 = _.strictToNumber(group2);
    n1 = _.strictToNumber(n1);
    n2 = _.strictToNumber(n2);

    // perform the calculation
    // may return NaN or infinities
    return logOddsRatio(group1/n1, group2/n2);
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

  function weightNumber (Me, Ne, Mc, Nc) {
    return weight(Me/Ne, Ne, Mc/Nc, Nc);
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

  function lowerConfidenceLimitNumber (Me, Ne, Mc, Nc) {
    return lowerConfidenceLimit(Me/Ne, Ne, Mc/Nc, Nc);
  }

  function upperConfidenceLimitNumber (Me, Ne, Mc, Nc) {
    return upperConfidenceLimit(Me/Ne, Ne, Mc/Nc, Nc);
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
        id: 'weightedMean',
        label: 'Weighted Mean',
        func: weightedMeanAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'lowerConfidenceLimit', // todo suffix id with Aggr?
        label: 'Lower Confidence Limit',
        func: lowerConfidenceLimitAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'upperConfidenceLimit',
        label: 'Upper Confidence Limit',
        func: upperConfidenceLimitAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'sum',
        label: 'Sum',
        func: sumAggr,
        parameters: ['values'],
      },
      {
        id: 'forestPlot',
        label: 'Forest Plot',
        func: forestPlotAggr,
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N' ],
      },
      // {
      //   id: 'sumProduct',
      //   label: 'Sum of Product',
      //   func: sumProductAggr,
      //   parameters: ['values1', 'values2'] // There might be more appropriate names for these. Factor1/2?
      // },
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

  function sumAggr (valueArray) {
    var total = 0;
    valueArray.forEach(function(value) {
      total += _.strictToNumberOrNull(value);
    })

    return total;
  }

  // TODO: Depending on implementation further in the future, this may require extra
  // validation, to be sure we are given correct Arrays.
  function sumProductAggr (valueArray1, valueArray2) {
    var total = 0;

    for (var i=0; i<valueArray1.length; i++) {
      var value1 = _.strictToNumberOrNull(valueArray1[i]);
      var value2 = _.strictToNumberOrNull(valueArray2[i]);
      total += value1 * value2;
    }

    return total;
  }

  function weightedMeanAggr (valArray, weightArray) {
    return (sumProductAggr (valArray,weightArray) / sumAggr(weightArray));
  }

  function varianceAggr (weightArray) {
    return 1/sumAggr(weightArray);
  }

  function standardErrorAggr (weightArray) {
    return Math.sqrt(varianceAggr(weightArray));
  }

  function lowerConfidenceLimitAggr (valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) - 1.96 * standardErrorAggr(weightArray);
  }

  function upperConfidenceLimitAggr (valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) + 1.96 * standardErrorAggr(weightArray);
  }

  // todo this is just a placeholder
  function forestPlotAggr () {
    return 'see above';
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

  // this regexp matches the outside of function formulas of the type
  // "sumProduct(/id/col/1473674381680,neg(/id/col/1473674325686))"
  var functionRegex = /^([^(),\s]+)\s*(\((.*)\))?$/;

  // parse nested function formulas of the type "a(b(c,d),e,f(g))"
  // where parameters can contain any character except (),\s
  lima.parseFormulaString = function parseFormulaString(str) {
    if (typeof str !== 'string') return null;

    str = str.trim();
    if (str.length == 0) return null;

    var match = str.match(functionRegex);
    if (!match) return null;

    // if we don't have parentheses, the string is just a single identifier
    if (!match[2]) return match[1];

    // otherwise it's a function
    var retval = {}
    retval.formulaName = match[1];
    if (match[3] && match[3].trim()) {
      var params = splitParams(match[3]);
      if (params == null) return null;

      retval.formulaParams = [];
      for (var i=0; i<params.length; i+=1) {
        var param = lima.parseFormulaString(params[i]);
        if (param == null) return null;
        retval.formulaParams.push(param);
      }
    } else {
      retval.formulaParams = [];
    }
    retval.formula = lima.createFormulaString(retval);
    return retval;
  }

  // this function splits a string by commas, ignoring commas within parentheses
  // it does a simple counting of parentheses
  // return null if we encounter unmatched parentheses, or the parameter is not a string
  function splitParams(str) {
    if (typeof str !== 'string') return null;
    var retval = [];
    var start = 0;
    var parens = 0;

    for (var i=0; i<str.length; i+=1) {
      if (str[i] === '(') {
        parens += 1;
      } else

      if (str[i] === ')') {
        parens -= 1;
        if (parens < 0) return null; // unmatched ')'
      } else

      if (!parens && str[i] === ',') {
        retval.push(str.substring(start, i));
        start = i+1;
      }
    }

    if (parens) return null; // unmatched '('

    retval.push(str.substring(start, i));
    return retval;
  }

  lima.createFormulaString = function createFormulaString(obj) {
    if (typeof obj === 'string') return obj;
    var retval = '';
    retval += obj.formulaName || 'undefined';
    retval += '(';
    if (Array.isArray(obj.formulaParams)) {
      var params = obj.formulaParams.slice();
      for (var i=0; i<params.length; i+=1) {
        params[i] = createFormulaString(params[i] || 'undefined');
      }
      retval += params.join(',');
    }
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
      var json = JSON.stringify(obj);
      var str = lima.createFormulaString(obj);
      assert(str == expected, 'wrong formula string ' + str + ' for ' + JSON.stringify(obj) + ', expecting ' + expected);
      assert(JSON.stringify(obj) == json, 'the input should not change');
    }

    testObject({}, 'undefined()');
    testObject('foo', 'foo');
    testObject({formulaName: 'a'}, 'a()');
    testObject({formulaName: 'a', formulaParams: ['b', 'c']}, 'a(b,c)');
    testObject({formulaParams: ['b', 'c']}, 'undefined(b,c)');
    testObject({formulaParams: [ null, 'c']}, 'undefined(undefined,c)');

    var sparseArray = []
    sparseArray[1] = 'c';
    sparseArray.length = 4;
    testObject({formulaParams: sparseArray}, 'undefined(undefined,c,undefined,undefined)');
    testObject({formulaParams: [ {formulaName: 'a', formulaParams: ['b', 'c']}, 'd']}, 'undefined(a(b,c),d)');
    testObject({formulaName:"a",formulaParams:[{formulaName:"b",formulaParams:["c","d"]},"e",{formulaName:"f",formulaParams:["g"]}]}, 'a(b(c,d),e,f(g))');
    testObject({formulaName:"a",formulaParams:[{formulaName:"b",formulaParams:[null,"d"]},"e",{formulaParams:["g"]}]}, 'a(b(undefined,d),e,undefined(g))');
  });

  _.addTest(function testSplitParams(assert) {
    var val = splitParams({});
    assert(val === null, 'not a string should not be split');

    val = splitParams('');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('/id/col/4390');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '/id/col/4390', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('/id/col/4390,');
    assert(val.length == 2, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '/id/col/4390', 'bad param value in ' + JSON.stringify(val));
    assert(val[1] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('/id/col/4390() ,');
    assert(val.length == 2, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '/id/col/4390() ', 'bad param value in ' + JSON.stringify(val));
    assert(val[1] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('/id/col/4390(,)');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '/id/col/4390(,)', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('/id/col/4390(,');
    assert(val == null, 'should not split invalid string');

    val = splitParams('/id/col/4390),');
    assert(val == null, 'should not split invalid string');
  });

  _.addTest(function testParseFormulaString(assert) {
    var val = lima.parseFormulaString('a(b)');
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 1, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'b', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b(c,d),e,f(g))');
    assert(JSON.stringify(val) == '{"formulaName":"a","formulaParams":[{"formulaName":"b","formulaParams":["c","d"],"formula":"b(c,d)"},"e",{"formulaName":"f","formulaParams":["g"],"formula":"f(g)"}],"formula":"a(b(c,d),e,f(g))"}', "bad formula parsed in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b(c(d(e)),f),g,h(i))');
    assert(JSON.stringify(val) == '{"formulaName":"a","formulaParams":[{"formulaName":"b","formulaParams":[{"formulaName":"c","formulaParams":[{"formulaName":"d","formulaParams":["e"],"formula":"d(e)"}],"formula":"c(d(e))"},"f"],"formula":"b(c(d(e)),f)"},"g",{"formulaName":"h","formulaParams":["i"],"formula":"h(i)"}],"formula":"a(b(c(d(e)),f),g,h(i))"}', "bad formula parsed in " + JSON.stringify(val));

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

    val = lima.parseFormulaString(' a3490/4836 (  ) ');
    assert(val.formulaName == 'a3490/4836', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 0, "bad formula params len in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3 490/4836()');
    assert(val == null, "erroneously parsed formula " + JSON.stringify(val));

    val = lima.parseFormulaString(' a3490/4836  ');
    assert(val == 'a3490/4836', "erroneously parsed formula " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b,x(y,z),c(),d)');
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 4, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'b', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[3] == 'd', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaName == 'x', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams.length == 2, "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[0] == 'y', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[1] == 'z', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].formulaName == 'c', "bad second nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].formulaParams.length == 0, "bad second nested formula param in " + JSON.stringify(val));

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
    testCase = "f(a,b,c)"; shouldPass();
    testCase = "f(a,b)"; shouldPass();
    testCase = "f(ab)"; shouldPass();
    testCase = "f()"; shouldPass();
    testCase = "f(  )"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr (a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr( a/ewr/436632 ,b)"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/4366 32 , b)"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr /((436632 ,b )"; shouldPass();
    testCase = "flskjdf/ewr(a/ewr/436632, b ,4390)"; shouldPass();
    testCase = "flskjdf/ewr ( a/ewr/436632 , b , 4390)"; shouldPass();

    // negative test cases
    testCase = ""; shouldFail();
    testCase = "  "; shouldFail();
    testCase = "  fls kjdf/ewr ( a/ewr/436632 , b , 4390)"; shouldFail();
    testCase = "  flskjdf/ewr ( a/ewr/436632 , b , 4390) s"; shouldFail();
    testCase = "flskjdf/ewr(a/ewr/436632 ,b) "; shouldFail();
    testCase = " flskjdf/ewr(a/ewr/436632 ,b)"; shouldFail();
    testCase = "  flskjdf/ewr(a/ewr/436632 ,b)"; shouldFail();
    testCase = "fa,b)"; shouldFail();
    testCase = "f(a,b"; shouldFail();
    testCase = "(a,b)"; shouldFail();
    testCase = "a,b(a,b)"; shouldFail();
  });


})(window, document);
