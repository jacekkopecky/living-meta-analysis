module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/metaanalysis-title',
  $schema: 'http://json-schema.org/draft-07/schema#',
  $merge: {
    source: { $ref: 'https://lima.soc.port.ac.uk/schemas/metaanalysis-base' },
    with: {
      properties: {
        papers: {
          type: 'array',
          items: {
            $ref: 'https://lima.soc.port.ac.uk/schemas/paper-title',
          },
        },
      },
      required: ['papers'],
    },
  },
};
