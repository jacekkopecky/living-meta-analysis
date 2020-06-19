const fs = require('fs');
const config = require('../config');
const helpers = require('../helpers');

const SNAPSHOT_LOCATION = __dirname;


function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

async function run() {
  const profile = await helpers.getProfile(config.SNAPSHOT_URL, config.TEST_USER);
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/profile.json`, formatJSON(profile));

  const userPapers = await helpers.getPapers(config.SNAPSHOT_URL, config.TEST_USER);
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/user_papers.json`, formatJSON(userPapers));

  const paperTitle = await helpers.getPaperByTitle(config.SNAPSHOT_URL, config.TEST_USER, config.TEST_PAPER);
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/paper-title.json`, formatJSON(paperTitle));

  const metaanalyses = await helpers.getMetaanalyses(config.SNAPSHOT_URL, config.TEST_USER);
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/metaanalyses.json`, formatJSON(metaanalyses));

  const metaanalysesTitle = await helpers.getMetaanlysisByTitle(config.SNAPSHOT_URL, config.TEST_USER, config.TEST_METAANALYSES);
  fs.writeFileSync(`${SNAPSHOT_LOCATION}/metaanalyses-title.json`, formatJSON(metaanalysesTitle));
}

run();
