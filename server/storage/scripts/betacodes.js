const uid = require('uid');
const readline = require('readline');
const fs = require('fs');
const { datastore } = require('../shared');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the number of codes you want: ', (numCodes) => {
  rl.question('Enter a comment for the codes: ', (comment) => {
    let betaCodes = '';
    const codes = [];
    for (let i = 0; i < numCodes; i++) {
      const code = uid(12);
      const dateGenerated = new Date().toUTCString();
      codes.push({
        code: code,
        timeGenerated: dateGenerated,
        comment: comment,
      });
      betaCodes += `${code} | ${dateGenerated} | ${comment}\n`;
    }
    saveCodes(codes);
    fs.appendFile('codes.txt', betaCodes, err => {
      if (err) return console.log(err);
      console.log('Successfully generated beta codes');
    });
  });
});

async function saveCodes(codes) {
  const kind = 'BetaCode';
  const entities = [];
  codes.forEach(element => {
    const codeKey = datastore.key([kind, element.code]);
    entities.push({
      key: codeKey,
      data: element,
    });
  });
  await datastore.upsert(entities);
}
