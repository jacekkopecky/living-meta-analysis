import React from 'react';
import './ForestPlots.css';

function ForestPlots(props) {
  const { forestPlots } = props;
  const { height } = forestPlots;
  const padding = 10;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="forestplot"
      width="800"
      height={height}
      version="1.1"
    >
      <g className="headings">
        <text className="or lcl ucl">OR [LCL, UCL]</text>
        <text className="wt">Weight</text>
        <text className="title">Forest Plot</text>
      </g>

      {forestPlots.lines.map((line) => {
        const {
          currY, lcl, ucl, or, wt, title, sumOfWt, minLcl, xRatio, minWt, wtRatio, minWtSize,
        } = line;
        const getX = (val) => (val - minLcl) * xRatio;
        const getBoxSize = (wt) => (Math.sqrt(wt) - minWt) * wtRatio + minWtSize;

        const error = false;
        const texts = (
          <>
            <text className="expname">{title || 'error'}</text>
            <text className="or lcl ucl">{`${Math.exp(or).toFixed(1)} [${Math.exp(lcl).toFixed(1)}, ${Math.exp(ucl).toFixed(1)}]` || 'invalid [n/a, n/a]'}</text>
            <text className="wt">{`${(Math.round((wt / sumOfWt) * 1000) / 10).toFixed(1)}%` || 'n/a'}</text>
          </>
        );
        return (
          <g className="experiment" transform={`translate(${padding}, ${currY})`}>
            {/* <!-- should get transform="translate(padding,currY++)" --> */}
            {texts}
            <g className="rowgraph">
              <line className="confidenceinterval" x1={getX(lcl)} x2={getX(ucl)} />
              {/* <!-- should get x1="lcl" x2="ucl" --> */}
              <rect
                className="weightbox"
                x={getX(or) - getBoxSize(wt) / 2}
                y={-getBoxSize(wt) / 2}
                width={getBoxSize(wt)}
                height={getBoxSize(wt)}
              />
              {/* <!-- should get x="or" width="wt" height="wt" --> */}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export default ForestPlots;
