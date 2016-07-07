(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.extractArticleTitleFromUrl = function extractArticleTitleFromUrl() {
    // the path of a page for an article will be '/email/title/*',
    // so extract the 'title' portion here:

    var start = window.location.pathname.indexOf('/', 1) + 1;
    if (start === 0) throw new Error('page url doesn\'t have a title');

    return window.location.pathname.substring(start, window.location.pathname.indexOf('/', start));
  }


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
        _.fillTags(_.findEl(li, '.tags'), article.tags);
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.byId('empty-list-template').content.cloneNode(true));
    }

    _.setYouOrName();
  }

  limeta.extractAndFillArticle = function extractAndFillArticle() {
    var email = limeta.extractUserProfileEmailFromUrl();
    var title = limeta.extractArticleTitleFromUrl();
    _.fillEls('#article .title', title);

    limeta.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/articles/' + email + '/' + title, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) _.notFound();
      else return _.fetchJson(response);
    })
    .then(fillArticle)
    .catch(function (err) {
      console.error("problem getting article");
      console.error(err);
      limeta.apiFail();
    });
  }

  function fillArticle(article) {
    _.fillTags(_.findEl('#article .tags'), article.tags);
    _.fillEls ('#article .authors', article.authors);
    _.fillEls ('#article .published', article.published);
    _.fillEls ('#article .description', article.description);
    _.fillEls ('#article .link', article.link);
    _.setProps('#article .link', 'href', article.link);
    _.fillEls ('#article .doi', article.doi);
    _.setProps('#article .doi', 'href', function(el){return el.dataset.base + article.doi});
    _.fillEls ('#article .enteredby', article.enteredBy);
    _.setProps('#article .enteredby', 'href', '/' + article.enteredBy + '/');
    _.fillEls ('#article .ctime', _.formatDateTime(article.ctime));
    _.fillEls ('#article .mtime', _.formatDateTime(article.mtime));

    _.removeClass('#article', 'loading');
  }

})(window, document);
