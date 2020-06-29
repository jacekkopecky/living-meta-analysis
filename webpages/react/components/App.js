import React, { useState, useEffect } from 'react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Metaanalysis from './metaanalysis/Metaanalysis';
import useGoogleAuth from '../tools/google-auth';
import './App.css';

function App() {
  const [metaanalysis, updateMetaanalysis] = useState([]);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser] = useGoogleAuth(null);

  // fetch request to the API
  // then everything is spread in children components
  useEffect(() => {
    async function fetchItems() {
      const url = `https://lima.soc.port.ac.uk/api/metaanalyses${window.location.pathname}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        updateMetaanalysis(data);
        setLoaded(true);
      } catch (err) {
        setLoaded(true);
        setError(err);
      }
    }
    fetchItems();
  }, []);

  let content;
  if (error) {
    content = (
      <div>
        Error:
        { error.message }
      </div>
    );
  } else if (isLoaded === true) {
    content = (<Metaanalysis metaanalysis={metaanalysis} />);
  } else {
    content = <div>Loading...</div>;
  }

  return (
    <div className="app">
      <Header currentUser={currentUser} />
      { content }
      <Footer />
    </div>
  );
}

export default App;
