import { useEffect } from 'react';
import { withRouter } from 'react-router-dom';

function ScrollToTop({ history, toggleDisplay }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      toggleDisplay();
      window.scrollTo(0, 0);
    });
    return () => {
      unlisten();
    };
  }, []);

  return (null);
}

export default withRouter(ScrollToTop);
