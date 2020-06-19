const fetch = require('node-fetch');

/* -------------------------------------------------------------------------- */
/*                               Fetch Functions                              */
/* -------------------------------------------------------------------------- */

async function getProfile(url, username) {
  const req = await fetch(`${url}/profile/${username}`);
  const res = await req.json();
  return res;
}

async function getPapers(url, username) {
  const req = await fetch(`${url}/papers/${username}`);
  const res = await req.json();
  return res;
}

async function getPaperByTitle(url, username, title) {
  const req = await fetch(`${url}/papers/${username}/${title}`);
  const res = await req.json();
  return res;
}

async function getMetaanalyses(url, username) {
  const req = await fetch(`${url}/metaanalyses/${username}`);
  const res = await req.json();
  return res;
}

async function getMetaanlysisByTitle(url, username, title) {
  const req = await fetch(`${url}/metaanalyses/${username}/${title}`);
  const res = await req.json();
  return res;
}

module.exports = {
  getProfile,
  getPapers,
  getPaperByTitle,
  getMetaanalyses,
  getMetaanlysisByTitle,
};
