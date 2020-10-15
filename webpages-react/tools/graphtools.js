import { isColCompletelyDefined, getDatumValue, getAggregateDatumValue } from './datatools';

export function getSimpleForestPlotData(graph) {
  const { papers } = graph.metaanalysis;
  const { formulaParams } = graph;

  let orFunc;
  let wtFunc;
  let lclFunc;
  let uclFunc;

  const lineHeight = 30;
  const graphWidth = 300;
  const startHeight = 70;
  const endHeight = 65;
  const minWtSize = 4;
  const maxWtSize = 14;
  const minDiamondWidth = 14;

  if (graph.formulaName === 'forestPlotGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatio', formulaParams: [formulaParams[0], formulaParams[2]] };
    wtFunc = { formulaName: 'weight', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimit', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimit', formulaParams };
  } else
  if (graph.formulaName === 'forestPlotNumberGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioNumber', formulaParams };
    wtFunc = { formulaName: 'weightNumber', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitNumber', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimitNumber', formulaParams };
  } else
  if (graph.formulaName === 'forestPlotPercentGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioPercent', formulaParams: [formulaParams[0], formulaParams[2]] };
    wtFunc = { formulaName: 'weightPercent', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitPercent', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimitPercent', formulaParams };
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
      if (!exp.excluded) {
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
        if (Number.isNaN(line.or * 0) || Number.isNaN(line.lcl * 0)
              || Number.isNaN(line.ucl * 0) || Number.isNaN(line.wt * 0)
              || line.or == null || line.lcl == null || line.ucl == null || line.wt == null) {
          delete line.or;
          delete line.lcl;
          delete line.ucl;
          delete line.wt;
        }
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

  if (Number.isNaN(aggregates.or * 0)
        || Number.isNaN(aggregates.lcl * 0)
        || Number.isNaN(aggregates.ucl * 0)) {
    aggregates.lcl = 0;
    aggregates.ucl = 0;
  }
  let sumOfWt = 0;
  let minWt = Infinity;
  let maxWt = -Infinity;
  let minLcl = aggregates.lcl;
  let maxUcl = aggregates.ucl;

  if (Number.isNaN(minLcl)) minLcl = 0;
  if (Number.isNaN(maxUcl)) maxUcl = 0;

  for (const line of lines) {
    // eslint-disable-next-line no-continue
    if (line.or == null) continue;
    sumOfWt += line.wt;
    if (line.wt < minWt) minWt = line.wt;
    if (line.wt > maxWt) maxWt = line.wt;
    if (line.lcl < minLcl) minLcl = line.lcl;
    if (line.ucl > maxUcl) maxUcl = line.ucl;
  }
  if (minLcl < -10) minLcl = -10;
  if (maxUcl > 10) maxUcl = 10;

  if (minWt === Infinity) {
    minWt = 1;
    maxWt = 1;
  }
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
  // we can uncomment this to make all weights relative to only the maximum weight
  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * (maxWtSize - minWtSize);

  let currY = startHeight;

  for (const line of lines) {
    line.currY = currY;
    currY += lineHeight;
  }

  if (!Number.isNaN(aggregates.or * 0)) {
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
      tickVal = Math.log(startingTickVal);
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
  const { formulaParams } = graph;
  const moderatorParam = formulaParams[4];

  let orFunc;
  let wtFunc;
  let lclFunc;
  let uclFunc;

  const headingOffset = 10;
  const groupLineOffset = 0;
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
    orFunc = { formulaName: 'logOddsRatio', formulaParams: [formulaParams[0], formulaParams[2]] };
    wtFunc = { formulaName: 'weight', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimit', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimit', formulaParams };
  } else
  if (graph.formulaName === 'forestPlotGroupNumberGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioNumber', formulaParams };
    wtFunc = { formulaName: 'weightNumber', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitNumber', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimitNumber', formulaParams };
  } else
  if (graph.formulaName === 'forestPlotGroupPercentGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioPercent', formulaParams: [formulaParams[0], formulaParams[2]] };
    wtFunc = { formulaName: 'weightPercent', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitPercent', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimitPercent', formulaParams };
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
      if (!exp.excluded) {
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
          Number.isNaN(line.or * 0)
        || Number.isNaN(line.lcl * 0)
        || Number.isNaN(line.ucl * 0)
        || Number.isNaN(line.wt * 0)
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

  const dataGroups = [];
  for (const group of groups) {
    const dataGroup = {};
    dataGroup.lines = lines.filter((exp) => exp.group === group);
    dataGroups.push(dataGroup);
  }

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

  if (Number.isNaN(aggregates.or * 0)
      || Number.isNaN(aggregates.lcl * 0)
      || Number.isNaN(aggregates.ucl * 0)
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

  if (Number.isNaN(minLcl)) minLcl = 0;
  if (Number.isNaN(maxUcl)) maxUcl = 0;
  for (const line of lines) {
    if (line.or !== null) {
      sumOfWt += line.wt;
      if (line.wt < minWt) minWt = line.wt;
      if (line.wt > maxWt) maxWt = line.wt;
      if (line.lcl < minLcl) minLcl = line.lcl;
      if (line.ucl > maxUcl) maxUcl = line.ucl;
    }
  }

  if (minLcl < -10) minLcl = -10;
  if (maxUcl > 10) maxUcl = 10;

  if (minWt === Infinity) {
    minWt = 1;
    maxWt = 1;
  }
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

  function getX(val) {
    return (val - minLcl) * xRatio;
  }

  const MIN_WT_SPREAD = 2.5;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * (maxWtSize - minWtSize);

  let currY = startHeight;
  let currGY = groupStartHeight;
  let hasInvalid = false;

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

  const yAxis = currY;
  // put summary into the plot
  if (!Number.isNaN(aggregates.or * 0) && !hasInvalid) {
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

  // todo set plot widths based on maximum text sizes
}

export function getGrapeChartData(graph) {
  const { papers } = graph.metaanalysis;
  const { formulaParams } = graph;
  const moderatorParam = formulaParams[4];
  const dataParams = formulaParams.slice(0, 4);

  let orFunc;
  let wtFunc;
  let lclFunc;
  let uclFunc;

  const height = 600;
  const zeroGroupsWidth = 70;
  const graphHeight = 500;
  const minGrapeSize = 7;
  const maxGrapeSize = 14;
  const firstGroup = 210;
  const groupSpacing = 300;
  const grapeSpacing = 1.5;
  const tooltipPadding = 20;
  const tooltipMinWidth = 150;
  const nbGroups = 7;

  if (graph.formulaName === 'grapeChartGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatio', formulaParams: [formulaParams[0], formulaParams[2]] };
    wtFunc = { formulaName: 'weight', formulaParams };
    lclFunc = { formulaName: 'lowerConfidenceLimit', formulaParams };
    uclFunc = { formulaName: 'upperConfidenceLimit', formulaParams };
  } else
  if (graph.formulaName === 'grapeChartNumberGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioNumber', formulaParams: dataParams };
    wtFunc = { formulaName: 'weightNumber', formulaParams: dataParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitNumber', formulaParams: dataParams };
    uclFunc = { formulaName: 'upperConfidenceLimitNumber', formulaParams: dataParams };
  } else
  if (graph.formulaName === 'grapeChartPercentGraph' && isColCompletelyDefined(graph)) {
    orFunc = { formulaName: 'logOddsRatioPercent', formulaParams: [dataParams[0], dataParams[2]] };
    wtFunc = { formulaName: 'weightPercent', formulaParams: dataParams };
    lclFunc = { formulaName: 'lowerConfidenceLimitPercent', formulaParams: dataParams };
    uclFunc = { formulaName: 'upperConfidenceLimitPercent', formulaParams: dataParams };
  } else {
    // this function does not handle this type of graph or the graph is not completely defined
    return;
  }

  orFunc.formula = window.lima.createFormulaString(orFunc);
  wtFunc.formula = window.lima.createFormulaString(wtFunc);
  lclFunc.formula = window.lima.createFormulaString(lclFunc);
  uclFunc.formula = window.lima.createFormulaString(uclFunc);
  orFunc.formulaObj = window.lima.getFormulaObject(orFunc.formulaName);
  wtFunc.formulaObj = window.lima.getFormulaObject(wtFunc.formulaName);
  lclFunc.formulaObj = window.lima.getFormulaObject(lclFunc.formulaName);
  uclFunc.formulaObj = window.lima.getFormulaObject(uclFunc.formulaName);

  const data = [];
  const groups = [];

  for (const paper of papers) {
    for (const exp of paper.experiments) {
      if (!exp.excluded) {
        const line = {};
        line.paper = paper.title || 'new paper';
        line.exp = exp.title || 'new experiment';
        if (line.exp.match(/^\d+$/)) {
          line.exp = `Exp. ${line.exp}`;
        }
        line.or = getDatumValue(orFunc, exp);
        line.wt = getDatumValue(wtFunc, exp);
        line.lcl = getDatumValue(lclFunc, exp);
        line.ucl = getDatumValue(uclFunc, exp);
        line.group = getDatumValue(moderatorParam, exp);
        if (line.group != null && line.group !== '' && groups.indexOf(line.group) === -1) {
          groups.push(line.group);
        }
        if (Number.isNaN(line.or * 0)
            || Number.isNaN(line.lcl * 0)
            || Number.isNaN(line.ucl * 0)
            || Number.isNaN(line.wt * 0)
            || line.or == null
            || line.lcl == null
            || line.ucl == null
            || line.wt == null) {
          delete line.or;
          delete line.lcl;
          delete line.ucl;
          delete line.wt;
        }
        data.push(line);
      }
    }
  }
  if (data.length === 0) {
    const noDataLine = {
      paper: 'No paper',
      exp: 'No experiment',
      group: 'No data',
    };
    groups.push(noDataLine.group);
    data.push(noDataLine);
  }

  groups.sort(); // alphabetically

  const dataGroups = [];
  for (const group of groups) {
    const dataGroup = {};
    dataGroup.data = data.filter((exp) => exp.group === group);
    dataGroups.push(dataGroup);
  }

  const perGroup = {};
  for (const dataGroup of dataGroups) {
    const { group } = dataGroup.data[0];
    perGroup[group] = {};
    perGroup[group].wt = dataGroup.data.reduce((acc, line) => (
      line.wt != null ? acc + line.wt : acc
    ), 0);
    if (perGroup[group].wt === 0) perGroup[group].wt = 1;
    perGroup[group].or = dataGroup.data.reduce((acc, line) => (
      line.wt !== null ? acc + line.or * line.wt : acc
    ), 0) / perGroup[group].wt;
  }

  let minWt = Infinity;
  let maxWt = -Infinity;
  let minOr = Infinity;
  let maxOr = -Infinity;

  for (const exp of data) {
    if (exp.or !== null) {
      if (exp.wt < minWt) minWt = exp.wt;
      if (exp.wt > maxWt) maxWt = exp.wt;
      if (exp.or < minOr) minOr = exp.or;
      if (exp.or > maxOr) maxOr = exp.or;
    }
  }

  if (minOr < -10) minOr = -10;
  if (maxOr > 10) maxOr = 10;
  if (minOr === Infinity) {
    minOr = 0;
    maxOr = 0;
  }
  if (minWt === Infinity) {
    minWt = 1;
    maxWt = 1;
  }

  let TICK_SPACING;
  // select tick spacing based on a rough estimate of how many ticks we'll need anyway
  const clSpread = (maxOr - minOr) / Math.LN10; // how many orders of magnitude we cover
  if (clSpread > 5) TICK_SPACING = [100];
  else if (clSpread > 2) TICK_SPACING = [10];
  else TICK_SPACING = [2, 2.5, 2]; // ticks at 1, 2, 5, 10, 20, 50, 100...
  // adjust minimum and maximum around decimal non-logarithmic values
  let newBound = 1;
  let tickNo = 0;
  while (Math.log(newBound) > minOr) {
    tickNo -= 1;
    newBound /= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    // JS % can be negative
  }
  minOr = Math.log(newBound) - 0.1;

  let startingTickVal = newBound;
  let startingTick = tickNo;

  newBound = 1;
  tickNo = 0;
  while (Math.log(newBound) < maxOr) {
    newBound *= TICK_SPACING[window.lima._.mod(tickNo, TICK_SPACING.length)];
    tickNo += 1;
  }
  maxOr = Math.log(newBound) + 0.1;
  const midOr = (minOr + maxOr) / 2;

  const yRatio = (1 / (maxOr - minOr)) * graphHeight;
  function getY(logVal) {
    if (logVal == null) return 0;
    return -(logVal - minOr) * yRatio;
  }

  function isTopHalf(logVal) {
    return logVal > midOr;
  }

  const MIN_WT_SPREAD = 2.5;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  // minWt = 0;
  // todo we can uncomment this to make all weights relative to only the maximum weight
  // square root the weights because we're using them as
  // lengths of the side of a square whose area should correspond to the weight
  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * (maxGrapeSize - minGrapeSize);

  function getGrapeRadius(wt) {
    if (wt == null) return minGrapeSize;
    return (Math.sqrt(wt) - minWt) * wtRatio + minGrapeSize;
  }

  let currentGroup = -1;
  const numberOfColours = +nbGroups;

  for (const group of groups) {
    currentGroup += 1;
    const dataGroup = dataGroups[currentGroup];

    if (currentGroup === 0) {
      dataGroup.withLegend = true;
    }
    if (currentGroup === groups.length - 1) {
      dataGroup.withPosButton = true;
    }
    resetPositioning();
    let index = 0;
    for (const exp of dataGroup.data) {
      exp.index = index;
      precomputePosition(exp.index, getY(exp.or), getGrapeRadius(exp.wt) + grapeSpacing);
      index += 1;
    }
    finalizePositioning();

    dataGroup.guidelineY = getY(perGroup[group].or);

    const texts = [];

    for (const exp of dataGroup.data) {
      const text = {};
      text.paper = exp.paper;
      text.exp = exp.exp;
      if (exp.or != null) {
        text.or = Math.exp(exp.or).toFixed(2);
        text.wt = `${((exp.wt * 100) / perGroup[group].wt).toFixed(2)}%`;
        text.ci = `${Math.exp(exp.lcl).toFixed(2)}, ${Math.exp(exp.ucl).toFixed(2)}`;
      } else {
        dataGroup.invalid = true;
      }
      if (isTopHalf(exp.or)) {
        exp.isTopHalf = true;
      }

      let boxWidth = +tooltipMinWidth;
      for (const txt of texts) {
        try {
          const w = txt.getBBox().width;
          boxWidth = Math.max(boxWidth, w);
        // eslint-disable-next-line no-empty
        } catch (e) {}
      }
      exp.text = text;
      exp.radius = getGrapeRadius(exp.wt);
      exp.grapeX = getPosition(exp.index);
      exp.grapeY = getY(exp.or);
      exp.boxWidth = boxWidth;
    }
  }
  // put axes into the plot
  const tickVals = [];
  let tickVal;

  while ((tickVal = Math.log(startingTickVal)) < maxOr) {
    tickVals.push([tickVal, startingTickVal, getY(tickVal)]);
    startingTickVal *= TICK_SPACING[window.lima._.mod(startingTick, TICK_SPACING.length)];
    startingTick += 1;
  }
  let positionedGrapes;

  graph.width = zeroGroupsWidth + groups.length * groupSpacing;
  graph.height = height;
  graph.viewBox = `0 0 ${graph.width} ${height}`;
  graph.groups = groups;
  graph.dataGroups = dataGroups;
  graph.firstGroup = firstGroup;
  graph.groupSpacing = groupSpacing;
  graph.numberOfColours = numberOfColours;
  graph.tooltipPadding = tooltipPadding;
  graph.tickVals = tickVals;
  function resetPositioning() {
    positionedGrapes = {
      pre: [],
      sorted: [],
      post: [],
      ybounds: new window.lima._.Bounds(), // this helps us center blocks of grapes
    };
  }

  function precomputePosition(index, y, r) {
    positionedGrapes.ybounds.add(y - r, y + r);
    positionedGrapes.sorted[index] = { index, y, r };
    positionedGrapes.pre[index] = positionedGrapes.sorted[index];
  }

  function finalizePositioning() {
    // position big grapes first so they tend to be more central
    const sortingStrategy = (a, b) => b.r - a.r;
    positionedGrapes.sorted.sort(sortingStrategy);

    // compute X coordinates
    positionedGrapes.sorted.forEach((g1, index) => {
      const xbounds = new window.lima._.Bounds();
      positionedGrapes.post.forEach((g2) => {
        // check that the current grape is close enough to g on the y axis that they can touch
        if (Math.abs(g1.y - g2.y) < (g1.r + g2.r)) {
          // presence of g means current grape cannot be at g.x ± delta
          const delta = Math.sqrt((g1.r + g2.r) * (g1.r + g2.r) - (g1.y - g2.y) * (g1.y - g2.y));
          const min = g2.x - delta;
          const max = g2.x + delta;

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
    const buckets = [];
    positionedGrapes.pre.forEach((g) => {
      const bucketNo = positionedGrapes.ybounds.indexOf(g.y);
      if (bucketNo === -1) throw new Error('assertion failed: grape not in ybounds'); // should never happen
      if (!buckets[bucketNo]) buckets[bucketNo] = [];
      buckets[bucketNo].push(g);
    });

    buckets.forEach((bucket) => {
      let min = Infinity;
      let max = -Infinity;
      bucket.forEach((g) => {
        min = Math.min(min, g.x - g.r);
        max = Math.max(max, g.x + g.r);
      });

      if (min < Infinity && Math.abs(min + max) > 1) {
        // got a connecting group that wants to be moved, move it to center
        const dx = (max + min) / 2;
        bucket.forEach((g) => { g.x -= dx; });
      }
    });
  }

  function getPosition(i) {
    return positionedGrapes.pre[i].x;
  }
}
