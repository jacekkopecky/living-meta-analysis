import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import { getSimpleForestPlotData, getGroupingForestPlotData } from '../../../tools/graphtools';
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
        // replace with GrapeCharts here
        return 'GrapeChart';
      })}
    </>
  );
}

export default Plots;
