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
    for (let i = 0; i < numCodes; i++) {
      const code = uid(12);
      const dataGenerated = new Date().toUTCString();
      saveCode(code, dataGenerated, comment);
      betaCodes += `${code} | ${dataGenerated} | ${comment}\n`;
    }
    fs.appendFile('codes.txt', betaCodes, err => {
      if (err) return console.log(err);
      console.log('Successfully generated beta codes');
    });
  });
});

async function saveCode(codeValue, dataGenerated, comment) {
  const kind = 'BetaCode';

  const name = codeValue;

  const codeKey = datastore.key([kind, name]);
  const code = {
    key: codeKey,
    data: {
      timeGenerated: dataGenerated,
      comment: comment,
    },
  };

  await datastore.save(code);
}
