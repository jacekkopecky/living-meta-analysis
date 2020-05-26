import React from 'react';

function Clickable(props) {
  const {
    cellId, cellContent, cellDetails,
  } = props;
  const { toggleDisplay } = props;
  return (
    <>
      {React.cloneElement(cellContent, { onClick: () => toggleDisplay(cellId, cellDetails) })}
    </>
  );
}


export default Clickable;
