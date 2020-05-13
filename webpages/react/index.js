import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

// Render the react app on index.html div#root
window.addEventListener('load', () => {
  ReactDOM.render(<App />, document.querySelector('#root'));
});
