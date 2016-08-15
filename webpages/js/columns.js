(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  var columnsPromise;

  // predefined possible column types
  lima.columnTypes = ['characteristic', 'result'];

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
    lima.columns = {};
    Object.keys(columns).forEach(function (id) {
      storeColumn(columns[id]);
    });
    return lima.columns;
  }

  function storeColumn(column) {
    if (!(column instanceof Column)) column = Object.assign(new Column(), column);
    lima.columns[column.id] = column;
  }

  function Column() {}
  Column.prototype.save = function saveColumn() {
    var col = this;
    console.info('saving column');
    return lima.getGapiIDToken()
      .then(function(idToken) {
        return fetch('/api/columns', {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: JSON.stringify(col),
        });
      })
      .then(_.fetchJson)
      .then(function(json) {
        storeColumn(json);
        col.id = json.id; // this allows us to get a new ID for a new column from the server
        if (lima.updateView) lima.updateView();
      })
      .catch(function(err) {
        console.error('error saving column');
        if (err instanceof Response) err.text().then(function (t) {console.error(t)});
        else console.error(err);
        throw err;
      })
  }

})(window, document);
