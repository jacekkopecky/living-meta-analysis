import React from 'react';
import './GroupingForestPlots.css';

function GroupingForestPlots(props) {
  const { forestPlots } = props;
  const {
    height,
    lineHeight,
    tickVals,
    groups,
    lines,
  } = forestPlots;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="forestplotgroup"
      width="900"
      height={height}
      version="1.1"
    >
      <g transform="translate(10,50)" className="headings">
        <text className="or lcl ucl">OR [LCL, UCL]</text>
        {/* <!-- <text class="wt">Weight</text> --> */}
        <text className="wtg">Weight</text>
        <text className="title">Forest Plot by moderator level</text>
      </g>
      {groups.map((group) => (
        // need data here
        <g
          className="forest-group"
          transform={`translate(${headingOffset}, ${currY})`}
        >
          <g className="group-heading">
            <text className="label">group</text>
          </g>
          <g className="group-experiments">

            {lines.map((line) => (
              // need data here
              <g className="experiment">
                {/* <!-- should get transform="translate(padding,currY++)" --> */}
                <text className="expname">error</text>
                <text className="or lcl ucl">invalid [n/a, n/a]</text>
                {/* <!-- <text class="wt">n/a</text> --> */}
                <text className="wtg">n/a</text>
                <g className="rowgraph">
                  <line className="confidenceinterval" />
                  {/* <!-- should get x1="lcl" x2="ucl" --> */}
                  <rect className="weightbox" />
                  {/* <!-- should get x="or" width="wt" height="wt" --> */}
                </g>
              </g>
            ))}

          </g>
          <g className="group-summary">
            {/* <!-- should get transform="translate(padding,currY)" --> */}
          </g>
        </g>
      ))}

      <template className="axes">
        <g className="axes">
          {/* <!-- should get transform="translate(padding,currY)" --> */}
          <g>
            <line className="yaxis" />
            {/* <!-- should get x1="getX(0)" x2="getX(0)" y2="currY+parseInt(plotEl.dataset.extraLineLen)" --> */}
            <line className="xaxis" x1="0" x2="300" />
            {/* <!-- should get a number of ticks --> */}
            <template className="tick">
              <g className="tick">
                {/* <!-- should get transform="translate(x,0)" --> */}
                <line y2="5" />
                <text>val</text>
              </g>
            </template>
          </g>
        </g>
      </template>

      <template className="summary">
        <g className="summary">
          {/* <!-- should get transform="translate(padding,currY)" --> */}
          <g>
            <text className="sumname sumtotal">Total</text>
            <text className="or lcl ucl">err [err, err]</text>
            <line className="guideline" />
            {/* <!-- should get x1="or" x2="or" y2="currY+parseInt(plotEl.dataset.lineHeight)+parseInt(plotEl.dataset.extraLineLen)" --> */}
            <g className="sumgraph">
              <polygon className="confidenceinterval" />
              {/* <!-- should get points="lcl,0 or,-10 ucl,0 or,10" --> */}
            </g>
          </g>
          <g className="positioningbutton">
            <circle r="8" />
            <line x1="-5" y1="-5" x2="5" y2="5" />
            <line x1="5" y1="5" x2="4" y2="0" />
            <line x1="5" y1="5" x2="0" y2="4" />
            <line x1="-5" y1="-5" x2="-4" y2="0" />
            <line x1="-5" y1="-5" x2="0" y2="-4" />
          </g>
        </g>
      </template>

      <template className="group-summary">
        <g className="summary">
          {/* <!-- should get transform="translate(padding,currY)" --> */}
          <g>
            <text className="sumname" />
            <text className="or lcl ucl">err [err, err]</text>
            {/* <!-- <text class="wt">err</text> --> */}
            <g className="sumgraph">
              <polygon className="confidenceinterval" />
              {/* <!-- should get points="lcl,0 or,-10 ucl,0 or,10" --> */}
            </g>
          </g>
        </g>
      </template>
    </svg>
  );
}

export default GroupingForestPlots;
