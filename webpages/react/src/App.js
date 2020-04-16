import React from 'react';
import Header from './components/layout/header/Header';
import './App.css';
import Metaanalysis from './components/metaanalysis/Metaanalysis';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
    };
  }

  async componentDidMount() {
    // full url : https://lima.soc.port.ac.uk/api/metaanalyses/HartmutBlank/MisinformationEffect
    const url = `https://lima.soc.port.ac.uk/api/metaanalyses${window.location.pathname}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.setState({
        isLoaded: true,
        items: data,
      });
    } catch (err) {
      this.setState = {
        isLoaded: true,
        err,
      };
    }
  }

  handleFetch() {
    const { error, isLoaded, items } = this.state;
    if (error) {
      return (
        <div>
          Error:
          {error.message}
        </div>
      );
    }
    if (!isLoaded) return <div>Loading...</div>;

    return (
      <Metaanalysis items={items} />
    );
  }

  render() {
    return (
      <div>
        <Header />
        {this.handleFetch()}
      </div>
    );
  }
}

export default App;
