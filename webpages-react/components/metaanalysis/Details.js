import React, { useEffect } from 'react';
import './Details.css';

function Details(props) {
  const { displayedCell, setDisplayedCell } = props;

  const closeHandler = (e) => {
    if (e.type === 'click' || e.key === ' ' || e.key === 'Enter') {
      setDisplayedCell(null);
    }
  };

  const topLevelEscapeHandler = (e) => {
    if (e.key === 'Escape') {
      setDisplayedCell(null);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', topLevelEscapeHandler);

    return () => {
      document.removeEventListener('keydown', topLevelEscapeHandler);
    };
  }, []);

  if (displayedCell) {
    return (
      <aside className="details">
        <div className="header">
          <h3>Details:</h3>
          <div
            className="close"
            role="button"
            tabIndex="0"
            onClick={closeHandler}
            onKeyDown={closeHandler}
          >
            ×
          </div>
        </div>
        <div className="content">
          { displayedCell.text }
        </div>
      </aside>
    );
  }
  return null;
}

export default Details;
