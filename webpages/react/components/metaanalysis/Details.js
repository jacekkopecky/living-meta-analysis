import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './Details.css';

const detailsRoot = document.getElementById('details');

function Details(props) {
  const { children } = props;
  const content = (
    <>
      {children}
    </>
  );
  return ReactDOM.createPortal(content, detailsRoot);
}

export default Details;
