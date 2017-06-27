'use strict';
describe('server/storage.js', () => {
  let storage;

  let columns;
  let paperAfter;
  let paperBefore;

  beforeAll(() => {
    storage = require('./../../server/storage');

    columns = require('./data/storage-spec/columns');
    paperAfter = require('./data/storage-spec/paper-after');
    paperBefore = require('./data/storage-spec/paper-before');
  });

  it('imports correctly', () => {
    expect(storage).not.toBeNull();
    expect(columns).not.toBeNull();
    expect(paperAfter).not.toBeNull();
    expect(paperBefore).not.toBeNull();

    expect(paperAfter).not.toEqual(paperBefore);
  });

  describe('migration to private columns', () => {
    describe('migration of paper', () => {
      it('migrates correctly', function() {
        const copyOfBefore = JSON.parse(JSON.stringify(paperBefore));
        storage.tests.migratePaper(copyOfBefore, columns);
        const result = JSON.parse(JSON.stringify(copyOfBefore));
        expect(result).toEqual(paperAfter);
      });
      it('does not change paper without global columns', function() {
        const copyOfAfter = JSON.parse(JSON.stringify(paperAfter));
        storage.tests.migratePaper(copyOfAfter, columns);
        const result = JSON.parse(JSON.stringify(copyOfAfter));
        expect(result).toEqual(paperAfter);
      });
    });
  });

  // todo more
});
