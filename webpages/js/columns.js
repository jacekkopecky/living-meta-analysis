(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  var columnsPromise;

  function Columns() {}
  Columns.prototype.save = saveColumns;

  lima.getColumns = function() {
    if (columnsPromise) return columnsPromise;

    columnsPromise = lima.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(storeColumns)
    .catch(function (err) {
      console.error("problem getting columns");
      console.error(err);
      _.apiFail();
    });

    return columnsPromise;
  }

  function storeColumns(columns) {
    if (!(columns instanceof Columns)) columns = Object.assign(new Columns(), columns);
    lima.columns = columns;
    lima.columnTypes = [];
    Object.keys(columns).forEach(function (colId) {
      if (lima.columnTypes.indexOf(columns[colId].type) === -1) {
        lima.columnTypes.push(columns[colId].type);
      }
    })
    return columns;
  }

  function saveColumns() {
    console.info('saving columns');
    return lima.getGapiIDToken()
      .then(function(idToken) {
        return fetch('/api/columns', {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: JSON.stringify(lima.columns),
        });
      })
      .then(_.fetchJson)
      .then(function(json) {
        storeColumns(json);
        if (lima.updateView) lima.updateView();
      })
      .catch(function(err) {
        console.error('error saving columns');
        if (err instanceof Response) err.text().then(function (t) {console.error(t)});
        else console.error(err);
        throw err;
      })
  }

})(window, document);
