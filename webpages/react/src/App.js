import React from 'react';
import Info from './components/tabs/info/Info';
import Table from './components/tabs/table/Table';
import Tabs from './components/layout/Tabs';
import Header from './components/layout/Header';
import './App.css';

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
    //full url : https://lima.soc.port.ac.uk/api/metaanalyses/HartmutBlank/MisinformationEffect
    const url =
      'https://lima.soc.port.ac.uk/api/metaanalyses' + window.location.pathname;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.setState({
        isLoaded: true,
        items: data,
      });
    } catch (err) {
      alert(err);
      this.setState = {
        isLoaded: true,
        err,
      };
    }
  }
  render() {
    return (
      <div>
        <Header />
        <h1>{this.state.items.title}</h1>
        <Tabs>
          <div label="Info">{this.handleInfo()}</div>
          <div label="Table">{this.handleTable()}</div>
          <div label="Plots">This is plots tab !</div>
          <div label="Aggregates">This is aggs tab !</div>
        </Tabs>
      </div>
    );
  }
  handleInfo() {
    const { error, isLoaded, items } = this.state;
    if (error) return <div>Error: {error.message}</div>;
    else if (!isLoaded) return <div>Loading...</div>;
    else {
      return (
        <Info reference={items.published} description={items.description} />
      );
    }
  }
  handleTable() {
    return <Table />;
  }
}

export default App;
