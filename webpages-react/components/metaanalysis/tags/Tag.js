import React, { useContext } from 'react';
import EditContext from '../EditContext';

export default function Tag(props) {
  const { text, onDelete } = props;

  const doDelete = (e) => {
    if (e.type === 'click' || e.key === ' ' || e.key === 'Enter') {
      onDelete(text);
      e.preventDefault();
    }
  };

  const edit = useContext(EditContext);

  const deleteButton = (
    <span
      role="button"
      tabIndex={0}
      className="removetag"
      onClick={doDelete}
      onKeyPress={doDelete}
    >
      ×
    </span>
  );

  return (
    <li>
      <span className="text">{ text }</span>
      { edit.flag && deleteButton }
    </li>
  );
}
