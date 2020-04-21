import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
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

  // fetch request to the API
  // then everything is spread in children components
  async componentDidMount() {
    // full url : https://lima.soc.port.ac.uk/api/metaanalyses/HartmutBlank/MisinformationEffect
    const url = `https://lima.soc.port.ac.uk/api/metaanalyses${window.location.pathname}`;
    // const url = `https://lima.soc.port.ac.uk/api/metaanalyses/yan.imensar@gmail.com/Test/`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      this.setState({
        isLoaded: true,
        items: data,
      });
    } catch (err) {
      this.setState = {
        isLoaded: true,
        error: err,
      };
    }
  }

  render() {
    const { error, isLoaded, items } = this.state;
    let content;
    if (error) {
      content = (
        <div>
          Error:
          {error.message}
        </div>
      );
    } else if (isLoaded) {
      content = (
        <Metaanalysis items={items} />
      );
    } else {
      content = <div>Loading...</div>;
    }

    return (
      <div className="app">
        <Header />
        {content}
        <Footer />
      </div>
    );
  }
}

export default App;
