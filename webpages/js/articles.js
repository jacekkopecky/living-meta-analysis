(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.requestAndFillArticleList = function requestAndFillArticleList() {
    limeta.getGapiIDToken()
    .then(function (idToken) {
      var email = limeta.extractUserProfileEmailFromUrl();
      return fetch('/api/articles/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) return [];
      else return _.fetchJson(response);
    })
    .then(fillArticlesList)
    .catch(function (err) {
      console.error("problem getting articles");
      console.error(err);
      limeta.apiFail();
    });
  }

  function fillArticlesList(articles) {
    var list = _.findEl('.article.list > ul');
    list.innerHTML = '';

    if (articles.length) {
      // todo sort
      articles.forEach(function (article) {
        var liTemplate = _.byId('article-list-item-template');
        var li = liTemplate.content.cloneNode(true);
        _.fillEls(li, '.name', article.title);
        _.fillEls(li, '.date', article.published);
        _.fillEls(li, '.description', article.description);
        _.setProps(li, '.description', 'title', article.description);
        _.setProps(li, 'a.mainlink', 'href', article.title);
        if (article.tags && article.tags.length) {
          var tags = _.findEl(li, '.tags');
          var tagTemplate = _.byId('tag-template');
          article.tags.forEach(function (tag) {
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
