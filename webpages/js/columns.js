(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  var columnsPromise;
  var columnsNextUpdate = 0;

  // predefined possible column types
  lima.columnTypes = ['characteristic', 'result'];

  lima.getColumns = function() {
    var curtime = Date.now();
    if (!columnsPromise || columnsNextUpdate < curtime) {
      columnsNextUpdate = curtime + 5 * 60 * 1000; // update paper titles no less than 5 minutes from now

      columnsPromise = lima.getGapiIDToken()
      .then(function (idToken) {
        return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
      })
      .then(_.fetchJson)
      .then(storeColumns)
      .catch(function (err) {
        console.error("problem getting columns");
        console.error(err);
        throw _.apiFail();
      });
    }

    return columnsPromise;
  }

  lima.newColumn = function() {
    return storeColumn({id: 'new_' + Date.now(), type: lima.columnTypes[0], new: true});
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
    return column;
  }

  function Column() {}
  Column.prototype.save = function saveColumn() {
    var col = this;
    var oldId = col.id;
    console.info('saving column');
    return lima.getGapiIDToken()
      .then(function(idToken) {
        var toSend = JSON.stringify(col);
        if (col.new) {
          delete col.id;
          toSend = JSON.stringify(col);
          col.id = oldId;
        }
        return fetch('/api/columns', {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: toSend,
        });
      })
      .then(_.fetchJson)
      .then(function(json) {
        lima.columns[oldId] = storeColumn(json);
        col.id = json.id; // this allows us to get a new ID for a new column from the server
        if (lima.updateAfterColumnSave) lima.updateAfterColumnSave();
      })
      .catch(function(err) {
        console.error('error saving column');
        if (err instanceof Response) err.text().then(function (t) {console.error(t)});
        else console.error(err);
        throw err;
      })
  }

})(window, document);
