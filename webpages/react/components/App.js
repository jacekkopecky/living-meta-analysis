import React, { useState, useEffect } from 'react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Metaanalysis from './metaanalysis/Metaanalysis';
import './App.css';


function App() {
  const [metaanalysis, updateMetaanalysis] = useState([]);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const CLIENT_ID = '358237292980-kbme56c9ih4rpmob16sq8bjig5dms6pl.apps.googleusercontent.com';
  const { gapi } = window;


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
        {error.message}
      </div>
    );
  } else if (isLoaded === true) {
    content = (<Metaanalysis metaanalysis={metaanalysis} currentUser={currentUser} />);
  } else {
    content = <div>Loading...</div>;
  }

  return (
    <div className="app">
      <Header currentUser={currentUser} />
      {content}
      <Footer />
    </div>
  );
}

export default App;
