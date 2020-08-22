import { useEffect } from 'react';
import { withRouter } from 'react-router-dom';

function OnTabChange({ history, displayedCell, setDisplayedCell }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      // this code will fire each time a Tab is clicked
      // we don't want to reload the Metaanalysis everytime but still want to close current Details
      if (displayedCell !== null) {
        setDisplayedCell(null);
      }
      // scrolls to top on tab change
      window.scrollTo(0, 0);
    });
    return () => {
      unlisten();
    };
  }, []);

  return (null);
}

export default withRouter(OnTabChange);
