import React from 'react';
import ReactDOM from 'react-dom';
import './Details.css';

const detailsRoot = document.getElementById('details');

function Details(props) {
  const { children } = props;

  return ReactDOM.createPortal(children, detailsRoot);
}

export default Details;
