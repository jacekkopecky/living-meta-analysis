(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.requestAndFillMetaanalysisList = function requestAndFillMetaanalysisList() {
    limeta.getGapiIDToken(function (err, idToken) {
      if (err) {
        console.err("problem getting ID token from GAPI");
        console.err(err);
        limeta.apiFail();
        return;
      }

      var email = limeta.extractUserProfileEmailFromUrl();

      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/metaanalyses/' + email);
      if (idToken) xhr.setRequestHeader("Authorization", "Bearer " + idToken);

      xhr.onload = fillMetaanalysissList;
      xhr.send();

    });
  }

  function fillMetaanalysissList() {
    var xhr = this;
    var metaanalyses;
    if (xhr.status === 404) {
      metaanalyses = [];
    } else if (xhr.status > 299) {
      limeta.apiFail();
      return;
    }
    metaanalyses = metaanalyses || JSON.parse(xhr.responseText);
    var list = _.findEl('.metaanalysis.list > ul');
    list.innerHTML = '';

    if (metaanalyses.length) {
      // todo sort
      metaanalyses.forEach(function (metaanalysis) {
        var liTemplate = _.byId('metaanalysis-list-item-template');
        var li = liTemplate.content.cloneNode(true);
        _.fillEls(li, '.name', metaanalysis.title);
        _.fillEls(li, '.date', metaanalysis.published);
        _.fillEls(li, '.description', metaanalysis.description);
        if (metaanalysis.tags && metaanalysis.tags.length) {
          var tags = _.findEl(li, '.tags');
          var tagTemplate = _.byId('tag-template');
          metaanalysis.tags.forEach(function (tag) {
            var tagEl = tagTemplate.content.cloneNode(true);
            _.fillEls(tagEl, '.tag', tag);
            tags.appendChild(tagEl);
          });
        }
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.byId('empty-list-template').content.cloneNode(true));
    }

    _.setYouOrName();
  }

})(window, document);
