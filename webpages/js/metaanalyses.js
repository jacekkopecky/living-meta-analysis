(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.requestAndFillMetaanalysisList = function requestAndFillMetaanalysisList() {
    limeta.getGapiIDToken()
    .then(function (idToken) {
      var email = limeta.extractUserProfileEmailFromUrl();
      return fetch('/api/metaanalyses/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) return [];
      else return _.fetchJson(response);
    })
    .then(fillMetaanalysissList)
    .catch(function (err) {
      console.error("problem getting metaanalyses");
      console.error(err);
      limeta.apiFail();
    });
  }

  function fillMetaanalysissList(metaanalyses) {
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
        _.setProps(li, '.description', 'title', metaanalysis.description);
        _.setProps(li, 'a.mainlink', 'href', metaanalysis.title);
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
