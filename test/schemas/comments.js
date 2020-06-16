module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/comments',
  $schema: 'http://json-schema.org/draft-07/schema#',
  by: {
    type: 'string',
    minLength: 1,
  },
  onVersionBy: {
    type: 'string',
    minLength: 1,
  },
  text: {
    type: 'string',
    minLength: 1,
  },
  ctime: {
    type: 'number',
  },
  hidden: {
    type: 'boolean',
  },
};
