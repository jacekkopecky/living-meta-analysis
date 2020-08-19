import React, { useState, useEffect, useContext } from 'react';
import EditContext from './EditContext';
import Comments from './Comments';
import './Details.css';

function Details(props) {
  const { displayedCell, setDisplayedCell } = props;
  const edit = useContext(EditContext);
  const commentFlag = useState(false);
  const commentState = useState({});

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

  if (displayedCell && displayedCell.cellId !== null) {
    return (
      <aside className="details">
        <div className={`header ${edit.flag ? 'editMode primary' : ''}`}>
          <h3>Cell details:</h3>
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
          <div className="detailsTableContainer">
            { displayedCell.text }
          </div>
          <Comments
            cellDetails={displayedCell}
            commentFlag={commentFlag}
            commentState={commentState}
          />
        </div>
      </aside>
    );
  }
  return null;
}

export default Details;
