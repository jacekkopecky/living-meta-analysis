import React, { useState } from 'react';
import Tag from './Tag';
import NewTag from './NewTag';
import './TagList.css';

export default function TagList(props) {
  const { tags, edit } = props;
  const [tagList, setTagList] = useState(tags);


  const handleDelete = (text) => {
    const newTags = [...tagList];
    const index = newTags.findIndex((tag) => tag === text);
    newTags.splice(index, 1);
    setTagList(newTags);
  };

  const handleAdd = (tag) => {
    const newTags = [...tagList];
    let exists = false;
    for (const t of tagList) {
      if (t === tag) exists = true;
    }
    if (!exists && tag !== '') {
      newTags.push(tag);
      setTagList(newTags);
    }
  };

  return (
    <div className="tags">
      <ul className="tags">
        {tagList.map((tag) => <Tag key={tag} edit={edit} text={tag} onDelete={handleDelete} />)}
      </ul>
      {edit ? <NewTag onClientAdd={handleAdd} /> : ''}
    </div>
  );
}
