import React from 'react';
import './GrapeChart.css';
import { getGroupingForestPlotData } from '../../../tools/graphtools';

function GrapeChart(props) {
  const { graph } = props;
  const {
    groups,
  } = graph;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="grapechart"
      viewBox={viewBox}
      width={width}
      height="600"
      version="1.1"
    >
      {groups.map((group, index) => {
        const { someData } = group;
        return (
          <>
            <g className="group-grapes">
              {/* <!-- should get transform="translate(groupx,0)" --> */}
              <g>
                <line className="xaxis" x1="-150" x2="150" />
                <g className="guideline">
                  {/* <!-- should get transform="translate(0,getY(group.or))"--> */}
                  {/* GOOD */}
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
                {groupData.map((exp, index) => {
                  const { someData } = exp;
                  return (
                    <g className="group-grapes-grape">
                      <circle className="experiment grape" />
                      {/* <!-- should get  r="radius" transform="translate(x,getY(or))" --> */}
                    </g>
                  );
                })}

              </g>
            </g>

            <g className="group tooltips">
              {/* <!-- should get  transform="translate(groupx,0)" --> */}
              <g>
                {groupData.map((exp, index) => {
                  const { someData } = exp;
                  return (
                    <g className="group-tooltips-grape">
                      <g className="experiment">
                        {/* <!-- should get transform="translate(x,getY(or))" --> */}
                        <circle className="grape" />
                        {/* <!-- should get  r="radius" --> */}
                        <g className="tooltip">
                          <rect height="103" />
                          {/* <!-- should get width="bounding box width"--> */}
                          <text className="paper">{exp.paper || 'n/a'}</text>
                          {/* <!-- should be filled --> */}
                          <text className="exp  ">{exp.exp || 'n/a'}</text>
                          {/* <!-- should be filled --> */}
                          <text className="or   ">{Math.exp(exp.or).toFixed(2) || 'invalid data'}</text>
                          {/* <!-- should be filled --> */}
                          <text className="wt   ">{`${(exp.wt * 100 / perGroup[group].wt).toFixed(2)}%` || 'n/a'}</text>
                          {/* <!-- should be filled --> */}
                          <text className="ci   ">{`${Math.exp(exp.lcl).toFixed(2)}, ${Math.exp(exp.ucl).toFixed(2)}` || 'n/a'}</text>
                          {/* <!-- should be filled --> */}
                          <text className="_or  ">OR:</text>
                          <text className="_wt  ">Weight:</text>
                          <text className="_ci  ">95% CI:</text>
                        </g>
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
        <template className="tick">
          <g className="tick">
            {/* <!-- should get transform="translate(0,-y)"--> */}
            <line x2="5" />
            <text>1000</text>
          </g>
        </template>
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
