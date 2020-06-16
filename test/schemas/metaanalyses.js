module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/metaanalyses',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'array',
  items: {
    $ref: 'https://lima.soc.port.ac.uk/schemas/metaanalysis-base',
  },
};
