function formulas() {
  function strictToNumber(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (val === '') return NaN;
      else return Number(val);
    }
    return NaN;
  }

  function strictToNumberOrNull(val) {
    if (val === null) return val;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (val === '') return null;
      else return Number(val);
    }
    return NaN;
  }

  function valueOrArrayItem(arr, index) {
    if (Array.isArray(arr)) return arr[index];

    return arr;
  }

  // adapted from gamma.js at https://github.com/substack/gamma.js
  function calcChisqDistR() {
    // transliterated from the python snippet here:
    // http://en.wikipedia.org/wiki/Lanczos_approximation

    const gLn = 607 / 128;
    const pLn = [
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
      0.36899182659531622704e-5,
    ];

    // Spouge approximation (suitable for large arguments)
    function LogGamma(z) {
      if (z < 0) return Number('0/0');
      let x = pLn[0];
      for (let i = pLn.length - 1; i > 0; i -= 1) x += pLn[i] / (z + i);
      const t = z + gLn + 0.5;
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x) - Math.log(z);
    }

    // adapted from chi-squared.js at https://github.com/substack/chi-squared.js

    // according to chi-squared.js: The following code liberated from
    // http://www.math.ucla.edu/~tom/distributions/chisq.html

    function Gcf(X, A) {
      // Good for X>A+1
      let A0 = 0;
      let B0 = 1;
      let A1 = 1;
      let B1 = X;
      let AOLD = 0;
      let N = 0;
      while (Math.abs((A1 - AOLD) / A1) > 0.00001) {
        AOLD = A1;
        N += 1;
        A0 = A1 + (N - A) * A0;
        B0 = B1 + (N - A) * B0;
        A1 = X * A0 + N * A1;
        B1 = X * B0 + N * B1;
        A0 /= B1;
        B0 /= B1;
        A1 /= B1;
        B1 = 1;
      }
      const Prob = Math.exp(A * Math.log(X) - X - LogGamma(A)) * A1;
      return 1 - Prob;
    }

    function Gser(X, A) {
      // Good for X<A+1.
      let T9 = 1 / A;
      let G = T9;
      let I = 1;
      while (T9 > G * 0.00001) {
        T9 *= X / (A + I);
        G += T9;
        I += 1;
      }
      G *= Math.exp(A * Math.log(X) - X - LogGamma(A));
      return G;
    }

    function Gammacdf(x, a) {
      let GI;
      if (x <= 0) {
        GI = 0;
      } else if (x < a + 1) {
        GI = Gser(x, a);
      } else {
        GI = Gcf(x, a);
      }
      return GI;
    }

    function cdf(Z, DF) {
      if (DF <= 0) {
        throw new Error('Degrees of freedom must be positive');
      }
      return Gammacdf(Z / 2, DF / 2);
    }

    // 1-cdf gives us the CHISQ.DIST.RT Excel value, according to
    // wikipedia https://en.wikipedia.org/wiki/Chi-squared_distribution#Table_of_.CF.872_values_vs_p-values
    return (v, df) => 1 - cdf(v, df);
  }

  const chisqDistRt = calcChisqDistR();

  /* simple formulas
   *
   *
   *    ####  # #    # #####  #      ######
   *   #      # ##  ## #    # #      #
   *    ####  # # ## # #    # #      #####
   *        # # #    # #####  #      #
   *   #    # # #    # #      #      #
   *    ####  # #    # #      ###### ######
   *
   *    ######  ####  #####  #    # #    # #        ##    ####
   *    #      #    # #    # ##  ## #    # #       #  #  #
   *    #####  #    # #    # # ## # #    # #      #    #  ####
   *    #      #    # #####  #    # #    # #      ######      #
   *    #      #    # #   #  #    # #    # #      #    # #    #
   *    #       ####  #    # #    #  ####  ###### #    #  ####
   *
   *
   */

  function logOddsRatio(group1, group2) {
    // validate the input
    group1 = strictToNumber(group1);
    group2 = strictToNumber(group2);

    // perform the calculation
    // may return NaN or infinities
    return Math.log((group1 / (1 - group1)) / (group2 / (1 - group2)));
  }

  function logOddsRatioPercent(group1, group2) {
    // validate the input
    group1 = strictToNumber(group1);
    group2 = strictToNumber(group2);

    // perform the calculation
    // may return NaN or infinities
    return logOddsRatio(group1 / 100, group2 / 100);
  }

  function logOddsRatioNumber(group1, n1, group2, n2) {
    // validate the input
    group1 = strictToNumber(group1);
    group2 = strictToNumber(group2);
    n1 = strictToNumber(n1);
    n2 = strictToNumber(n2);

    // perform the calculation
    // may return NaN or infinities
    return logOddsRatio(group1 / n1, group2 / n2);
  }

  function letiance(Me, Ne, Mc, Nc) {
    // validate the input
    Me = strictToNumber(Me);
    Ne = strictToNumber(Ne);
    Mc = strictToNumber(Mc);
    Nc = strictToNumber(Nc);

    // perform the calculation
    // may return NaN or infinities
    return 1 / (Me * Ne) + 1 / ((1 - Me) * Ne) + 1 / (Mc * Nc) + 1 / ((1 - Mc) * Nc);
  }

  function weight(Me, Ne, Mc, Nc) {
    return 1 / letiance(Me, Ne, Mc, Nc);
  }

  function weightPercent(Me, Ne, Mc, Nc) {
    return weight(Me / 100, Ne, Mc / 100, Nc);
  }

  function weightNumber(Me, Ne, Mc, Nc) {
    return weight(Me / Ne, Ne, Mc / Nc, Nc);
  }

  function standardError(Me, Ne, Mc, Nc) {
    return Math.sqrt(letiance(Me, Ne, Mc, Nc));
  }

  function lowerConfidenceLimit(Me, Ne, Mc, Nc) {
    return logOddsRatio(Me, Mc) - 1.96 * standardError(Me, Ne, Mc, Nc);
  }

  function upperConfidenceLimit(Me, Ne, Mc, Nc) {
    return logOddsRatio(Me, Mc) + 1.96 * standardError(Me, Ne, Mc, Nc);
  }

  function lowerConfidenceLimitPercent(Me, Ne, Mc, Nc) {
    return lowerConfidenceLimit(Me / 100, Ne, Mc / 100, Nc);
  }

  function upperConfidenceLimitPercent(Me, Ne, Mc, Nc) {
    return upperConfidenceLimit(Me / 100, Ne, Mc / 100, Nc);
  }

  function lowerConfidenceLimitNumber(Me, Ne, Mc, Nc) {
    return lowerConfidenceLimit(Me / Ne, Ne, Mc / Nc, Nc);
  }

  function upperConfidenceLimitNumber(Me, Ne, Mc, Nc) {
    return upperConfidenceLimit(Me / Ne, Ne, Mc / Nc, Nc);
  }

  function fixedEffectError(es, wt, gwmes) {
    es = strictToNumber(es);
    wt = strictToNumber(wt);
    gwmes = strictToNumber(gwmes);

    return wt * ((es - gwmes) ** 2);
  }

  function randomEffectWeight(Me, Ne, Mc, Nc, tauSquared) {
    return 1 / (letiance(Me, Ne, Mc, Nc) + tauSquared);
  }

  function randomEffectWeightPercent(Me, Ne, Mc, Nc, tauSquared) {
    return randomEffectWeight(Me / 100, Ne, Mc / 100, Nc, tauSquared);
  }

  function randomEffectWeightNumber(Me, Ne, Mc, Nc, tauSquared) {
    return randomEffectWeight(Me / Ne, Ne, Mc / Nc, Nc, tauSquared);
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

  function sumAggr(valueArray) {
    if (!Array.isArray(valueArray)) return valueArray;

    if (valueArray.length === 0) return null;

    let total = 0;
    valueArray.forEach((value) => {
      total += strictToNumberOrNull(value);
    });

    return total;
  }

  function countAggr(valueArray) {
    if (!Array.isArray(valueArray)) valueArray = [valueArray];

    let retval = 0;
    valueArray.forEach((x) => {
      if (strictToNumberOrNull(x) != null) retval += 1;
    });
    return retval;
  }

  // this aggregate only takes single values as inputs
  // (the parameters will likely be other aggregates)
  function subtractAggr(a, b) {
    a = strictToNumberOrNull(a);
    b = strictToNumberOrNull(b);

    return a - b;
  }

  // this is not exposed as an aggregate (hence not called *Aggr)
  function sumProduct(valueArray1, valueArray2) {
    let total = 0;

    for (let i = 0; i < valueArray1.length; i += 1) {
      const value1 = strictToNumberOrNull(valueOrArrayItem(valueArray1, i));
      const value2 = strictToNumberOrNull(valueOrArrayItem(valueArray2, i));
      total += value1 * value2;
    }

    return total;
  }

  function weightedMeanAggr(valArray, weightArray) {
    return (sumProduct(valArray, weightArray) / sumAggr(weightArray));
  }

  function letianceAggr(weightArray) {
    return 1 / sumAggr(weightArray);
  }

  function standardErrorAggr(weightArray) {
    return Math.sqrt(letianceAggr(weightArray));
  }

  function lowerConfidenceLimitAggr(valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) - 1.96 * standardErrorAggr(weightArray);
  }

  function upperConfidenceLimitAggr(valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) + 1.96 * standardErrorAggr(weightArray);
  }

  function zValueAggr(valArray, weightArray) {
    return weightedMeanAggr(valArray, weightArray) / standardErrorAggr(weightArray);
  }

  // this aggregate only takes a single value as an input
  // (the parameter will likely be another aggregate)
  function pValue1TailedAggr(data) {
    data = strictToNumberOrNull(data);
    if (data == null || Number.isNaN(data)) return null;

    return cdfNormal(-(Math.abs(data)), 0, 1);
  }

  function pValue2TailedAggr(data) {
    return 2 * pValue1TailedAggr(data);
  }

  // cdf (cumulative normal distribution function) adapted from http://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
  // this is not exposed as an aggregate (hence not called *Aggr)
  function cdfNormal(x, mean, standardDeviation) {
    return (1 - Math.erf((mean - x) / (Math.sqrt(2) * standardDeviation))) / 2;
  }

  function degreesOfFreedomAggr(data) {
    return countAggr(data) - 1;
    // todo this needs to be revisited for moderator analysis
    // (because 1 becomes number of groups or something)
  }

  // this function computes all the statistics related to Tau-squared and returns them in a package
  // this is for code maintainability:
  // the block of computations from `c` to `se` all very much depend on one another
  // parameters: array of effect sizes, array of weights
  function tauPackage(ess, wts) {
    if (!Array.isArray(ess) || !Array.isArray(wts)) return null;

    // sum of weights, sum of weights squared
    let sumwt = 0;
    let sumwt2 = 0;
    let sumwt3 = 0;

    // computing both sums in a single loop rather than using sumAggr and such
    wts.forEach((wt) => {
      wt = strictToNumberOrNull(wt);
      sumwt += wt;
      sumwt2 += wt * wt;
      sumwt3 += wt * wt * wt;
    });

    // grand weighted mean effect size
    const gwmes = weightedMeanAggr(ess, wts);

    // sum of fixed effect errors
    let sumfee = 0;

    wts.forEach((wt, index) => {
      const es = ess[index];
      const fee = fixedEffectError(es, wt, gwmes);
      sumfee += fee;
    });

    // these are the interdependent computations that justify computing everything in a package
    const c = sumwt - (sumwt2 / sumwt);
    const df = degreesOfFreedomAggr(wts);
    const tauSquared = (sumfee - df) / c;
    const a = df + 2 * (sumwt - sumwt2 / sumwt) * tauSquared
    + (sumwt2 - 2 * (sumwt3 / sumwt) + (sumwt2 * sumwt2)
    / (sumwt * sumwt)) * (tauSquared * tauSquared);
    const tau = Math.sqrt(tauSquared);
    const v = 2 * (a / (c * c));
    const se = Math.sqrt(letiance);

    return {
      tauSquared,
      tau,
      letiance: v,
      se,
    };
  }

  function tauSquaredAggr(ess, wts) {
    const pkg = tauPackage(ess, wts);
    if (pkg) return pkg.tauSquared;
    else return NaN;
  }

  function tauAggr(ess, wts) {
    const pkg = tauPackage(ess, wts);
    if (pkg) return pkg.tau;
    else return NaN;
  }

  function tauStandardErrorAggr(ess, wts) {
    const pkg = tauPackage(ess, wts);
    if (pkg) return pkg.se;
    else return NaN;
  }

  function tauVarianceAggr(ess, wts) {
    const pkg = tauPackage(ess, wts);
    if (pkg) return pkg.letiance;
    else return NaN;
  }

  // this aggregate only takes single values as inputs
  // (the parameters will likely be other aggregates)
  function heterogeneityPValueAggr(sumfee, df) {
    sumfee = strictToNumberOrNull(sumfee);
    df = strictToNumberOrNull(df);
    if (df < 1) return NaN;

    return chisqDistRt(sumfee, df);
  }

  // this aggregate only takes single values as inputs
  // (the parameters will likely be other aggregates)
  function iSquaredAggr(sumfee, df) {
    sumfee = strictToNumberOrNull(sumfee);
    df = strictToNumberOrNull(df);

    return (sumfee - df) / sumfee;
  }

  const retval = {
    simpleFormulas: [
      {
        id: 'logOddsRatio',
        label: 'Log Odds Ratio (fractions)',
        func: logOddsRatio,
        parameters: ['group 1 (e.g. experimental)', 'group 2 (e.g. control)'],
      },
      {
        id: 'logOddsRatioPercent',
        label: 'Log Odds Ratio (percentages)',
        func: logOddsRatioPercent,
        parameters: ['group 1 (e.g. experimental %)', 'group 2 (e.g. control %)'],
      },
      {
        id: 'logOddsRatioNumber',
        label: 'Log Odds Ratio (numbers affected)',
        func: logOddsRatioNumber,
        parameters: ['group 1 (e.g. experimental affected)', 'group 1 N', 'group 2 (e.g. control affected)', 'group 2 N'],
      },
      {
        id: 'weight',
        label: 'Weight (fractions)',
        func: weight,
        parameters: ['group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N'],
      },
      {
        id: 'weightPercent',
        label: 'Weight (percentages)',
        func: weightPercent,
        parameters: ['group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N'],
      },
      {
        id: 'weightNumber',
        label: 'Weight (numbers affected)',
        func: weightNumber,
        parameters: ['group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N'],
      },
      {
        id: 'lowerConfidenceLimit',
        label: 'Lower Log Confidence Limit (fractions)',
        func: lowerConfidenceLimit,
        parameters: ['group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N'],
      },
      {
        id: 'lowerConfidenceLimitPercent',
        label: 'Lower Log Confidence Limit (percentages)',
        func: lowerConfidenceLimitPercent,
        parameters: ['group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N'],
      },
      {
        id: 'lowerConfidenceLimitNumber',
        label: 'Lower Log Confidence Limit (numbers affected)',
        func: lowerConfidenceLimitNumber,
        parameters: ['group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N'],
      },
      {
        id: 'upperConfidenceLimit',
        label: 'Upper Log Confidence Limit (fractions)',
        func: upperConfidenceLimit,
        parameters: ['group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N'],
      },
      {
        id: 'upperConfidenceLimitPercent',
        label: 'Upper Log Confidence Limit (percentages)',
        func: upperConfidenceLimitPercent,
        parameters: ['group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N'],
      },
      {
        id: 'upperConfidenceLimitNumber',
        label: 'Upper Log Confidence Limit (numbers affected)',
        func: upperConfidenceLimitNumber,
        parameters: ['group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N'],
      },
      {
        id: 'fixedEffectError',
        label: 'Fixed Effect Error',
        func: fixedEffectError,
        parameters: ['effect size', 'weight', 'grand weighted mean effect size'],
      },
      {
        id: 'randomEffectWeight',
        label: 'Random Effect Model Weight (fractions)',
        func: randomEffectWeight,
        parameters: ['group 1 outcome', 'group 1 N', 'group 2 outcome', 'group 2 N', 'tauSquared'],
      },
      {
        id: 'randomEffectWeightPercent',
        label: 'Random Effect Model Weight (percentages)',
        func: randomEffectWeightPercent,
        parameters: ['group 1 outcome (%)', 'group 1 N', 'group 2 outcome (%)', 'group 2 N', 'tauSquared'],
      },
      {
        id: 'randomEffectWeightNumber',
        label: 'Random Effect Model Weight (numbers affected)',
        func: randomEffectWeightNumber,
        parameters: ['group 1 outcome (affected)', 'group 1 N', 'group 2 outcome (affected)', 'group 2 N', 'tauSquared'],
      },
    ],
    moderatorFormulas: [
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
        id: 'letianceAggr',
        label: 'Variance',
        func: letianceAggr,
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
    ],
  };

  return retval;
}

export default formulas;
