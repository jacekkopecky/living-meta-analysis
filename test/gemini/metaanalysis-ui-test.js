/* globals gemini */

gemini.suite('metaanalysis', (suite) => {
  // go to the showcase metaanalysis, not logged in so not editing
  suite.setUrl('/jacek.kopecky@port.ac.uk/MisinformationEffect')
    .setCaptureElements('body')
    .before((actions) => {
      actions.setWindowSize(1680, 1024);
      actions.executeJS(function (window) {
        window.localStorage.geminiTesting = '1';
      });
    })
    .capture('showcase-not-editing')

    // clicks the button to edit in local storage
    .capture('showcase-edit-your-copy', (actions, find) => {
      actions.click(find('a.edityourcopy'));
    });

  gemini.suite('column-heading-not-editing', (suite) => {
    suite.setCaptureElements('#testing-screenshot-element')

      // highlight a column heading so we see its popup box
      .capture('highlight-col-heading', (actions, find) => {
        actions.click(find('table.experiments tr:first-child th:nth-child(4) .popupboxhighlight .coltitle'));
      });
  });

  // go to the showcase metaanalysis to edit in local storage
  gemini.suite('local', (suite) => {
    suite.setUrl('/local/MisinformationEffect')
      .setCaptureElements('#testing-screenshot-element')

      // highlight a column heading so we see its popup box
      .capture('highlight-col-heading', (actions, find) => {
        actions.click(find('table.experiments tr:first-child th:nth-child(4) .popupboxhighlight .coltitle'));
      });

    gemini.suite('column-heading-popupbox', (suite) => {
      suite
        .before((actions, find) => {
          actions.click(find('table.experiments tr:first-child th:nth-child(4) .popupboxhighlight .coltitle'));
        })

        // focus the column name for editing
        .capture('focused-col-name', (actions, find) => {
          actions.click(find('.popupbox.pinned .coltitle.editing'));
        })

        // change the name
        .capture('changing-col-name', (actions) => {
          actions.sendKeys('a');
        })

        // confirm the change
        .capture('changed-col-name', (actions) => {
          actions.sendKeys(gemini.ENTER);
        })

        // save the changes
        .capture('saved-changes', (actions, find) => {
          actions.click(find('span.savepending'));
        });
    });

    gemini.suite('column-moving', (suite) => {
      suite
        .before((actions, find) => {
          actions.click(find('table.experiments tr:first-child th:nth-child(4) .popupboxhighlight .coltitle'));
        })

        // move the column to the left
        .capture('move-left', (actions, find) => {
          actions.click(find('.popupbox.pinned button.move.left:not(.most)'));
        })

        // ... rightmost
        .capture('move-right-most', (actions, find) => {
          actions.click(find('.popupbox.pinned button.move.right.most'));
        })
        // ... leftmost
        .capture('move-left-most', (actions, find) => {
          actions.click(find('.popupbox.pinned button.move.left.most'));
        })

        // ... right twice
        .capture('move-right', (actions, find) => {
          actions.click(find('.popupbox.pinned button.move.right:not(.most)'));
          actions.click(find('.popupbox.pinned button.move.right:not(.most)'));
        })

        // save the changes
        .capture('saved-changes', (actions) => {
          // for now because of a bug where the savepending message goes away, we need to wait for the save
          actions.wait(11000);
          // actions.click(find('span.savepending'));
        });
    });
  });
});
