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
    storage = require('../../server/storage-old');

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
      it('migrates correctly', function () {
        const before = copyOf(paperBefore);
        storage.migratePaper(before, columns);
        const after = copyOf(paperAfter);
        after.migrated = true;
        expect(copyOf(before)).toEqual(after);
      });
      it('does not change paper without global columns', function () {
        const after = copyOf(paperAfter);
        storage.migratePaper(after, columns);
        expect(after).toEqual(paperAfter);
      });
    });

    describe('migration of metaanalysis', () => {
      let papers;
      beforeAll(() => {
        storage.migratePaper(paper2Before, columns);
        papers = [paper2Before, paperAfter];
      })
      it('migrates correctly', function () {
        const before = copyOf(metaanalysisBefore);
        storage.migrateMetaanalysis(before, papers, columns);
        const after = copyOf(metaanalysisAfter);
        after.migrated = true;
        expect(copyOf(before)).toEqual(after);
      });
      it('does not change MA without global columns', function () {
        const after = copyOf(metaanalysisAfter);
        storage.migrateMetaanalysis(after, papers, columns);
        expect(after).toEqual(metaanalysisAfter);
      });
    });
  });

  // todo more
});

function copyOf(obj) {
  return JSON.parse(JSON.stringify(obj));
}
