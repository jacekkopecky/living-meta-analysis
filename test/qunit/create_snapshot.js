const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const SNAPSHOT_LOCATION = path.join(__dirname, 'snapshots');
const API_ENDPOINT = 'http://jacekkopecky.myvm.port.ac.uk/api';
const USER = 'hartmut.blank@port.ac.uk';
const METAANALYSES_NAME = 'MisinformationEffect';
const PAPER_NAME = 'LiveVideo';

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

async function getProfile() {
  const req = await fetch(`${API_ENDPOINT}/profile/${USER}`);
  const res = await req.json();
  return res;
}

async function getPapers() {
  const req = await fetch(`${API_ENDPOINT}/papers/${USER}`);
  const res = await req.json();
  return res;
}

async function getPaperByTitle() {
  const req = await fetch(`${API_ENDPOINT}/papers/${USER}/${PAPER_NAME}`);
  const res = await req.json();
  return res;
}

async function getMetaanalyses() {
  const req = await fetch(`${API_ENDPOINT}/metaanalyses/${USER}`);
  const res = await req.json();
  return res;
}

async function getMetaanlysisByTitle() {
  const req = await fetch(`${API_ENDPOINT}/metaanalyses/${USER}/${METAANALYSES_NAME}`);
  const res = await req.json();
  return res;
}

async function run() {
  const profile = await getProfile();
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/profile.json`, formatJSON(profile));

  const user_papers = await getPapers();
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/user_papers.json`, formatJSON(user_papers));

  const paperTitle = await getPaperByTitle();
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/paper-title.json`, formatJSON(paperTitle));

  const metaanalyses = await getMetaanalyses();
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/metaanalyses.json`, formatJSON(metaanalyses));

  const metaanalysesTitle = await getMetaanlysisByTitle();
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/metaanalyses-title.json`, formatJSON(metaanalysesTitle));
}

run();