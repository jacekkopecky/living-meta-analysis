module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/profile',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      minLength: 1,
    },
    email: {
      type: 'string',
      minLength: 1,
    },
    photos: {
      type: 'array',
      minLength: 1,
    },
    joined: {
      type: 'number',
    },
    username: {
      type: 'string',
    },
  },
};
