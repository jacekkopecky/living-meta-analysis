(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  // var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.columns = {
    '/id/col/12': {
      title: 'No. of Participants',
      description: 'number of participants in the experiment',
      definedBy: 'jacek.kopecky@port.ac.uk',
      type: 'characteristic', // todo: show characteristics first, then results
      ctime: Date.now(),
    },
    '/id/col/13': {
      title: 'Type of Participants',
      description: 'STU means student, CHI means children',
      definedBy: 'jacek.kopecky@port.ac.uk',
      type: 'characteristic',
      ctime: Date.now(),
    },
    '/id/col/14': {
      title: 'Delay of Misinformation',
      description: 'Short is under 24 hours, Long over that',
      definedBy: 'test@port.ac.uk',
      type: 'characteristic',
      ctime: Date.now(),
    },
    '/id/col/15': {
      title: 'Mem/mis/post-warning',
      description: 'Memory for original event details (%correct) for misled participants in post-warning condition',
      definedBy: 'test@port.ac.uk',
      type: 'result',
      ctime: Date.now(),
    },

  }

})(window, document);
