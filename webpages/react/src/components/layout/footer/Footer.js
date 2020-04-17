import React from 'react';
import './Footer.css';
import Typography from '@material-ui/core/Typography';

function Footer() {
  return (
    <footer>
      <Typography variant="body2">

        LiMA (Living Meta-Analysis) at
        {' '}
        <a href="http://port.ac.uk/">University of Portsmouth</a>
        , © 20162020

      </Typography>
      <Typography variant="body2">
        Feedback and questions are welcome at
        {' '}
        <a href="mailto:lima@port.ac.uk">lima@port.ac.uk</a>
        .
      </Typography>
      <Typography variant="body2">
        version
        {' '}
        <span className="value">2020-04-16</span>
        {' '}
        (
        <a href="/version/log">full changelog</a>
        )
      </Typography>
    </footer>
  );
}

export default Footer;
