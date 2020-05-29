import React from 'react';
import './Editable.css';

export default function ClassEditable(WrappedComponent) {
  return class extends React.Component {
    state = {
      editing: false,
    }

    toggleEdit = (e) => {
      e.stopPropagation();
      if (this.state.editing) {
        this.cancel();
      } else {
        this.edit();
      }
    };

    edit = () => {
      this.setState({
        editing: true,
      }, () => {
        this.domElm.focus();
      });
    };

    save = () => {
      this.setState({
        editing: false,
      }, () => {
        if (this.props.onSave && this.isValueChanged()) {
          console.log('Value is changed', this.domElm.textContent);
        }
      });
    };

    cancel = () => {
      this.setState({
        editing: false,
      });
    };

    isValueChanged = () => this.props.value !== this.domElm.textContent;

    handleKeyDown = (e) => {
      const { key } = e;
      switch (key) {
      case 'Escape':
        this.save();
        break;
      default:
        break;
      }
    };

    render() {
      let editOnClick = true;
      const { editing } = this.state;
      if (this.props.editOnClick !== undefined) {
        editOnClick = this.props.editOnClick;
      }
      return (
        <WrappedComponent
          className={editing ? 'editing' : ''}
          onClick={this.edit}
          contentEditable={editing}
          ref={(domNode) => {
            this.domElm = domNode;
          }}
          suppressContentEditableWarning="true"
          onBlur={this.save}
          onKeyDown={this.handleKeyDown}
          {...this.props}
        >
          {this.props.value}
        </WrappedComponent>
      );
    }
  };
}
