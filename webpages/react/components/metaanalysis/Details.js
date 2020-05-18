import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './Details.css';

const detailsRoot = document.getElementById('details');

function Details(props) {
  const { children } = props;

  console.log(children);
  ReactDOM.render(children, detailsRoot);
  return null;
}

export default Details;
