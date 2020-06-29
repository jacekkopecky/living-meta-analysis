import React from 'react';

export default function Tag(props) {
  const { edit, text, onDelete } = props;

  const doDelete = (e) => {
    if (e.type === 'click' || e.key === ' ' || e.key === 'Enter') {
      onDelete(text);
      e.preventDefault();
    }
  };

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
      { edit && deleteButton }
    </li>
  );
}
