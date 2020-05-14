import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import GrapeChart from './GrapeChart';
import { getSimpleForestPlotData, getGroupingForestPlotData, getGrapeChartData } from '../../../tools/graphtools';
import './Plots.css';

// TODO: find keys for map()
// TODO: add GrapeCharts

function Plots(props) {
  const { graphs } = props;
  return (
    <>
      {/* render the graphs */}
      {graphs.map((graph) => {
        const { formulaName } = graph;
        if (formulaName === 'grapeChartPercentGraph'
            || formulaName === 'grapeChartNumberGraph'
            || formulaName === 'grapeChartGraph') {
          getGrapeChartData(graph);
          return <GrapeChart graph={graph} />;
        }
        if (formulaName === 'forestPlotPercentGraph'
            || formulaName === 'forestPlotNumberGraph'
            || formulaName === 'forestPlotGraph') {
          // Populate the graph with useful values
          getSimpleForestPlotData(graph);
          return <SimpleForestPlots forestPlots={graph} />;
        }
        if (formulaName === 'forestPlotGroupPercentGraph'
            || formulaName === 'forestPlotGroupNumberGraph'
            || formulaName === 'forestPlotGroupGraph') {
          // Populate the graph with useful values
          getGroupingForestPlotData(graph);
          return <GroupingForestPlots forestPlots={graph} />;
        }
      })}
    </>
  );
}

export default Plots;
