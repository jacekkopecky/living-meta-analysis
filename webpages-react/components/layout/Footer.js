import React, { useEffect, useState, useContext } from 'react';
import EditContext from '../metaanalysis/EditContext';
import './Footer.css';

function Footer() {
  // Displays the footer and fetches LiMA version
  const [version, updateVersion] = useState('');
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const edit = useContext(EditContext);
  let content;

  useEffect(() => {
    async function fetchVersion() {
      const url = '/version/';
      try {
        const response = await fetch(url);
        const data = await response.text();
        setLoaded(true);
        updateVersion(data);
      } catch (err) {
        setLoaded(true);
        setError(err);
      }
    }
    fetchVersion();
  }, []);

  if (error) {
    content = (
      <span>
        Error:
        { error.message }
      </span>
    );
  } else if (isLoaded) {
    content = <span>{ version }</span>;
  } else {
    content = <span>Loading...</span>;
  }

  return (
    <footer className={edit.flag ? 'editMode primary' : null}>
      <p>
        LiMA (Living Meta-Analysis) at
        { ' ' }
        <a href="http://port.ac.uk/">University of Portsmouth</a>
        , © 20162020
      </p>
      <p>
        Feedback and questions are welcome at
        { ' ' }
        <a href="mailto:lima@port.ac.uk">lima@port.ac.uk</a>
        .
      </p>
      <p>
        version
        { ' ' }
        <span className="value">{ content }</span>
        { ' ' }
        (
        <a href="/version/log">full changelog</a>
        )
      </p>
    </footer>
  );
}

export default Footer;
