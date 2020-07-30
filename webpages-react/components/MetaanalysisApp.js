import React, { useState, useEffect } from 'react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Metaanalysis from './metaanalysis/Metaanalysis';
import useGoogleAuth from '../tools/google-auth';
import EditContext from './metaanalysis/EditContext';
import UserContext from './metaanalysis/UserContext';
import './MetaanalysisApp.css';

function MetaanalysisApp() {
  const [metaanalysis, updateMetaanalysis] = useState([]);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser] = useGoogleAuth(null);

  const [editing, setEditing] = useState(false);

  // fetch request to the API
  // then everything is spread in children components
  useEffect(() => {
    async function fetchItems() {
      const url = `/api/metaanalyses${window.location.pathname}`;
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

  const edit = {
    flag: editing,
    toggle: () => setEditing(!editing),
  };

  return (
    <div className="app">
      <EditContext.Provider value={edit}>
        <UserContext.Provider value={currentUser}>
          <Header currentUser={currentUser} />
          { content }
          <Footer />
        </UserContext.Provider>
      </EditContext.Provider>
    </div>
  );
}

export default MetaanalysisApp;
