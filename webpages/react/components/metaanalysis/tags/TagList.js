import React from 'react';
import Tag from './Tag';
import NewTag from './NewTag';
import './TagList.css';

export default function TagList(props) {
  const { tags, setTags, edit } = props;

  const handleDelete = (text) => {
    const newTags = [...tags];
    const index = newTags.indexOf(text);
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleAdd = (tag) => {
    tag = String(tag).trim();
    const newTags = [...tags];
    if (tag && !tags.includes(tag)) {
      newTags.push(tag);
      setTags(newTags);
    }
  };

  return (
    <ul className="tags">
      { tags.map((tag) => <Tag key={tag} edit={edit} text={tag} onDelete={handleDelete} />) }
      { edit && (
        <NewTag
          empty={tags.length === 0}
          onAdd={handleAdd}
        />
      ) }
    </ul>
  );
}
