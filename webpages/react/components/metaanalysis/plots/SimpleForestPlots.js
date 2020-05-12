import React from 'react';
import './SimpleForestPlots.css';

function SimpleForestPlots(props) {
  const { forestPlots } = props;
  const {
    lines,
    height,
    lineHeight,
    aggregates,
    tickVals,
  } = forestPlots;
  const {
    minWtSize,
    minWt,
    wtRatio,
    xRatio,
    confidenceInterval,
    sumOfWt,
    minLcl,
  } = aggregates;
  const padding = 10;
  const getX = (val) => (val - minLcl) * xRatio;
  const getBoxSize = (wt) => (Math.sqrt(wt) - minWt) * wtRatio + minWtSize;
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

      {lines.map((line) => {
        const {
          currY, lcl, ucl, or, wt, title,
        } = line;
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
      <g className="summary" transform={`translate(${padding}, ${aggregates.currY})`}>
        {/* <!-- should get transform="translate(padding,currY)" --> */}
        <g>
          <text className="sumname">Total</text>
          <text className="or lcl ucl">{`${Math.exp(aggregates.or).toFixed(1)} [${Math.exp(aggregates.lcl).toFixed(1)}, ${Math.exp(aggregates.ucl).toFixed(1)}]` || 'invalid [n/a, n/a]'}</text>
          <line className="guideline" x1={getX(aggregates.or)} x2={getX(aggregates.or)} y2={aggregates.currY} />
          {/* <!-- should get x1="or" x2="or" y2="currY+parseInt(plotEl.dataset.lineHeight)+parseInt(plotEl.dataset.extraLineLen)" --> */}
          <g className="sumgraph">
            <polygon className="confidenceinterval" points={confidenceInterval} />
            {/* <!-- should get points="lcl,0 or,-10 ucl,0 or,10" --> */}
          </g>
        </g>
      </g>
      <g className="axes" transform={`translate(${padding}, ${aggregates.currY + lineHeight})`}>
        {/* <!-- should get transform="translate(padding,currY)" --> */}
        <g>
          <line className="yaxis" x1={getX(0)} x2={getX(0)} y2={aggregates.currY} />
          {/* <!-- should get x1="getX(0)" x2="getX(0)" y2="currY+parseInt(plotEl.dataset.extraLineLen)" --> */}
          <line className="xaxis" x1="0" x2="300" />
          {/* <!-- should get a number of ticks --> */}
          {tickVals.map((tickVal) => (
            <g className="tick" transform={`translate(${getX(tickVal[0])}, ${0})`}>
              {/* <!-- should get transform="translate(x,0)" --> */}
              <line y2="5" />
              <text>{tickVal[0] < 0 ? tickVal[1].toPrecision(1) : Math.round(tickVal[1])}</text>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export default SimpleForestPlots;
