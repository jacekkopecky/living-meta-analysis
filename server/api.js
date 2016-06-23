const express = require('express');

const api = module.exports = express.Router({
  caseSensitive: true,
});

api.get('/', (req, res) => res.redirect('/docs/api'));

// todo only for testing
api.get('/someinfo',
  (req, res) =>
    setTimeout(() => res.json(req.user || { error: 'no user', extra: req.userError }), 500)
  );
