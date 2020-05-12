import React from 'react';
import './GroupingForestPlots.css';

function GroupingForestPlots(props) {
  const { forestPlots } = props;
  const {
    height,
    headingOffset,
    groupLineOffset,
    extraLineLen,
    lineHeight,
    tickVals,
    groups,
    dataGroups,
    aggregates,
    minWtSize,
    minWt,
    wtRatio,
    xRatio,
    confidenceInterval,
    minLcl,
    currY,
    yAxis,
  } = forestPlots;
  const padding = 10;
  const getX = (val) => (val - minLcl) * xRatio;
  const getBoxSize = (wt) => (Math.sqrt(wt) - minWt) * wtRatio + minWtSize;
  console.log(dataGroups);
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
      {groups.map((group, index) => {
        const dataGroup = dataGroups[index];
        console.log(dataGroup.groupAggregates);
        return (
          <g
            className="forest-group"
            transform={`translate(${headingOffset}, ${dataGroup.currY})`}
          >
            <g className="group-heading">
              <text className="label">{group}</text>
            </g>
            <g className="group-experiments">

              {dataGroup.lines.map((line) => {
                const {
                  title, currGY, lcl, ucl, or, wt, wtg,
                } = line;
                const texts = (
                  <>
                    <text className="expname">{title || 'error'}</text>
                    <text className="or lcl ucl">{`${Math.exp(or).toFixed(1)} [${Math.exp(lcl).toFixed(1)}, ${Math.exp(ucl).toFixed(1)}]` || 'invalid [n/a, n/a]'}</text>
                    {/* <text className="wtg">{`${(Math.round(wt / sumOfWt * 1000) / 10)},'%'` || 'n/a'}</text> */}
                    <text className="wtg">{`${(Math.round(wtg) / 10)}%` || 'n/a'}</text>
                  </>
                );
                return (
                  <g className="experiment" transform={`translate(${groupLineOffset}, ${currGY})`}>
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

            </g>
            <g className="group-summary" transform={`translate(${groupLineOffset}, ${dataGroup.currGY})`}>
              <g className="summary">
                {/* <!-- should get transform="translate(padding,currY)" --> */}
                <g>
                  <text className="sumname">
                    Total for
                    {group}
                  </text>
                  <text className="or lcl ucl">
                    {`${Math.exp(dataGroup.groupAggregates.or).toFixed(1)
                    } [${Math.exp(dataGroup.groupAggregates.lcl).toFixed(1)
                    }, ${Math.exp(dataGroup.groupAggregates.ucl).toFixed(1)
                    }]`
                  || 'err [err, err]'}
                  </text>
                  <text className="wt">{`${dataGroup.groupAggregates.wt}%` || 'err'}</text>
                  <g className="sumgraph">
                    <polygon className="confidenceinterval" points={dataGroup.confidenceInterval} />
                    {/* <!-- should get points="lcl,0 or,-10 ucl,0 or,10" --> */}
                  </g>
                </g>
              </g>
            </g>
          </g>
        );
      })}

      <g className="axes" transform={`translate(${padding}, ${yAxis})`}>
        {/* <!-- should get transform="translate(padding,currY)" --> */}
        <g>
          <line className="yaxis" x1={getX(0)} x2={getX(0)} y2={yAxis+extraLineLen} />
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

      <g className="summary" transform={`translate(${padding}, ${currY})`}>
        {/* <!-- should get transform="translate(padding,currY)" --> */}
        <g>
          <text className="sumname sumtotal">Total</text>
          <text className="or lcl ucl">
            {`${Math.exp(aggregates.or).toFixed(1)}
            [${Math.exp(aggregates.lcl).toFixed(1)}
            , ${Math.exp(aggregates.ucl).toFixed(1)}]`
            || 'err [err, err]'}
          </text>
          <line
            className="guideline"
            x1={getX(aggregates.or)}
            x2={getX(aggregates.or)}
            y2={currY + lineHeight + extraLineLen}
          />
          {/* <!-- should get x1="or" x2="or" y2="currY+parseInt(plotEl.dataset.lineHeight)+parseInt(plotEl.dataset.extraLineLen)" --> */}
          <g className="sumgraph">
            <polygon className="confidenceinterval" points={confidenceInterval} />
            {/* <!-- should get points="lcl,0 or,-10 ucl,0 or,10" --> */}
          </g>
        </g>
      </g>
    </svg>
  );
}

export default GroupingForestPlots;
