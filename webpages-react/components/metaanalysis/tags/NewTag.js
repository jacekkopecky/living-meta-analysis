import React, { useState, useEffect, useRef } from 'react';

export default function NewTag(props) {
  const { empty, onAdd } = props;

  const [newTag, setNewTag] = useState('');
  const [adding, setAdding] = useState(false);

  const inputEl = useRef();

  useEffect(() => {
    if (inputEl.current && adding === 'focus') {
      inputEl.current.focus();
      setAdding(true);
    }
  });

  const handleChange = (e) => {
    setNewTag(e.target.value);
  };

  const doAdd = (e) => {
    if (e.type === 'click' || e.key === ' ' || e.key === 'Enter') {
      if (adding) {
        setNewTag('');
        onAdd(newTag);
      } else {
        setAdding('focus');
      }
      e.preventDefault();
    } else if (e.key === 'Escape' && adding) {
      setNewTag('');
      setAdding(false);
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      doAdd(e);
    }
  };

  if (empty && !adding) {
    return (
      <li className="addtag">
        <span
          className="text"
          role="button"
          tabIndex={0}
          onClick={doAdd}
          onKeyPress={doAdd}
        >
          add tags
        </span>
      </li>
    );
  }

  return (
    <>
      { adding && (
        <li className="new">
          <input
            type="text"
            value={newTag}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="new tag"
            ref={inputEl}
          />
        </li>
      ) }
      <li className="addtag">
        <span
          className="text"
          role="button"
          tabIndex={0}
          onClick={doAdd}
          onKeyDown={doAdd}
        >
          +
        </span>
      </li>
    </>
  );
}
