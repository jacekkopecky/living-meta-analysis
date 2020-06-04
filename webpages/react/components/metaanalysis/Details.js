/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect } from 'react';
import './Details.css';

function Details(props) {
  const { displayedCell, setDisplayedCell } = props;
  function closeDetails() {
    setDisplayedCell({ ids: null, text: null });
  }
  useEffect(() => {
    const keyPressHandler = (e) => {
      const { key } = e;
      switch (key) {
      case 'Escape':
        closeDetails();
        break;
      default:
        break;
      }
    };

    document.addEventListener('keydown', keyPressHandler);
    return () => {
      document.removeEventListener('keydown', keyPressHandler);
    };
  }, []);

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
