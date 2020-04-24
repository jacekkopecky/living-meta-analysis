import React from 'react';

export default function Tag(props) {
  const { edit, text, onDelete } = props;
  if (edit === 1) {
    return (
      <li>
        {text}
        {' '}
        <button
          type="button"
          className="deletetag"
          onClick={() => onDelete(text)}
        >
          X
        </button>
      </li>
    );
  }
  return (
    <li>
      {text}
    </li>
  );
}
