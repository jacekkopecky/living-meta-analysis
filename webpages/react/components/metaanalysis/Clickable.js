import React from 'react';

function Clickable(props) {
  const {
    clickable, cellId, cellContent, cellDetails,
  } = props;
  const { toggleDisplay, displayedCell } = props;
  return (
    <>
      {React.cloneElement(cellContent, { onClick: () => toggleDisplay(cellId, cellDetails) })}
    </>
  );
}


export default Clickable;
