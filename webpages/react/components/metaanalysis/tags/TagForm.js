import React, { Component } from 'react';

// TODO: Using hooks
export default class TagForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newTag: '',
    };
  }

  handleChange = (event) => {
    this.setState({ newTag: event.currentTarget.value });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { onClientAdd } = this.props;
    const { newTag } = this.state;
    onClientAdd(newTag);
    this.setState({ newTag: '' });
  }

  render() {
    const { newTag } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          value={newTag}
          onChange={this.handleChange}
          type="text"
          placeholder="new tag"
        />
        <button type="submit">add</button>
      </form>
    );
  }
}
