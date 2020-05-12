import { isColCompletelyDefined, getDatumValue, getAggregateDatumValue } from './datatools';

export function getSimpleForestPlotData(graph) {
  const { papers } = graph.metaanalysis;

  let orFunc;
  let wtFunc;
  let lclFunc;
  let uclFunc;
  let params;

  const lineHeight = 30;
  const graphWidth = 300;
  const startHeight = 70;
  const endHeight = 65;
  const minWtSize = 4;
  const maxWtSize = 14;
  const extraLineLen = -30;
  const minDiamondWidth = 14;

  if (graph.formulaName === 'forestPlotGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatio', formulaParams: [params[0], params[2]] };
    wtFunc = { formulaName: 'weight', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimit', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimit', formulaParams: params };
  } else
  if (graph.formulaName === 'forestPlotNumberGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatioNumber', formulaParams: params };
    wtFunc = { formulaName: 'weightNumber', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimitNumber', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimitNumber', formulaParams: params };
  } else
  if (graph.formulaName === 'forestPlotPercentGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatioPercent', formulaParams: [params[0], params[2]] };
    wtFunc = { formulaName: 'weightPercent', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimitPercent', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimitPercent', formulaParams: params };
  } else {
    return;
    // this function does not handle this type of graph or the graph is not completely defined
  }

  // get the data
  orFunc.formula = window.lima.createFormulaString(orFunc);
  wtFunc.formula = window.lima.createFormulaString(wtFunc);
  lclFunc.formula = window.lima.createFormulaString(lclFunc);
  uclFunc.formula = window.lima.createFormulaString(uclFunc);
  orFunc.formulaObj = window.lima.getFormulaObject(orFunc.formulaName);
  wtFunc.formulaObj = window.lima.getFormulaObject(wtFunc.formulaName);
  lclFunc.formulaObj = window.lima.getFormulaObject(lclFunc.formulaName);
  uclFunc.formulaObj = window.lima.getFormulaObject(uclFunc.formulaName);

  const lines = [];

  for (const paper of papers) {
    for (const exp of paper.experiments) {
      if (exp.excluded) continue;
      const line = {};
      line.title = paper.title || 'new paper';
      if (paper.experiments.length > 1) {
        let expTitle = exp.title || 'new experiment';
        if (expTitle.match(/^\d+$/)) expTitle = `Exp. ${expTitle}`;
        line.title += ` (${expTitle})`;
      }
      line.or = getDatumValue(orFunc, exp);
      line.wt = getDatumValue(wtFunc, exp);
      line.lcl = getDatumValue(lclFunc, exp);
      line.ucl = getDatumValue(uclFunc, exp);
      lines.push(line);

      // if any of the values is NaN or ±Infinity, disregard this experiment
      if (isNaN(line.or * 0) || isNaN(line.lcl * 0) || isNaN(line.ucl * 0) || isNaN(line.wt * 0)
              || line.or == null || line.lcl == null || line.ucl == null || line.wt == null) {
        delete line.or;
        delete line.lcl;
        delete line.ucl;
        delete line.wt;
      }
    }
  }
  if (lines.length === 0) {
    const noDataLine = { title: 'No data' };
    lines.push(noDataLine);
  }
  const orAggrFunc = { formulaName: 'weightedMeanAggr', formulaParams: [orFunc, wtFunc] };
  const lclAggrFunc = { formulaName: 'lowerConfidenceLimitAggr', formulaParams: [orFunc, wtFunc] };
  const uclAggrFunc = { formulaName: 'upperConfidenceLimitAggr', formulaParams: [orFunc, wtFunc] };

  orAggrFunc.formula = window.lima.createFormulaString(orAggrFunc);
  lclAggrFunc.formula = window.lima.createFormulaString(lclAggrFunc);
  uclAggrFunc.formula = window.lima.createFormulaString(uclAggrFunc);
  orAggrFunc.formulaObj = window.lima.getFormulaObject(orAggrFunc.formulaName);
  lclAggrFunc.formulaObj = window.lima.getFormulaObject(lclAggrFunc.formulaName);
  uclAggrFunc.formulaObj = window.lima.getFormulaObject(uclAggrFunc.formulaName);
  orAggrFunc.metaanalysis = graph.metaanalysis;
  lclAggrFunc.metaanalysis = graph.metaanalysis;
  orAggrFunc.metaanalysis = graph.metaanalysis;

  const aggregates = {
    or: getAggregateDatumValue(orAggrFunc, graph.metaanalysis.papers),
    lcl: getAggregateDatumValue(lclAggrFunc, graph.metaanalysis.papers),
    ucl: getAggregateDatumValue(uclAggrFunc, graph.metaanalysis.papers),
  };

  if (isNaN(aggregates.or * 0) || isNaN(aggregates.lcl * 0) || isNaN(aggregates.ucl * 0)) {
    aggregates.lcl = 0;
    aggregates.ucl = 0;
  }
  let sumOfWt = 0;
  let minWt = Infinity;
  let maxWt = -Infinity;
  let minLcl = aggregates.lcl;
  let maxUcl = aggregates.ucl;

  if (isNaN(minLcl)) minLcl = 0;
  if (isNaN(maxUcl)) maxUcl = 0;

  for (const line of lines) {
    if (line.or == null) return;
    sumOfWt += line.wt;
    if (line.wt < minWt) minWt = line.wt;
    if (line.wt > maxWt) maxWt = line.wt;
    if (line.lcl < minLcl) minLcl = line.lcl;
    if (line.ucl > maxUcl) maxUcl = line.ucl;
  }
  if (minLcl < -10) minLcl = -10;
  if (maxUcl > 10) maxUcl = 10;

  if (minWt === Infinity) minWt = maxWt = 1;
  if (sumOfWt === 0) sumOfWt = 1;
  let TICK_SPACING;

  // select tick spacing based on a rough estimate of how many ticks we'll need anyway
  const clSpread = (maxUcl - minLcl) / Math.LN10; // how many orders of magnitude we cover
  if (clSpread > 3) TICK_SPACING = [100];
  else if (clSpread > 1.3) TICK_SPACING = [10];
  else TICK_SPACING = [2, 2.5, 2]; // ticks at 1, 2, 5, 10, 20, 50, 100...

  // adjust minimum and maximum around decimal non-logarithmic values
  let newBound = 1;
  let tickNo = 0;
  while (Math.log(newBound) > minLcl) {
    tickNo -= 1;
    newBound /= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    // JS % can be negative
  }
  minLcl = Math.log(newBound) - 0.1;

  let startingTickVal = newBound;
  let startingTick = tickNo;

  newBound = 1;
  tickNo = 0;
  while (Math.log(newBound) < maxUcl) {
    newBound *= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    tickNo += 1;
  }
  maxUcl = Math.log(newBound) + 0.1;

  const xRatio = 1 / (maxUcl - minLcl) * graphWidth;

  // return the X coordinate on the graph that corresponds to the given logarithmic value
  function getX(val) {
    return (val - minLcl) * xRatio;
  }

  // adjust weights so that in case of very similar weights they don't range from minimum to maximum
  const MIN_WT_SPREAD = 2.5;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  // minWt = 0;
  // todo we can uncomment this to make all weights relative to only the maximum weight
  // square root the weights because we're using them as lengths of the side of a square whose area should correspond to the weight
  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = 1 / (maxWt - minWt) * (maxWtSize - minWtSize);

  let currY = startHeight;

  for (const line of lines) {
    line.currY = currY;
    currY += lineHeight;
  }


  if (!isNaN(aggregates.or * 0)) {
    let lclX = getX(aggregates.lcl);
    let uclX = getX(aggregates.ucl);
    const orX = getX(aggregates.or);
    if ((uclX - lclX) < minDiamondWidth) {
      const ratio = (uclX - lclX) / minDiamondWidth;
      lclX = orX + (lclX - orX) / ratio;
      uclX = orX + (uclX - orX) / ratio;
    }
    const confidenceInterval = `${lclX},0 ${orX},-10 ${uclX},0 ${orX},10`;

    aggregates.minWtSize = minWtSize;
    aggregates.minWt = minWt;
    aggregates.wtRatio = wtRatio;
    aggregates.minLcl = minLcl;
    aggregates.xRatio = xRatio;
    aggregates.sumOfWt = sumOfWt;
    aggregates.currY = currY;
    aggregates.confidenceInterval = confidenceInterval;

    // put axes into the plot
    const tickVals = [];
    let tickVal;

    while ((tickVal = Math.log(startingTickVal)) < maxUcl) {
      tickVals.push([tickVal, startingTickVal]);
      startingTickVal *= TICK_SPACING[window.lima._.mod(startingTick, TICK_SPACING.length)];
      startingTick += 1;
    }
    currY += lineHeight;

    graph.lines = lines;
    graph.tickVals = tickVals;
    graph.aggregates = aggregates;
    graph.height = endHeight + currY;
    graph.lineHeight = lineHeight;
  }
}

export function getGroupingForestPlotData(graph) {
  const { papers } = graph.metaanalysis;

  let orFunc;
  let wtFunc;
  let lclFunc;
  let uclFunc;
  let moderatorParam;
  let params;

  const headingOffset = 10;
  const groupLineOffset = 0;
  const zeroGroupsWidth = 70;
  const lineHeight = 30;
  const graphWidth = 200;
  const startHeight = 80;
  const groupStartHeight = 10;
  const heightBetweenGroups = 50;
  const endHeight = 65;
  const minWtSize = 4;
  const maxWtSize = 14;
  const extraLineLen = -40;
  const minDiamondWidth = 14;

  if (graph.formulaName === 'forestPlotGroupGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatio', formulaParams: [params[0], params[2]] };
    wtFunc = { formulaName: 'weight', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimit', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimit', formulaParams: params };
    moderatorParam = params[4];
  } else
  if (graph.formulaName === 'forestPlotGroupNumberGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatioNumber', formulaParams: params };
    wtFunc = { formulaName: 'weightNumber', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimitNumber', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimitNumber', formulaParams: params };
    moderatorParam = params[4];
  } else
  if (graph.formulaName === 'forestPlotGroupPercentGraph' && isColCompletelyDefined(graph)) {
    params = graph.formulaParams;
    orFunc = { formulaName: 'logOddsRatioPercent', formulaParams: [params[0], params[2]] };
    wtFunc = { formulaName: 'weightPercent', formulaParams: params };
    lclFunc = { formulaName: 'lowerConfidenceLimitPercent', formulaParams: params };
    uclFunc = { formulaName: 'upperConfidenceLimitPercent', formulaParams: params };
    moderatorParam = params[4];
  } else {
    // this function does not handle this type of graph or the graph is not completely defined
    return;
  }

  // get the data
  orFunc.formula = window.lima.createFormulaString(orFunc);
  wtFunc.formula = window.lima.createFormulaString(wtFunc);
  lclFunc.formula = window.lima.createFormulaString(lclFunc);
  uclFunc.formula = window.lima.createFormulaString(uclFunc);
  orFunc.formulaObj = window.lima.getFormulaObject(orFunc.formulaName);
  wtFunc.formulaObj = window.lima.getFormulaObject(wtFunc.formulaName);
  lclFunc.formulaObj = window.lima.getFormulaObject(lclFunc.formulaName);
  uclFunc.formulaObj = window.lima.getFormulaObject(uclFunc.formulaName);

  const lines = [];
  const groups = [];

  for (const paper of papers) {
    for (const exp of paper.experiments) {
      if (exp.excluded) continue;
      const line = {};
      line.title = paper.title || 'new paper';
      if (paper.experiments.length > 1) {
        let expTitle = exp.title || 'new experiment';
        if (expTitle.match(/^\d+$/)) expTitle = `Exp. ${expTitle}`;
        line.title += ` (${expTitle})`;
      }
      line.or = getDatumValue(orFunc, exp);
      line.wt = getDatumValue(wtFunc, exp);
      line.lcl = getDatumValue(lclFunc, exp);
      line.ucl = getDatumValue(uclFunc, exp);
      line.group = getDatumValue(moderatorParam, exp);
      if (line.group != null && line.group !== '' && groups.indexOf(line.group) === -1) {
        groups.push(line.group);
      }

      // if any of the values is NaN or ±Infinity, disregard this experiment
      if (
        isNaN(line.or * 0)
        || isNaN(line.lcl * 0)
        || isNaN(line.ucl * 0)
        || isNaN(line.wt * 0)
        || line.or == null
        || line.lcl == null
        || line.ucl == null
        || line.wt == null
      ) {
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
    const noDataLine = {
      title: 'No data',
      group: 'No data',
    };
    groups.push(noDataLine.group);
    lines.push(noDataLine);
  }

  // graphIndex : pas compris

  groups.sort();

  for (const group of groups) {
    let sumOfWtg = 0;
    for (const line of lines) {
      if (line.group === group) {
        sumOfWtg += line.wt;
      }
    }
    for (const line of lines) {
      if (line.group === group) {
        line.wtg = (line.wt / sumOfWtg) * 1000;
      }
    }
  }

  // const dataGroups = groups.map((group) => (
  //   lines.filter((exp) => exp.group === group)
  // ));
  const dataGroups = [];
  for (const group of groups) {
    const dataGroup = {};
    dataGroup.lines = lines.filter((exp) => exp.group === group);
    dataGroups.push(dataGroup);
  }
  console.log(dataGroups);

  const perGroup = {};
  for (const dataGroup of dataGroups) {
    const { group } = dataGroup.lines[0];
    perGroup[group] = {};
    perGroup[group].wt = dataGroup.lines.reduce((acc, line) => (
      line.wt !== null ? acc + line.wt : acc
    ), 0);
    if (perGroup[group].wt === 0) perGroup[group].wt = 1;
    perGroup[group].or = dataGroup.lines.reduce((acc, line) => (
      line.wt !== null ? acc + line.or * line.wt : acc
    ), 0) / perGroup[group].wt;
  }
  const orAggrFunc = {
    formulaName: 'weightedMeanAggr',
    formulaParams: [orFunc, wtFunc],
  };
  const lclAggrFunc = {
    formulaName: 'lowerConfidenceLimitAggr',
    formulaParams: [orFunc, wtFunc],
  };
  const uclAggrFunc = {
    formulaName: 'upperConfidenceLimitAggr',
    formulaParams: [orFunc, wtFunc],
  };

  orAggrFunc.formula = window.lima.createFormulaString(orAggrFunc);
  lclAggrFunc.formula = window.lima.createFormulaString(lclAggrFunc);
  uclAggrFunc.formula = window.lima.createFormulaString(uclAggrFunc);
  orAggrFunc.formulaObj = window.lima.getFormulaObject(orAggrFunc.formulaName);
  lclAggrFunc.formulaObj = window.lima.getFormulaObject(lclAggrFunc.formulaName);
  uclAggrFunc.formulaObj = window.lima.getFormulaObject(uclAggrFunc.formulaName);

  const aggregates = {
    or: getAggregateDatumValue(orAggrFunc, papers),
    lcl: getAggregateDatumValue(lclAggrFunc, papers),
    ucl: getAggregateDatumValue(uclAggrFunc, papers),
  };

  if (isNaN(aggregates.or * 0)
      || isNaN(aggregates.lcl * 0)
      || isNaN(aggregates.ucl * 0)
  ) {
    aggregates.lcl = 0;
    aggregates.ucl = 0;
  }

  // compute
  //   sum of wt
  //   min and max of wt
  //   min of lcl and aggr lcl
  //   max of ucl and aggr ucl
  let sumOfWt = 0;
  let minWt = Infinity;
  let maxWt = -Infinity;
  let minLcl = aggregates.lcl;
  let maxUcl = aggregates.ucl;

  if (isNaN(minLcl)) minLcl = 0;
  if (isNaN(maxUcl)) maxUcl = 0;
  for (const line of lines) {
    if (line.or == null) break;
    sumOfWt += line.wt;
    if (line.wt < minWt) minWt = line.wt;
    if (line.wt > maxWt) maxWt = line.wt;
    if (line.lcl < minLcl) minLcl = line.lcl;
    if (line.ucl > maxUcl) maxUcl = line.ucl;
  }

  if (minLcl < -10) minLcl = -10;
  if (maxUcl > 10) maxUcl = 10;

  if (minWt === Infinity) minWt = maxWt = 1;
  if (sumOfWt === 0) sumOfWt = 1;

  let TICK_SPACING;
  // select tick spacing based on a rough estimate of how many ticks we'll need anyway
  const clSpread = (maxUcl - minLcl) / Math.LN10; // how many orders of magnitude we cover
  if (clSpread > 3) TICK_SPACING = [100];
  else if (clSpread > 1.3) TICK_SPACING = [10];
  else TICK_SPACING = [2, 2.5, 2]; // ticks at 1, 2, 5, 10, 20, 50, 100...


  // adjust minimum and maximum around decimal non-logarithmic values
  let newBound = 1;
  let tickNo = 0;
  while (Math.log(newBound) > minLcl) {
    tickNo -= 1;
    newBound /= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    // JS % can be negative
  }
  minLcl = Math.log(newBound) - 0.1;

  let startingTickVal = newBound;
  let startingTick = tickNo;

  newBound = 1;
  tickNo = 0;
  while (Math.log(newBound) < maxUcl) {
    newBound *= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    tickNo += 1;
  }
  maxUcl = Math.log(newBound) + 0.1;

  const xRatio = (1 / (maxUcl - minLcl)) * graphWidth;

  const MIN_WT_SPREAD = 2.5;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * maxWtSize - minWtSize;

  let currY = startHeight;
  let currGY = groupStartHeight;
  let hasInvalid = false;

  function getX(val) {
    return (val - minLcl) * xRatio;
  }

  let i = 0;
  for (const group of groups) {
    const groupAggregates = {
      or: 0,
      lcl: 0,
      ucl: 0,
      wt: 0,
    };

    let groupMembers = 0; // counter
    let groupHasInvalid = false;
    currGY = groupStartHeight;

    for (const line of lines) {
      if (line.group === group) {
        if (line.or !== null) {
          groupMembers += 1;
          groupAggregates.or += line.or;
          groupAggregates.lcl += line.lcl;
          groupAggregates.ucl += line.ucl;
          groupAggregates.wt += Math.round((line.wt / sumOfWt) * 1000) / 10;
        } else {
          hasInvalid = true;
          groupHasInvalid = true;
        }
        line.currGY = currGY;
        currGY += lineHeight;
      }
    }
    // if stat != wt, then divide the groupAggregate sums by the number of valid lines in the group.
    for (const stat in groupAggregates) {
      if (stat !== 'wt') {
        groupAggregates[stat] /= groupMembers;
      } else {
      // avoid having too much decimals
        groupAggregates[stat] = groupAggregates[stat].toFixed(1);
      }
    }

    // put group summary into the plot
    if (!groupHasInvalid) {
      let lclX = getX(groupAggregates.lcl);
      let uclX = getX(groupAggregates.ucl);
      const orX = getX(groupAggregates.or);
      if ((uclX - lclX) < minDiamondWidth) {
        const ratio = (uclX - lclX) / minDiamondWidth;
        lclX = orX + (lclX - orX) / ratio;
        uclX = orX + (uclX - orX) / ratio;
      }
      const confidenceInterval = `${lclX},0 ${orX},-10 ${uclX},0 ${orX},10`;
      dataGroups[i].confidenceInterval = confidenceInterval;
      dataGroups[i].groupAggregates = groupAggregates;
      dataGroups[i].currGY = currGY;
      currGY += lineHeight;
    }
    dataGroups[i].currY = currY;
    currY += currGY + heightBetweenGroups;
    i += 1;
  }

  // put axes into the plot
  const tickVals = [];
  let tickVal;

  while ((tickVal = Math.log(startingTickVal)) < maxUcl) {
    tickVals.push([tickVal, startingTickVal]);
    startingTickVal *= TICK_SPACING[window.lima._.mod(startingTick, TICK_SPACING.length)];
    startingTick += 1;
  }

  let yAxis = currY;
  // put summary into the plot
  if (!isNaN(aggregates.or * 0) && !hasInvalid) {
    currY += 2 * lineHeight;
    let lclX = getX(aggregates.lcl);
    let uclX = getX(aggregates.ucl);
    const orX = getX(aggregates.or);
    if ((uclX - lclX) < minDiamondWidth) {
      const ratio = (uclX - lclX) / minDiamondWidth;
      lclX = orX + (lclX - orX) / ratio;
      uclX = orX + (uclX - orX) / ratio;
    }

    const confidenceInterval = `${lclX},0 ${orX},-10 ${uclX},0 ${orX},10`;
    graph.confidenceInterval = confidenceInterval;
  }

  const height = endHeight + currY;
  graph.height = height;
  graph.yAxis = yAxis;
  graph.groupLineOffset = groupLineOffset;
  graph.headingOffset = headingOffset;
  graph.tickVals = tickVals;
  graph.groups = groups;
  graph.lines = lines;
  graph.dataGroups = dataGroups;
  graph.aggregates = aggregates;
  graph.minWtSize = minWtSize;
  graph.minWt = minWt;
  graph.wtRatio = wtRatio;
  graph.xRatio = xRatio;
  graph.minLcl = minLcl;
  graph.currY = currY;
  graph.extraLineLen = extraLineLen;
  graph.lineHeight = lineHeight;


  console.log(yAxis);
  console.log(currY);
  // todo set plot widths based on maximum text sizes
}
