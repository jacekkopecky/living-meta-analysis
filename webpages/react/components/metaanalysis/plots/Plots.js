/* linting rule ignored as modifications will happen in plots definitions
   i.e: when all plots are unmounted. So we're safely using indexes as keys */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import GrapeChart from './GrapeChart';
import { getSimpleForestPlotData, getGroupingForestPlotData, getGrapeChartData } from '../../../tools/graphtools';
import './Plots.css';


function Plots(props) {
  const { graphs } = props;

  return (
    <>
      {/* render the graphs */}
      {graphs.map((graph, index) => {
        const { formulaName } = graph;
        if (formulaName === 'grapeChartPercentGraph'
            || formulaName === 'grapeChartNumberGraph'
            || formulaName === 'grapeChartGraph') {
          getGrapeChartData(graph);
          return <GrapeChart key={index} graph={graph} />;
        }
        if (formulaName === 'forestPlotPercentGraph'
            || formulaName === 'forestPlotNumberGraph'
            || formulaName === 'forestPlotGraph') {
          // Populate the graph with useful values
          getSimpleForestPlotData(graph);
          return <SimpleForestPlots key={index} forestPlots={graph} />;
        }
        if (formulaName === 'forestPlotGroupPercentGraph'
            || formulaName === 'forestPlotGroupNumberGraph'
            || formulaName === 'forestPlotGroupGraph') {
          // Populate the graph with useful values
          getGroupingForestPlotData(graph);
          return <GroupingForestPlots key={index} forestPlots={graph} />;
        }
        return null;
      })}
    </>
  );
}

export default Plots;
