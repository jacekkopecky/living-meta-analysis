import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import './App.css';
import Metaanalysis from './components/metaanalysis/Metaanalysis';

function App() {
  const [items, updateItems] = useState([]);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // fetch request to the API
  // then everything is spread in children components
  useEffect(() => {
    async function fetchItems() {
      const url = `https://lima.soc.port.ac.uk/api/metaanalyses${window.location.pathname}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        updateItems(data);
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
  } else if (isLoaded === true) content = (<Metaanalysis items={items} />);
  else content = <div>Loading...</div>;

  return (
    <div className="app">
      <Header />
      {content}
      <Footer />
    </div>
  );
}

export default App;
