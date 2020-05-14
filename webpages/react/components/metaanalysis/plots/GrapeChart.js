import React from 'react';
import './GrapeChart.css';
import { getGrapeChartData } from '../../../tools/graphtools';

function GrapeChart(props) {
  const { graph } = props;
  const {
    viewBox,
    width,
    height,
    groups,
    dataGroups,
    firstGroup,
    groupSpacing,
    numberOfColours,
    tooltipPadding,
    tickVals,
  } = graph;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="grapechart"
      viewBox={viewBox}
      width={width}
      height={height}
      version="1.1"
    >
      {groups.map((group, index) => {
        const dataGroup = dataGroups[index];
        const { withPosButton, withLegend, guidelineY } = dataGroup;
        return (
          <>
            <g
              className={`group ${withPosButton ? 'with-pos-button' : ''} ${withLegend ? 'with-legend' : ''}`}
              transform={`translate(${+firstGroup + groupSpacing * index}, ${0})`}
            >
              {/* <!-- should get transform="translate(groupx,0)" --> */}
              <g>
                <line className="xaxis" x1="-150" x2="150" />
                <g className="guideline" transform={`translate(${0},${guidelineY})`}>
                  {/* <!-- should get transform="translate(0,getY(group.or))"--> */}
                  <line className="guideline" x1="-142.5" x2="142.5" />
                  <g className="legend">
                    <text>weighted</text>
                    <text>mean</text>
                  </g>
                </g>
                <line className="trunk" x1="0" x2="0" y2="500" />
                <text className="label">{group}</text>
                {/* <!-- should be filled --> */}
                {/* <!-- should get some grapes --> */}
                {dataGroup.data.map((exp) => {
                  const { radius, grapeX, grapeY } = exp;
                  return (
                    <circle
                      className={`experiment grape c${exp.index% numberOfColours}`}
                      r={radius}
                      transform={`translate(${grapeX},${grapeY})`}
                    />
                  );
                  /* <!-- should get  r="radius" transform="translate(x,getY(or))" --> */
                })}

              </g>
            </g>

            <g
              className="group tooltips"
              transform={`translate(${+firstGroup + groupSpacing * index}, ${0})`}
            >
              {/* <!-- should get  transform="translate(groupx,0)" --> */}
              <g>
                {dataGroup.data.map((exp) => {
                  const {
                    radius,
                    grapeX,
                    grapeY,
                    text,
                    isTopHalf,
                  } = exp;
                  return (
                    <g
                      className="experiment"
                      transform={`translate(${grapeX}, ${grapeY})`}
                    >
                      {/* <!-- should get transform="translate(x,getY(or))" --> */}
                      <circle
                        className="grape"
                        r={radius}
                      />
                      {/* <!-- should get  r="radius" --> */}
                      <g className={`tooltip ${isTopHalf ? 'tophalf' : ''}`}>
                        <rect height="103" width={exp.boxWidth + (+tooltipPadding)} />
                        {/* <!-- should get width="bounding box width"--> */}
                        <text className="paper">{text.paper || 'n/a'}</text>
                        {/* <!-- should be filled --> */}
                        <text className="exp  ">{text.exp || 'n/a'}</text>
                        {/* <!-- should be filled --> */}
                        <text className="or   ">{text.or || 'invalid data'}</text>
                        {/* <!-- should be filled --> */}
                        <text className="wt   ">{text.wt || 'n/a'}</text>
                        {/* <!-- should be filled --> */}
                        <text className="ci   ">{text.ci || 'n/a'}</text>
                        {/* <!-- should be filled --> */}
                        <text className="_or  ">OR:</text>
                        <text className="_wt  ">Weight:</text>
                        <text className="_ci  ">95% CI:</text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </>
        );
      })}

      <g className="axes">
        <line className="yaxis" x1="0" x2="0" y2="500" />
        {/* <!-- should get a number of ticks --> */}

        {tickVals.map((tickVal) => (
          <g key={tickVal[0]} className="tick" transform={`translate(${0},${tickVal[2]})`}>
            <line x2="5" />
            <text>{tickVal[0] < 0 ? tickVal[1].toPrecision(1) : Math.round(tickVal[1])}</text>
          </g>
        ))}
        <text className="ylabel" transform="translate(-40,-260) rotate(-90)">odds ratio</text>
        {/* <!-- <g class="legend">
              <text x="530" y="-515">Legend:</text>
              <line class="guideline" x1="540" x2="575" y1="-490" y2="-490" />
              <text x="580" y="-490">weighted mean</text>
              </g> --> */}
        <text className="title" transform="translate(-40,-530)">Grape Chart</text>
      </g>
    </svg>
  );
}

export default GrapeChart;
