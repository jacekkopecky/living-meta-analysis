module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/paper-title',
  $schema: 'http://json-schema.org/draft-07/schema#',
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
    enteredByUsername: {
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
    description: {
      type: 'string',
      minLength: 1,
    },
    link: {
      type: 'string',
      minLength: 1,
    },
    doi: {
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
    modifiedBy: {
      type: 'string',
      minLength: 1,
    },
    comments: {
      type: 'array',
      items: {
        $ref: 'https://lima.soc.port.ac.uk/schemas/comments',
      },
    },
    columns: {
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
          description: {
            type: 'string',
            minLength: 1,
          },
          unit: {
            type: 'string',
            minLength: 1,
          },
          comments: {
            type: 'array',
            items: {
              $ref: 'https://lima.soc.port.ac.uk/schemas/comments',
            },
          },
        },
        required: ['id', 'title'],
      },
    },
    experiments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
          },
          description: {
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
          data: {
            type: 'object',
            patternProperties: {
              '^.*': {
                type: 'object',
                properties: {
                  value: {
                    type: 'string',
                    minLength: 1,
                  },
                  ctime: {
                    type: 'number',
                  },
                  enteredBy: {
                    type: 'string',
                    minLength: 1,
                  },
                  comments: {
                    type: 'array',
                    items: {
                      $ref: 'https://lima.soc.port.ac.uk/schemas/comments',
                    },
                  },
                },
                required: ['value', 'ctime', 'enteredBy'],
              },
            },
          },
          comments: {
            type: 'array',
            items: {
              $ref: 'https://lima.soc.port.ac.uk/schemas/comments',
            },
          },
        },
        required: ['title', 'enteredBy', 'ctime'],
      },
    },
  },
};
