import React from 'react';

export default function Tag(props) {
  const { text, onDelete } = props;
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
