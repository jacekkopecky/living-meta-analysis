import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

import math from '../lib/math.min';

// we're importing the math library used in the orginal LiMA
// we're putting it inside window so that formulas.js can use it
window.math = math;

// Render the react app on index.html div#root
window.addEventListener('load', () => {
  ReactDOM.render(<App />, document.querySelector('#root'));
});
