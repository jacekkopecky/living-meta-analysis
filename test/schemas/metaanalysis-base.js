module.exports = {
  $id: 'https://lima.soc.port.ac.uk/schemas/metaanalysis-base',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    enteredBy: {
      type: 'string',
    },
    ctime: {
      type: 'number',
    },
    mtime: {
      type: 'number',
    },
    published: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    tags: {
      type: 'array',
    },
    columns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          type: {
            type: 'string',
            minLength: 1,
          },
          title: {
            type: 'string',
            minLength: 1,
          },
          description: {
            type: 'string',
          },
          formula: {
            type: 'string',
          },
          sourceColumnMap: {
            type: 'object',
            properties: {
              '^.*': {
                type: 'string',
              },
            },
          },
        },
      },
    },
    paperOrder: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      uniqueItems: true,
    },
    hiddenCols: {
      type: 'array',
    },
    hiddenExperiments: {
      type: 'array',
    },
    excludedExperiments: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    aggregates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formula: {
            type: 'string',
            minLength: 1,
          },
          title: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
    groupingColumn: {
      type: 'string',
    },
    groupingAggregates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formula: {
            type: 'string',
            minLength: 1,
          },
          title: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
    graphs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formula: {
            type: 'string',
            minLength: 1,
          },
          title: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
    apiurl: {
      type: 'string',
      minLength: 1,
    },
  },
  require: [
    'id', 'title', 'enteredBy', 'ctime', 'mtime', 'published',
    'description', 'tags', 'columns', 'paperOrder', 'hiddenCols',
    'hiddenExperiments', 'excludedExperiments', 'aggregates',
    'groupingColumn', 'groupingAggregates', 'graphs', 'apiurl',
  ],
};
