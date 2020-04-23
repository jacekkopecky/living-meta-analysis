/* eslint-disable consistent-return */
import React, { Component } from 'react';
import './Tabs.css';

class Tabs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active: 0,
    };
  }

  handleSelect = (tab) => {
    const el = this;
    return () => el.setState({
      active: tab,
    });
  }

  renderTabs = () => {
    const { active } = this.state;
    const { children } = this.props;
    return React.Children.map(children, (item, i) => {
      if (i % 2 === 0) {
        const activated = active === i ? 'active' : '';
        return (
          <button type="button" onClick={this.handleSelect(i)} className={`${activated}tab`}>
            {item}
          </button>
        );
      }
    });
  }

  renderContent() {
    const { active } = this.state;
    const { children } = this.props;
    return React.Children.map(children, (item, i) => {
      if (i - 1 === active) {
        return <div className="content">{item}</div>;
      }
    });
  }

  render() {
    return (
      <div className="tabs">
        <div className="tabbar">
          {this.renderTabs()}
        </div>
        {this.renderContent()}
      </div>
    );
  }
}

export default Tabs;
