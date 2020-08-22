import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import GrapeChart from './GrapeChart';
import { getSimpleForestPlotData, getGroupingForestPlotData, getGrapeChartData } from '../../../tools/graphtools';
import './Plots.css';

function Plots(props) {
  const { selectedGraph } = props;

  const { formulaName, formula } = selectedGraph;
  if (formulaName === 'grapeChartPercentGraph'
      || formulaName === 'grapeChartNumberGraph'
      || formulaName === 'grapeChartGraph') {
    // Populate the graph with useful values
    getGrapeChartData(selectedGraph);
    return <GrapeChart key={formula} graph={selectedGraph} />;
  }
  if (formulaName === 'forestPlotPercentGraph'
      || formulaName === 'forestPlotNumberGraph'
      || formulaName === 'forestPlotGraph') {
    // Populate the graph with useful values
    getSimpleForestPlotData(selectedGraph);
    return <SimpleForestPlots key={formula} forestPlots={selectedGraph} />;
  }
  if (formulaName === 'forestPlotGroupPercentGraph'
      || formulaName === 'forestPlotGroupNumberGraph'
      || formulaName === 'forestPlotGroupGraph') {
    // Populate the graph with useful values
    getGroupingForestPlotData(selectedGraph);
    return <GroupingForestPlots key={formula} forestPlots={selectedGraph} />;
  }
}

export default Plots;
