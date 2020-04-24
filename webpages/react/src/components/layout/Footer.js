import React from 'react';
import './Footer.css';

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
    };
  }

  async componentDidMount() {
    const url = 'https://lima.soc.port.ac.uk/version/';
    try {
      const response = await fetch(url);
      const data = await response.text();
      this.setState({
        isLoaded: true,
        version: data,
      });
    } catch (err) {
      this.setState = {
        isLoaded: true,
        error: err,
      };
    }
  }

  render() {
    const { error, isLoaded, version } = this.state;
    let content;
    if (error) {
      content = (
        <span>
          Error:
          {error.message}
        </span>
      );
    } else if (isLoaded) {
      content = (
        <span>
          {version}
        </span>
      );
    } else {
      content = <span>Loading...</span>;
    }

    return (
      <footer>
        <p variant="body2">

          LiMA (Living Meta-Analysis) at
          {' '}
          <a href="http://port.ac.uk/">University of Portsmouth</a>
          , © 20162020

        </p>
        <p variant="body2">
          Feedback and questions are welcome at
          {' '}
          <a href="mailto:lima@port.ac.uk">lima@port.ac.uk</a>
          .
        </p>
        <p variant="body2">
          version
          {' '}
          <span className="value">{content}</span>
          {' '}
          (
          <a href="/version/log">full changelog</a>
          )
        </p>
      </footer>
    );
  }
}
export default Footer;
