import React, { Component } from 'react';
import Tag from './Tag';
import TagForm from './TagForm';
import './Tags.css';

export default class Tags extends Component {
  constructor(props) {
    super(props);
    const { tags } = props;
    this.state = {
      tags,
    };
  }

  handleDelete = (text) => {
    const { tags } = this.state;
    const newTags = [...tags];
    const index = newTags.findIndex((tag) => tag === text);
    newTags.splice(index, 1);
    this.setState({ tags: newTags });
  };

  handleAdd = (tag) => {
    const { tags } = this.state;
    const newTags = [...tags];
    let exists = false;
    for (const t of tags) {
      if (t === tag) exists = true;
    }
    if (!exists) {
      newTags.push(tag);
      this.setState({ tags: newTags });
    }
  }

  render() {
    let button;
    const { edit } = this.props;
    if (edit) {
      button = <TagForm onClientAdd={this.handleAdd} />;
    }
    const { tags } = this.state;
    return (
      <div className="tags">
        <ul className="tags">
          {tags.map((tag) => <Tag key={tag} edit={edit} text={tag} onDelete={this.handleDelete} />)}
        </ul>
        {button}
      </div>
    );
  }
}
