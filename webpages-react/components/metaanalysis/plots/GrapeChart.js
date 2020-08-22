import React from 'react';
import './GrapeChart.css';

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
      <g className="axes">
        <line className="yaxis" x1="0" x2="0" y2="500" />

        { tickVals.map((tickVal) => (
          <g key={tickVal[0]} className="tick" transform={`translate(${0},${tickVal[2]})`}>
            <line x2="5" />
            <text>{ tickVal[0] < 0 ? tickVal[1].toPrecision(1) : Math.round(tickVal[1]) }</text>
          </g>
        )) }
        <text className="ylabel" transform="translate(-40,-260) rotate(-90)">odds ratio</text>
        { /* <!-- <g class="legend">
              <text x="530" y="-515">Legend:</text>
              <line class="guideline" x1="540" x2="575" y1="-490" y2="-490" />
              <text x="580" y="-490">weighted mean</text>
              </g> --> */ }
        <text className="title" transform="translate(-40,-530)">{ graph.title || graph.fullLabel }</text>
      </g>

      { /* Displaying circles and guidelines */ }
      { groups.map((group, index) => {
        const dataGroup = dataGroups[index];
        const { withPosButton, withLegend, guidelineY } = dataGroup;
        return (
          <React.Fragment key={group}>
            <g
              className={`group ${withPosButton ? 'with-pos-button' : ''} ${withLegend ? 'with-legend' : ''}`}
              transform={`translate(${+firstGroup + groupSpacing * index}, ${0})`}
            >
              <g>
                <line className="xaxis" x1="-150" x2="150" />
                <g className="guideline" transform={`translate(${0},${guidelineY})`}>
                  <line className="guideline" x1="-142.5" x2="142.5" />
                  <g className="legend">
                    <text>weighted</text>
                    <text>mean</text>
                  </g>
                </g>
                <line className="trunk" x1="0" x2="0" y2="500" />
                <text className="label">{ group }</text>
                { dataGroup.data.map((exp) => {
                  const { radius, grapeX, grapeY } = exp;
                  return (
                    <circle
                      key={exp.index}
                      className={`experiment grape c${index % numberOfColours}`}
                      r={radius}
                      transform={`translate(${grapeX},${grapeY})`}
                    />
                  );
                }) }

              </g>
            </g>
          </React.Fragment>
        );
      }) }

      { /* Displaying tootltips after circles so that z-index > circles */ }
      { groups.map((group, index) => {
        const dataGroup = dataGroups[index];
        return (
          <g
            key={group}
            className="group tooltips"
            transform={`translate(${+firstGroup + groupSpacing * index}, ${0})`}
          >
            <g>
              { dataGroup.data.map((exp) => {
                const {
                  radius,
                  grapeX,
                  grapeY,
                  text,
                  isTopHalf,
                } = exp;
                return (
                  <React.Fragment key={exp.index}>
                    <g
                      className="experiment"
                      transform={`translate(${grapeX}, ${grapeY})`}
                    >
                      <circle
                        className="grape"
                        r={radius}
                      />
                      <g className={`tooltip ${isTopHalf ? 'tophalf' : ''}`}>
                        <rect height="103" width={exp.boxWidth + (+tooltipPadding)} />
                        <text className="paper">{ text.paper || 'n/a' }</text>
                        <text className="exp  ">{ text.exp || 'n/a' }</text>
                        <text className="or   ">{ text.or || 'invalid data' }</text>
                        <text className="wt   ">{ text.wt || 'n/a' }</text>
                        <text className="ci   ">{ text.ci || 'n/a' }</text>
                        <text className="_or  ">OR:</text>
                        <text className="_wt  ">Weight:</text>
                        <text className="_ci  ">95% CI:</text>
                      </g>
                    </g>
                  </React.Fragment>
                );
              }) }
            </g>
          </g>
        );
      }) }
    </svg>
  );
}

export default GrapeChart;
