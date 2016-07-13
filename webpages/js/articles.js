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

  var currentArticleUrl, currentArticle;

  limeta.extractAndFillArticle = function extractAndFillArticle() {
    var email = limeta.extractUserProfileEmailFromUrl();
    var title = limeta.extractArticleTitleFromUrl();
    _.fillEls('#article .title', title);

    limeta.getGapiIDToken()
    .then(function (idToken) {
      currentArticleUrl = '/api/articles/' + email + '/' + title;
      return fetch(currentArticleUrl, _.idTokenToFetchOptions(idToken));
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
    if (limeta.extractUserProfileEmailFromUrl() === article.enteredBy) {
      _.addClass('#article .enteredby', 'only-not-yours');
    }

    currentArticle = article;
    _.fillTags(_.findEl('#article .tags'), article.tags);
    _.fillEls ('#article .authors .value', article.authors);
    _.fillEls ('#article .published .value', article.published);
    _.fillEls ('#article .description .value', article.description);
    _.fillEls ('#article .link .value', article.link);
    _.setProps('#article .link .value', 'href', article.link);
    _.fillEls ('#article .doi .value', article.doi);
    _.setProps('#article .doi .value', 'href', function(el){return el.dataset.base + article.doi});
    _.fillEls ('#article .enteredby .value', article.enteredBy);
    _.setProps('#article .enteredby .value', 'href', '/' + article.enteredBy + '/');
    _.fillEls ('#article .ctime .value', _.formatDateTime(article.ctime));
    _.fillEls ('#article .mtime .value', _.formatDateTime(article.mtime));

    _.removeClass('#article', 'loading');

    _.setYouOrName();

    if (!addedArticleListeners) {
      addedArticleListeners = true;
      _.findEl('#article .savingerror').addEventListener('click', saveArticle);
      _.findEl('#article .description .value').addEventListener('input', setPendingArticleSave);
    }

    // todo
    // in fillArticle, only replace values if they have changed
    // in fillArticle, do nothing if save is pending?
  }

  var addedArticleListeners = false;

  var pendingSaveTimeout = null;
  var pendingSaveForceTime = null;

  function setPendingArticleSave() {
    // don't save automatically after an error
    if (_.findEl('#article.savingerror')) return;

    // setTimeout for save in 1s
    // if already set, cancel the old one and set a new one
    // but only replace the old one if the pending save started less than 10s ago
    _.addClass('#article', 'savepending');
    if (pendingSaveTimeout && pendingSaveForceTime > Date.now()) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    if (!pendingSaveTimeout) pendingSaveTimeout = setTimeout(saveArticle, 1000);
    if (!pendingSaveForceTime) pendingSaveForceTime = Date.now() + 10 * 1000; // ten seconds
  }

  function saveArticle() {
    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;
    pendingSaveForceTime = null;

    updateArticleFromDom();
    limeta.getGapiIDToken()
    .then(function(idToken) {
      if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
      pendingSaveForceTime = null;

      _.removeClass('#article', 'savingerror');
      _.removeClass('#article', 'savepending');
      _.addClass('#article', 'saving');

      return fetch(currentArticleUrl, {
        method: 'POST',
        headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
        body: JSON.stringify(currentArticle),
      });
    })
    .then(_.fetchJson)
    .then(function(json) {
      _.removeClass('#article', 'saving');
      if (!pendingSaveTimeout) fillArticle(json);
    })
    .catch(function(err) {
      console.error('error saving article');
      console.error(err);
      _.addClass('#article', 'savingerror');
      _.removeClass('#article', 'saving');
      if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
      pendingSaveForceTime = null;
    })

  }

  function updateArticleFromDom() {
    // todo require title
    // todo suggest default title: first word in authors and last two digits or the first four-digit sequence in published with 'a' or so appended to make unique
    // todo on title change, check that it didn't exist

    // ignoring rich formatting in description
    currentArticle.description = _.findEl('#article .description .value').textContent;
    // todo
  }

})(window, document);
