import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import GrapeChart from './GrapeChart';
import { getSimpleForestPlotData, getGroupingForestPlotData, getGrapeChartData } from '../../../tools/graphtools';
import './Plots.css';

function Plots(props) {
  const { graphs } = props;

  return graphs.map((graph) => {
    const { formulaName, formula } = graph;
    if (formulaName === 'grapeChartPercentGraph'
        || formulaName === 'grapeChartNumberGraph'
        || formulaName === 'grapeChartGraph') {
      // Populate the graph with useful values
      getGrapeChartData(graph);
      return <GrapeChart key={formula} graph={graph} />;
    }
    if (formulaName === 'forestPlotPercentGraph'
        || formulaName === 'forestPlotNumberGraph'
        || formulaName === 'forestPlotGraph') {
      // Populate the graph with useful values
      getSimpleForestPlotData(graph);
      return <SimpleForestPlots key={formula} forestPlots={graph} />;
    }
    if (formulaName === 'forestPlotGroupPercentGraph'
        || formulaName === 'forestPlotGroupNumberGraph'
        || formulaName === 'forestPlotGroupGraph') {
      // Populate the graph with useful values
      getGroupingForestPlotData(graph);
      return <GroupingForestPlots key={formula} forestPlots={graph} />;
    }
    return null;
  });
}

export default Plots;
