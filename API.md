# LiMA API documentation

There are the following resources, all at `/api/`:

*  `/user`
  - GET checks user is known to LiMA (and updates metadata from ID token)
  - POST saves user data (comes from client-side Google Auth API)
    - displayName: string
    - emails: array with one string element
    - photos: array with one object element with `.value` string property

* `/profile/:user`
  - GET returns public user profile

* `/titles`
  - checking for allowed and available titles (work in progress)

* `/papers/:user/`
  - GET lists papers entered by this user

* `/papers/:user/:title/`
  - GET retrieves the latest version of the paper
  - POST saves a new version of the paper

* `/topmetaanalyses` – lists top showcase metaanalyses to show on main page
  - work in progress, for now lists all metaanalyses

* `/metaanalyses/:user/`
  - GET lists metaanalyses entered by this user

* `/metaanalyses/:user/:title/`
  - GET retrieves the latest version of the metaanalysis
  - POST saves a new version of the metaanalysis


## Data structures

### Users

a user record looks like this:

```
{
  "ctime": 1467367646989, // retrieved as `joined`
  "mtime": 1467367646989, // the user last 'registered' i.e. agreed to t&c's (may have changed username)
  "email": "example@example.com",
  "displayName": "Example Exampleson",
  "username": "ExampleUsername1234",
  "photos": [
    {
      "value": "https://lh5.googleusercontent.com/EXAMPLE/photo.jpg"
    }
  ]
}
```


### Papers

a paper record looks like this:

```
{
  id: "/id/p/4903",
  title: "Smith96a",
  enteredBy: "example@example.com",
  ctime: 0,
  mtime: 5,
  reference: "J. Smith, J. Doe, 1996-08, Intl J of Psy 40(4):7",
  description: "brief description lorem ipsum",
  link: "http:...",
  doi: "3409/465",
  tags: [
    "memory",
    "misinformation",
  ],
  comments: [
    {
      by: "example@example.com",
      text: "the paper presents 5 experiments, only extracting 2 here",
      ctime: 1,
      hidden: false,
      // with ctime we can view the version on which the comment was done
    },
  ]
  columns: [ objects as described below ],
  experiments: [
    {
      title: "ex1", // needs to be unique within the paper only
      description: "initial memory experiment",
      enteredBy: 'example@example.com',
      ctime: 2,
      data: {
        "/id/col/12": {  // identifies the column (see below) for which we have a value here
          value: "30",
          ctime: 2,
          enteredBy: 'example@example.com',
          comments: ... as above,
        }
      }
      comments: ... as above,
    }
  ],
}
```

a column record looks like this:

```
{
  id: string,
  title: 'N',
  description: 'number of participants',
  type: 'characteristic' or 'result'
  comments: ... as above,
  formula: '...' for columns of type 'result' (in MA only)
  sourceColumnMap: { // maps this MA column to paper columns
    "paperId": "columnId",
    ...
  }
}
```

### Metaanalyses

a meta-analysis record looks like this:

```
{
  id: "/id/m/4904",
  title: "misinformation08",
  enteredBy: "example@example.com",
  ctime: 0,
  mtime: 5,
  published: "Aug 2010, J. Smith, J. Doe, ...",
  description: "brief description lorem ipsum",
  tags: [
    "memory",
    "misinformation",
  ],
  columns: [ objects like described above ],
  paperOrder: [ string paper IDs ],
  hiddenExperiments: [ experiment IDs (paper ID + ',' + experiment index) ],
  excludedExperiments: [ experiment IDs like above ],
  aggregates: [
    { // like columns
      title:
      formula:
      comments:
    },
  ],
  groupingColumn: string column ID,
  groupingAggregates: [ like aggregates, just run in context of grouping ],
  graphs: [ like aggregates, just use graph formulas ],
}
```
