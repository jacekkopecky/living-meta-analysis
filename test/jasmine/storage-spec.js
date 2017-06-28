'use strict';
describe('server/storage.js', () => {
  let storage;

  let columns;
  let paperAfter;
  let paperBefore;
  let paper2Before;
  let metaanalysisAfter;
  let metaanalysisBefore;

  beforeAll(() => {
    storage = require('./../../server/storage');

    columns = require('./data/storage-spec/columns');
    paperAfter = require('./data/storage-spec/paper-after');
    paperBefore = require('./data/storage-spec/paper-before');
    paper2Before = require('./data/storage-spec/paper2-before');
    metaanalysisAfter = require('./data/storage-spec/metaanalysis-after');
    metaanalysisBefore = require('./data/storage-spec/metaanalysis-before');
  });

  it('imports correctly', () => {
    expect(storage).not.toBeNull();
    expect(columns).not.toBeNull();
    expect(paperAfter).not.toBeNull();
    expect(paperBefore).not.toBeNull();
    expect(metaanalysisAfter).not.toBeNull();
    expect(metaanalysisBefore).not.toBeNull();

    expect(paperAfter).not.toEqual(paperBefore);
    expect(metaanalysisAfter).not.toEqual(metaanalysisBefore);
  });

  describe('migration to private columns', () => {
    describe('migration of paper', () => {
      it('migrates correctly', function() {
        const copyOfBefore = JSON.parse(JSON.stringify(paperBefore));
        storage.migratePaper(copyOfBefore, columns);
        const result = JSON.parse(JSON.stringify(copyOfBefore));
        expect(result).toEqual(paperAfter);
      });
      it('does not change paper without global columns', function() {
        const copyOfAfter = JSON.parse(JSON.stringify(paperAfter));
        storage.migratePaper(copyOfAfter, columns);
        const result = JSON.parse(JSON.stringify(copyOfAfter));
        expect(result).toEqual(paperAfter);
      });
    });

    describe('migration of metaanalysis', () => {
      let papers;
      beforeAll(() => {
        storage.migratePaper(paper2Before, columns);
        papers = [paper2Before, paperAfter];
      })
      it('migrates correctly', function() {
        const copyOfBefore = JSON.parse(JSON.stringify(metaanalysisBefore));
        storage.migrateMetaanalysis(copyOfBefore, papers, columns);
        const result = JSON.parse(JSON.stringify(copyOfBefore));
        expect(result).toEqual(metaanalysisAfter);
      });
      it('does not change MA without global columns', function() {
        const copyOfAfter = JSON.parse(JSON.stringify(metaanalysisAfter));
        storage.migrateMetaanalysis(copyOfAfter, papers, columns);
        const result = JSON.parse(JSON.stringify(copyOfAfter));
        expect(result).toEqual(metaanalysisAfter);
      });
    });
  });

  // todo more
});
