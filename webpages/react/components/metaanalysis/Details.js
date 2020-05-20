/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import './Details.css';

function Details(props) {
  const { displayedCell, setDisplayedCell } = props;
  function closeDetails() {
    setDisplayedCell({ ids: null, text: null });
  }
  if (displayedCell.text) {
    return (
      <aside className="details">
        <div className="header">
          <h3>Details:</h3>
          <div className="close" onClick={closeDetails}>×</div>
        </div>
        <div className="content">
          {displayedCell.text}
        </div>
      </aside>
    );
  }
  return null;
}

export default Details;
