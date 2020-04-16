import React from 'react';
import Info from './info/Info';

function Metaanalysis(props) {
  const { items } = props;
  const { title, description, published } = items;
  return (
    <div>
      <h1 className="title">{title}</h1>
      <Info description={description} reference={published} />
    </div>
  );
}

export default Metaanalysis;
