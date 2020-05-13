(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';

  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  // types (objects so we can quickly compare with ===)
  lima.FORMULA_TYPE = { type: 'formula' };
  lima.AGGREGATE_TYPE = { type: 'aggregate' };

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
    var retval = [
      {
        id: 'logOddsRatio',
        label: 'Log Odds Ratio (fractions)',
        func: logOddsRatio,
        parameters: [ 'group 1 (e.g. experimental)', 'group 2 (e.g. control)' ]
      },
      {
        id: 'logOddsRatioPercent',
        label: 'Log Odds Ratio (percentages)',
        func: logOddsRatioPercent,
        parameters: [ 'group 1 (e.g. experimental %)', 'group 2 (e.g. control %)' ]
      },
      {
        id: 'logOddsRatioNumber',
        label: 'Log Odds Ratio (numbers affected)',
        func: logOddsRatioNumber,
        parameters: [ 'group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N' ]
      },
      {
        id: 'weight',
        label: 'Weight (fractions)',
        func: weight,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'weightPercent',
        label: 'Weight (percentages)',
        func: weightPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'weightNumber',
        label: 'Weight (numbers affected)',
        func: weightNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimit',
        label: 'Lower Log Confidence Limit (fractions)',
        func: lowerConfidenceLimit,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimitPercent',
        label: 'Lower Log Confidence Limit (percentages)',
        func: lowerConfidenceLimitPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'lowerConfidenceLimitNumber',
        label: 'Lower Log Confidence Limit (numbers affected)',
        func: lowerConfidenceLimitNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimit',
        label: 'Upper Log Confidence Limit (fractions)',
        func: upperConfidenceLimit,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimitPercent',
        label: 'Upper Log Confidence Limit (percentages)',
        func: upperConfidenceLimitPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N' ]
      },
      {
        id: 'upperConfidenceLimitNumber',
        label: 'Upper Log Confidence Limit (numbers affected)',
        func: upperConfidenceLimitNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N' ]
      },
      {
        id: 'fixedEffectError',
        label: 'Fixed Effect Error',
        func: fixedEffectError,
        parameters: [ 'effect size', 'weight', 'grand weighted mean effect size' ],
      },
      {
        id: 'randomEffectWeight',
        label: 'Random Effect Model Weight (fractions)',
        func: randomEffectWeight,
        parameters: [ 'group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N', 'tauSquared' ]
      },
      {
        id: 'randomEffectWeightPercent',
        label: 'Random Effect Model Weight (percentages)',
        func: randomEffectWeightPercent,
        parameters: [ 'group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N', 'tauSquared' ]
      },
      {
        id: 'randomEffectWeightNumber',
        label: 'Random Effect Model Weight (numbers affected)',
        func: randomEffectWeightNumber,
        parameters: [ 'group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N', 'tauSquared' ]
      },
    ];
    retval.forEach(function(formula) { formula.type = lima.FORMULA_TYPE; });
    return retval;
  };

  function getFormulaById(id) {
    var formulas = lima.listFormulas();
    for (var i=0; i<formulas.length; i++) {
      if (formulas[i].id === id) return formulas[i];
    }
    return null;
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

  function fixedEffectError (es, wt, gwmes) {
    es = _.strictToNumber(es);
    wt = _.strictToNumber(wt);
    gwmes = _.strictToNumber(gwmes);

    return wt*Math.pow(es-gwmes, 2);
  }

  function randomEffectWeight (Me, Ne, Mc, Nc, tauSquared) {
    return 1 / (variance(Me, Ne, Mc, Nc) + tauSquared);
  }

  function randomEffectWeightPercent (Me, Ne, Mc, Nc, tauSquared) {
    return randomEffectWeight(Me/100, Ne, Mc/100, Nc, tauSquared);
  }

  function randomEffectWeightNumber (Me, Ne, Mc, Nc, tauSquared) {
    return randomEffectWeight(Me/Ne, Ne, Mc/Nc, Nc, tauSquared);
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
    var retval = [
      {
        id: 'weightedMeanAggr',
        label: 'Weighted Mean',
        func: weightedMeanAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'lowerConfidenceLimitAggr',
        label: 'Lower Confidence Limit',
        func: lowerConfidenceLimitAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'upperConfidenceLimitAggr',
        label: 'Upper Confidence Limit',
        func: upperConfidenceLimitAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'varianceAggr',
        label: 'Variance',
        func: varianceAggr,
        parameters: ['weights'],
      },
      {
        id: 'standardErrorAggr',
        label: 'Standard Error',
        func: standardErrorAggr,
        parameters: ['weights'],
      },
      {
        id: 'zValueAggr',
        label: 'Z-value',
        func: zValueAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'sumAggr',
        label: 'Sum',
        func: sumAggr,
        parameters: ['values'],
      },
      {
        id: 'countAggr',
        label: 'Count',
        func: countAggr,
        parameters: ['data'],
      },
      {
        id: 'subtractAggr',
        label: 'Subtract',
        func: subtractAggr,
        parameters: ['a', 'b'],
      },
      {
        id: 'pValue1TailedAggr',
        label: 'P-value (one-tailed)',
        func: pValue1TailedAggr,
        parameters: ['data'],
      },
      {
        id: 'pValue2TailedAggr',
        label: 'P-value (two-tailed)',
        func: pValue2TailedAggr,
        parameters: ['data'],
      },
      {
        id: 'degreesOfFreedomAggr',
        label: 'Degrees of Freedom',
        func: degreesOfFreedomAggr,
        parameters: ['data'],
      },
      {
        id: 'tauSquaredAggr',
        label: 'Tau Squared',
        func: tauSquaredAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'tauAggr',
        label: 'Tau',
        func: tauAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'tauStandardErrorAggr',
        label: 'Tau Standard Error',
        func: tauStandardErrorAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'tauVarianceAggr',
        label: 'Tau Variance',
        func: tauVarianceAggr,
        parameters: ['values', 'weights'],
      },
      {
        id: 'heterogeneityPValueAggr',
        label: 'Heterogeneity P-value',
        func: heterogeneityPValueAggr,
        parameters: ['sum of fixed effect errors', 'degrees of freedom'],
      },
      {
        id: 'iSquaredAggr',
        label: 'I-squared',
        func: iSquaredAggr,
        parameters: ['sum of fixed effect errors', 'degrees of freedom'],
      },
    ];
    retval.forEach(function(aggr) { aggr.type = lima.AGGREGATE_TYPE; });
    return retval;
  };

  function getAggregateFormulaById(id) {
    var aggregateFormulas = lima.listAggregateFormulas();
    for (var i=0; i<aggregateFormulas.length; i++) {
      if (aggregateFormulas[i].id === id) return aggregateFormulas[i];
    }
    return null;
  }

  function valueOrArrayItem(arr, index) {
    if (Array.isArray(arr)) return arr[index];

    return arr;
  }

  // here start the functions implementing the aggregates
  // Key structure to an aggregate function:
  //  - Parameters can be arrays or single values (at runtime); if arrays, may contain null/undefined values, or empty strings.
  //  - Data should be handled with _.strictToNumberOrNull().
  //  - The functions return a single numerical value.
  //  - May return nulls, NaN or infinities.
  //  - Must gracefully handle wacko figures, including !VALUE and nulls.

  // todo the functions below always re-compute from raw data, even if sum of weights has already been computed a number of times before
  // this may mean we want somehow to integrate caching into formulas.js rather than metaanalysis.js

  function sumAggr (valueArray) {
    if (!Array.isArray(valueArray)) return valueArray;

    if (valueArray.length === 0) return null;

    var total = 0;
    valueArray.forEach(function(value) {
      total += _.strictToNumberOrNull(value);
    });

    return total;
  }

  function countAggr (valueArray) {
    if (!Array.isArray(valueArray)) valueArray = [valueArray];

    var retval = 0;
    valueArray.forEach(function (x) {
      if (_.strictToNumberOrNull(x) != null) retval += 1;
    });
    return retval;
  }

  // this aggregate only takes single values as inputs (the parameters will likely be other aggregates)
  function subtractAggr (a, b) {
    a = _.strictToNumberOrNull(a);
    b = _.strictToNumberOrNull(b);

    return a-b;
  }

  // this is not exposed as an aggregate (hence not called *Aggr)
  function sumProduct (valueArray1, valueArray2) {
    var total = 0;

    for (var i=0; i<valueArray1.length; i++) {
      var value1 = _.strictToNumberOrNull(valueOrArrayItem(valueArray1,i));
      var value2 = _.strictToNumberOrNull(valueOrArrayItem(valueArray2,i));
      total += value1 * value2;
    }

    return total;
  }

  function weightedMeanAggr (valArray, weightArray) {
    return (sumProduct (valArray,weightArray) / sumAggr(weightArray));
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

  function zValueAggr (valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) / standardErrorAggr(weightArray);
  }

  // this aggregate only takes a single value as an input (the parameter will likely be another aggregate)
  function pValue1TailedAggr (data) {
    data = _.strictToNumberOrNull(data);
    if (data == null || isNaN(data)) return null;

    return cdfNormal(-(Math.abs(data)), 0, 1);
  }

  function pValue2TailedAggr (data) {
    return 2*pValue1TailedAggr(data);
  }

  // cdf (cumulative normal distribution function) adapted from http://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
  // this is not exposed as an aggregate (hence not called *Aggr)
  function cdfNormal (x, mean, standardDeviation) {
    return (1 - math.erf((mean - x ) / (Math.sqrt(2) * standardDeviation))) / 2;
  }

  function degreesOfFreedomAggr (data) {
    return countAggr(data) - 1;
    // todo this needs to be revisited for moderator analysis (because 1 becomes number of groups or something)
  }

  // this function computes all the statistics related to Tau-squared and returns them in a package
  // this is for code maintainability: the block of computations from `c` to `se` all very much depend on one another
  // parameters: array of effect sizes, array of weights
  function tauPackage (ess, wts) {
    if (!Array.isArray(ess) || !Array.isArray(wts)) return null;

    // sum of weights, sum of weights squared
    var sumwt = 0;
    var sumwt2 = 0;
    var sumwt3 = 0;

    // computing both sums in a single loop rather than using sumAggr and such
    wts.forEach(function (wt) {
      wt = _.strictToNumberOrNull(wt);
      sumwt += wt;
      sumwt2 += wt*wt;
      sumwt3 += wt*wt*wt;
    });

    // grand weighted mean effect size
    var gwmes = weightedMeanAggr(ess, wts);

    // sum of fixed effect errors
    var sumfee = 0;

    wts.forEach(function (wt, index) {
      var es = ess[index];
      var fee = fixedEffectError(es, wt, gwmes);
      sumfee += fee;
    });

    // these are the interdependent computations that justify computing everything in a package
    var c = sumwt - (sumwt2 / sumwt);
    var df = degreesOfFreedomAggr(wts);
    var tauSquared = (sumfee - df) / c;
    var a = df + 2*(sumwt-sumwt2/sumwt)*tauSquared + (sumwt2 - 2*(sumwt3/sumwt) + (sumwt2*sumwt2)/(sumwt*sumwt)) * (tauSquared*tauSquared);
    var tau = Math.sqrt(tauSquared);
    var variance = 2*a/(c*c);
    var se = Math.sqrt(variance);

    return {
      tauSquared: tauSquared,
      tau: tau,
      variance: variance,
      se: se,
    };
  }

  function tauSquaredAggr(ess, wts) {
    var pkg = tauPackage(ess, wts);
    if (pkg) return pkg.tauSquared;
    else return NaN;
  }

  function tauAggr(ess, wts) {
    var pkg = tauPackage(ess, wts);
    if (pkg) return pkg.tau;
    else return NaN;
  }

  function tauStandardErrorAggr(ess, wts) {
    var pkg = tauPackage(ess, wts);
    if (pkg) return pkg.se;
    else return NaN;
  }

  function tauVarianceAggr(ess, wts) {
    var pkg = tauPackage(ess, wts);
    if (pkg) return pkg.variance;
    else return NaN;
  }

  // this aggregate only takes single values as inputs (the parameters will likely be other aggregates)
  function heterogeneityPValueAggr (sumfee, df) {
    sumfee = _.strictToNumberOrNull(sumfee);
    df = _.strictToNumberOrNull(df);
    if (df < 1) return NaN;

    return chisq_dist_rt(sumfee, df);
  }

  // this aggregate only takes single values as inputs (the parameters will likely be other aggregates)
  function iSquaredAggr (sumfee, df) {
    sumfee = _.strictToNumberOrNull(sumfee);
    df = _.strictToNumberOrNull(df);

    return (sumfee - df) / sumfee;
  }

  // todo probable bug: if we have an aggregate with two parameters, both computed columns
  // and one of them has nulls in them
  // the whole aggregate should ignore the whole row that has a null


  /* chi squared
   *
   *
   *    ####  #    # #     ####   ####  #    #   ##   #####  ###### #####
   *   #    # #    # #    #      #    # #    #  #  #  #    # #      #    #
   *   #      ###### #     ####  #    # #    # #    # #    # #####  #    #
   *   #      #    # #         # #  # # #    # ###### #####  #      #    #
   *   #    # #    # #    #    # #   #  #    # #    # #   #  #      #    #
   *    ####  #    # #     ####   ### #  ####  #    # #    # ###### #####
   *
   *
   */
  // todo there might be merit in publishing some statistics functions below as a javascript package


  var chisq_dist_rt;

  // adapted from gamma.js at https://github.com/substack/gamma.js
  (function(){
    // transliterated from the python snippet here:
    // http://en.wikipedia.org/wiki/Lanczos_approximation

    var g_ln = 607/128;
    var p_ln = [
      0.99999999999999709182,
      57.156235665862923517,
      -59.597960355475491248,
      14.136097974741747174,
      -0.49191381609762019978,
      0.33994649984811888699e-4,
      0.46523628927048575665e-4,
      -0.98374475304879564677e-4,
      0.15808870322491248884e-3,
      -0.21026444172410488319e-3,
      0.21743961811521264320e-3,
      -0.16431810653676389022e-3,
      0.84418223983852743293e-4,
      -0.26190838401581408670e-4,
      0.36899182659531622704e-5
    ];

    // Spouge approximation (suitable for large arguments)
    function LogGamma(z) {

      if(z < 0) return Number('0/0');
      var x = p_ln[0];
      for(var i = p_ln.length - 1; i > 0; --i) x += p_ln[i] / (z + i);
      var t = z + g_ln + 0.5;
      return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z);
    }

    // adapted from chi-squared.js at https://github.com/substack/chi-squared.js

    // according to chi-squared.js: The following code liberated from
    // http://www.math.ucla.edu/~tom/distributions/chisq.html

    function Gcf(X,A) {        // Good for X>A+1
      var A0=0;
      var B0=1;
      var A1=1;
      var B1=X;
      var AOLD=0;
      var N=0;
      while (Math.abs((A1-AOLD)/A1)>.00001) {
        AOLD=A1;
        N=N+1;
        A0=A1+(N-A)*A0;
        B0=B1+(N-A)*B0;
        A1=X*A0+N*A1;
        B1=X*B0+N*B1;
        A0=A0/B1;
        B0=B0/B1;
        A1=A1/B1;
        B1=1;
      }
      var Prob=Math.exp(A*Math.log(X)-X-LogGamma(A))*A1;
      return 1-Prob;
    }

    function Gser(X,A) {        // Good for X<A+1.
      var T9=1/A;
      var G=T9;
      var I=1;
      while (T9>G*.00001) {
        T9=T9*X/(A+I);
        G=G+T9;
        I=I+1;
      }
      G=G*Math.exp(A*Math.log(X)-X-LogGamma(A));
      return G;
    }

    function Gammacdf(x,a) {
      var GI;
      if (x<=0) {
        GI=0;
      } else if (x<a+1) {
        GI=Gser(x,a);
      } else {
        GI=Gcf(x,a);
      }
      return GI;
    }

    function cdf (Z, DF) {
      if (DF<=0) {
        throw new Error("Degrees of freedom must be positive");
      }
      return Gammacdf(Z/2,DF/2);
    }

    // 1-cdf gives us the CHISQ.DIST.RT Excel value, according to
    // wikipedia https://en.wikipedia.org/wiki/Chi-squared_distribution#Table_of_.CF.872_values_vs_p-values
    chisq_dist_rt = function(v, df) {
      return 1-cdf(v,df);
    };

  })();


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

  // todo document formula strings: especially using * to indicate grouping

  // this regexp matches the outside of function formulas of the type
  // "sum*(/id/col/1473674381680,neg(/id/col/1473674325686))"
  var functionRegex = /^([^*(),\s]+)(\*?)\s*(\((.*)\))?$/;
  var paramRegex = /^(undefined|[1-9][0-9]*)$/;

  // parse nested function formulas of the type "a(b(c,d),e,f(g))"
  // where parameters can contain any character except (),\s
  lima.parseFormulaString = function parseFormulaString(str, columnsHash) {
    if (typeof str !== 'string') return void console.error('given non-string', new Error(), str);

    str = str.trim();
    if (str.length == 0) return null;

    var match = str.match(functionRegex);
    if (!match) return null;

    // if we don't have parentheses, the string is just a single identifier
    if (!match[3]) {
      if (match[2]) return null; // single identifiers cannot use * for grouping
      if (!match[1]) throw new Error('referencing empty column id');
      if (!(match[1].match(paramRegex))) throw new Error('invalid column id ' + match[1]);
      if (match[1] == 'undefined') return 'undefined'; // special case for incomplete formulas (some params are missing)
      if (!columnsHash[match[1]]) throw new Error('referencing unknown column id ' + match[1]);
      return columnsHash[match[1]]; // return the column object with the given id
    }

    // otherwise it's a function
    var retval = {};
    retval.formulaName = match[1];
    if (match[4] && match[4].trim()) {
      var params = splitParams(match[4]);
      if (params == null) return null;

      retval.formulaParams = [];
      for (var i=0; i<params.length; i+=1) {
        var param = lima.parseFormulaString(params[i], columnsHash);
        if (param == null) return null;
        retval.formulaParams.push(param);
      }
    } else {
      retval.formulaParams = [];
    }
    if (match[2]) retval.grouping = true;
    retval.formula = lima.createFormulaString(retval);
    retval.formulaObj = lima.getFormulaObject(retval.formulaName);
    return retval;
  };

  lima.getFormulaObject = function getFormulaObject(name) {
    return getFormulaById(name) || getAggregateFormulaById(name) || lima.getGraphFormulaById(name);
  };

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
    if (obj.id) return obj.id;
    var retval = '';
    retval += obj.formulaName || 'undefined';
    if (obj.grouping) retval += '*';
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
  };


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
    testObject({formulaName: 'a', formulaParams: [{id:'b'}, {id:'c'}]}, 'a(b,c)');
    testObject({formulaName: 'a', grouping: true, formulaParams: [{id:'b'}, {id:'c'}]}, 'a*(b,c)');
    testObject({formulaName: 'a', grouping: false, formulaParams: [{id:'b'}, {id:'c'}]}, 'a(b,c)');
    testObject({formulaParams: [{id:'b'}, {id:'c'}]}, 'undefined(b,c)');
    testObject({formulaParams: [ null, {id:'c'}]}, 'undefined(undefined,c)');

    var sparseArray = [];
    sparseArray[1] = {id:'c'};
    sparseArray.length = 4;
    testObject({formulaParams: sparseArray}, 'undefined(undefined,c,undefined,undefined)');
    testObject({formulaParams: sparseArray,grouping:true}, 'undefined*(undefined,c,undefined,undefined)');
    testObject({formulaParams: [ {formulaName: 'a', formulaParams: [{id:'b'}, {id:'c'}]}, {id:'d'}]}, 'undefined(a(b,c),d)');
    testObject({formulaName:"a",formulaParams:[{formulaName:"b",formulaParams:[{id:"c"},{id:"d"}]},{id:"e"},{formulaName:"f",formulaParams:[{id:"g"}]}]}, 'a(b(c,d),e,f(g))');
    testObject({formulaName:"a",formulaParams:[{formulaName:"b",formulaParams:[null,{id:"d"}]},{id:"e"},{formulaParams:[{id:"g"}]}]}, 'a(b(undefined,d),e,undefined(g))');
    testObject({formulaName:"a",formulaParams:[{formulaName:"b",formulaParams:[null,{id:"d"}],grouping:1},{id:"e"},{formulaParams:[{id:"g"}]}]}, 'a(b*(undefined,d),e,undefined(g))');
  });

  _.addTest(function testSplitParams(assert) {
    var val = splitParams({});
    assert(val === null, 'not a string should not be split');

    val = splitParams('');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('4390');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '4390', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('4390,');
    assert(val.length == 2, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '4390', 'bad param value in ' + JSON.stringify(val));
    assert(val[1] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('4390() ,');
    assert(val.length == 2, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '4390() ', 'bad param value in ' + JSON.stringify(val));
    assert(val[1] == '', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('4390(,)');
    assert(val.length == 1, 'bad split array len in ' + JSON.stringify(val));
    assert(val[0] == '4390(,)', 'bad param value in ' + JSON.stringify(val));

    val = splitParams('4390(,');
    assert(val == null, 'should not split invalid string');

    val = splitParams('4390),');
    assert(val == null, 'should not split invalid string');
  });

  _.addTest(function testParseFormulaString(assert) {
    var t = {id:"2"};
    var columnsHash = { // uses strings where normal code would use objects, that's for ease of testing
      1: 'a',
      2: t,
      3: 'c',
      4: 'd',
      5: 'e',
      6: 'f',
      7: 'g',
      8: 'h',
      9: 'i',
      10: 'j',
      11: 'k',
      12: 'l',
      13: 'm',
      14: 'n',
      15: 'o',
      16: 'p',
      17: 'q',
      18: 'r',
      19: 's',
      20: 't',
      21: 'u',
      22: 'v',
      23: {id:"23"},
      24: 'x',
      25: 'y',
      26: 'z',
    };

    var val = lima.parseFormulaString('a(2)', columnsHash);
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 1, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == t, "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b(3,4),5,f(7))', columnsHash);
    assert(JSON.stringify(val) == '{"formulaName":"a","formulaParams":[{"formulaName":"b","formulaParams":["c","d"],"formula":"b(c,d)","formulaObj":null},"e",{"formulaName":"f","formulaParams":["g"],"formula":"f(g)","formulaObj":null}],"formula":"a(b(c,d),e,f(g))","formulaObj":null}', "bad formula parsed in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b(c(d(5)),6),7,h(9))', columnsHash);
    assert(JSON.stringify(val) == '{"formulaName":"a","formulaParams":[{"formulaName":"b","formulaParams":[{"formulaName":"c","formulaParams":[{"formulaName":"d","formulaParams":["e"],"formula":"d(e)","formulaObj":null}],"formula":"c(d(e))","formulaObj":null},"f"],"formula":"b(c(d(e)),f)","formulaObj":null},"g",{"formulaName":"h","formulaParams":["i"],"formula":"h(i)","formulaObj":null}],"formula":"a(b(c(d(e)),f),g,h(i))","formulaObj":null}', "bad formula parsed in " + JSON.stringify(val));

    val = lima.parseFormulaString('logOddsRatio(2,23)', columnsHash);
    assert(JSON.stringify(val) == '{"formulaName":"logOddsRatio","formulaParams":[{"id":"2"},{"id":"23"}],"formula":"logOddsRatio(2,23)","formulaObj":{"id":"logOddsRatio","label":"Log Odds Ratio (fractions)","parameters":["group 1 (e.g. experimental)","group 2 (e.g. control)"],"type":{"type":"formula"}}}', "bad formula parsed in " + JSON.stringify(val));

    val = lima.parseFormulaString("undefined(13,13)", columnsHash);
    assert(val.formulaName == 'undefined', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 2, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'm', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == 'm', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a(2,3)', columnsHash);
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 2, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == t, "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == 'c', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('logOddsRatio(14,15,16)', columnsHash);
    assert(val.formulaName == 'logOddsRatio', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 3, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == 'n', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1] == 'o', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[2] == 'p', "bad formula params in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3490/4836()', columnsHash);
    assert(val.formulaName == 'a3490/4836', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 0, "bad formula params len in " + JSON.stringify(val));

    val = lima.parseFormulaString(' a3490/4836 (  ) ', columnsHash);
    assert(val.formulaName == 'a3490/4836', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 0, "bad formula params len in " + JSON.stringify(val));

    val = lima.parseFormulaString('a3 490/4836()', columnsHash);
    assert(val == null, "erroneously parsed formula " + JSON.stringify(val));

    val = lima.parseFormulaString('a(b*,c)', columnsHash);
    assert(val == null, "erroneously parsed formula " + JSON.stringify(val));

    val = lima.parseFormulaString(' 26  ', columnsHash);
    assert(val == 'z', "erroneously parsed formula " + JSON.stringify(val));

    val = lima.parseFormulaString('a(2,x(25,26),c(),4)', columnsHash);
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.formulaParams.length == 4, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == t, "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[3] == 'd', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaName == 'x', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams.length == 2, "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[0] == 'y', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[1] == 'z', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].formulaName == 'c', "bad second nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].formulaParams.length == 0, "bad second nested formula param in " + JSON.stringify(val));

    val = lima.parseFormulaString('a*(2,x(25,26),c*(),4)', columnsHash);
    assert(val.formulaName == 'a', "bad formula name in " + JSON.stringify(val));
    assert(val.grouping, "bad grouping in " + JSON.stringify(val));
    assert(val.formulaParams.length == 4, "bad formula params len in " + JSON.stringify(val));
    assert(val.formulaParams[0] == t, "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[3] == 'd', "bad formula params in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaName == 'x', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams.length == 2, "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[0] == 'y', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].formulaParams[1] == 'z', "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[1].grouping != true, "bad first nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].formulaName == 'c', "bad second nested formula param in " + JSON.stringify(val));
    assert(val.formulaParams[2].grouping, "bad second nested formula param in " + JSON.stringify(val));
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
    testCase = "flskjdf/ewr* ( a/ewr/436632 , b , 4390)"; shouldPass();

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
    testCase = "a*b(a,b)"; shouldFail();
    testCase = "*b(a,b)"; shouldFail();
    testCase = "*(b,b)"; shouldFail();
  });

  _.addTest(function testParamRegex(assert) {
    var testCase;

    function shouldPass() {
      assert(testCase.match(paramRegex), '"' + testCase + '" should match but does not');
    }

    function shouldFail() {
      assert(!testCase.match(paramRegex), '"' + testCase + '" should not match but does');
    }

    // positive test cases
    testCase = "1"; shouldPass();
    testCase = "10"; shouldPass();
    testCase = "1094"; shouldPass();
    testCase = "999"; shouldPass();
    testCase = "undefined"; shouldPass();

    // negative test cases
    testCase = ""; shouldFail();
    testCase = " undefined "; shouldFail();
    testCase = "  fls kjdf/ewr"; shouldFail();
    testCase = "0"; shouldFail();
    testCase = "09"; shouldFail();
    testCase = "0 9"; shouldFail();
    testCase = "1 9"; shouldFail();
    testCase = "undefined1"; shouldFail();
  });

  _.addTest(function testStatsFunctions(assert) {
    function precisionMatch(a,b) {
      assert(a.toPrecision(6) == b.toPrecision(6), "fail: " + a + ", " + b);
    }

    // test values from https://support.google.com/docs/answer/3094021?visit_id=1-636301774294222751-360277150&hl=en-GB&rd=1

    precisionMatch(cdfNormal(490, 500, 5), 0.02275013195);
    precisionMatch(cdfNormal(510, 500, 5), 0.9772498681);

    // test values confirmed to precision 3 by https://onlinecourses.science.psu.edu/stat414/node/267
    precisionMatch(pValue1TailedAggr(-1.92), 0.027428949703836802);
    precisionMatch(pValue2TailedAggr(-1.92), 2*0.027428949703836802);

    // positive values should be treated as negatives
    precisionMatch(pValue1TailedAggr(1.92), 0.027428949703836802);
    precisionMatch(pValue2TailedAggr(1.92), 2*0.027428949703836802);

  });

})(window, document);
