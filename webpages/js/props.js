(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.properties = {
    '/id/p/12': {
      title: 'No. of Participants',
      description: 'number of participants in the experiment',
      definedBy: 'jacek.kopecky@port.ac.uk',
      ctime: Date.now(),
    },
    '/id/p/13': {
      title: 'Type of Participants',
      description: 'STU means student, ELD means elderly',
      definedBy: 'jacek.kopecky@port.ac.uk',
      ctime: Date.now(),
    },
    '/id/p/14': {
      title: 'Delay of Misinformation',
      description: 'Short is under 24 hours, Long over that',
      definedBy: 'jacek.kopecky@port.ac.uk',
      ctime: Date.now(),
    },

  }

})(window, document);
