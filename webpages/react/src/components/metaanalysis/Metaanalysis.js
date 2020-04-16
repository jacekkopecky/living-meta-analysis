import React from 'react';
import Info from './info/Info';
import './Metaanalysis.css';

function Metaanalysis(props) {
  const { items } = props;
  const { title, description, published } = items;
  return (
    <div className="metaanalysis">
      <h1>
        Meta-Analysis :
        {' '}
        {title}
      </h1>
      <Info description={description} reference={published} />
    </div>
  );
}

export default Metaanalysis;
