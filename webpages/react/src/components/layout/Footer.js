import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer>
      <p variant="body2">

        LiMA (Living Meta-Analysis) at
        {' '}
        <a href="http://port.ac.uk/">University of Portsmouth</a>
        , © 20162020

      </p>
      <p variant="body2">
        Feedback and questions are welcome at
        {' '}
        <a href="mailto:lima@port.ac.uk">lima@port.ac.uk</a>
        .
      </p>
      <p variant="body2">
        version
        {' '}
        <span className="value">2020-04-16</span>
        {' '}
        (
        <a href="/version/log">full changelog</a>
        )
      </p>
    </footer>
  );
}

export default Footer;
