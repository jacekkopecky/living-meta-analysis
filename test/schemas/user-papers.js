module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/user-papers',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
      },
      title: {
        type: 'string',
        minLength: 1,
      },
      enteredBy: {
        type: 'string',
        minLength: 1,
      },
      ctime: {
        type: 'number',
      },
      mtime: {
        type: 'number',
      },
      reference: {
        type: 'string',
        minLength: 1,
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1,
        },
        uniqueItems: true,
      },
      apiurl: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['id', 'title', 'enteredBy', 'ctime', 'mtime', 'tags', 'apiurl'],
  },
};
