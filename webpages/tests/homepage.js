// these are tests that support the home page
(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  function test200(assert, url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // false for synchronous requests
    xhr.send();

    assert(xhr.status === 200, "cannot load " + url);
  }

  // test that the two meta-analyses linked from the home page are still there
  // this could break if they are renamed to better titles and then we'd need to update the homepage

  _.addTest(function testHomepageLinks(assert) {
    if (window.limaTestingMode) return; // in testing mode we use a tweaked subset of data, no need to check it here

    test200(assert, "/api/metaanalyses/HartmutBlank/MisinformationEffect/");
    test200(assert, "/api/metaanalyses/HartmutBlank/MyMeta-analysis/");
  });

})(window, document);
