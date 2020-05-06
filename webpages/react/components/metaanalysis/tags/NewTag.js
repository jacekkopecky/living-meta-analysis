import React, { useState } from 'react';

export default function NewTag(props) {
  const [newTag, setNewTag] = useState('');

  const handleChange = (event) => {
    setNewTag(event.currentTarget.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { onClientAdd } = props;
    onClientAdd(newTag);
    setNewTag('');
  };


  return (
    <form onSubmit={handleSubmit}>
      <input
        value={newTag}
        onChange={handleChange}
        type="text"
        placeholder="new tag"
      />
      <button type="submit">add</button>
    </form>
  );
}
