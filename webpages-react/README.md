## needs to be reviewed

You'll find here some explanation on how the React components are build inside our build system.

We use Parcel to bundle all the React files together so that the components can be displayed correctly in the browser.

A note for maintainers is available at the end of this document.
## Running and building the LiMA frontend

**You’ll need to have Node 8.16.0 or Node 10.16.0 or later version on your local development machine** (but it’s not required on the server)

If you haven't already installed `Node` and `npm`, you should follow this
[tutorial for Node and npm installation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or installing it directly through your OS [package manager](https://nodejs.org/en/download/package-manager/#arch-linux)

Check your `Node` and `npm` versions :

```shell
$ node -v
```

```shell
$ npm -v
```

Once everything is installed, run the following command in the react project directory `/webpages/react` to install the required dependencies to run the react application :
```shell
$ npm install
```
You are now ready to start
## Available Scripts

**In the `/webpages/react` directory, you can use the following commands :**

```shell
$ npm start
```

-   Runs the application in development mode server and opens [http://localhost:8080](http://localhost:8080) in the browser to view the application
-   The page will reload if you make edits.

```shell
$ npm run build
```
-   Builds the application for production to the `./dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

-   The build is minified and the filenames include the hashes.
    Your application is ready to be deployed!

-   The files are correctly bundled to their relative paths. You need to serve the files in the `./dist` folder the same way you'll serve the index.html file when a meta-analysis is served. That means that you can test the front-end with calls to the real API using the symbolic link at `/webpages/HarmutBlank` and by accessing http://localhost:8080/HarmutBlank/MissinformationEffect (see next command)

## Running the production ready app
```shell
$ npm run server
```

-   This script simply builds and serves the frontend app using `http-server` which you can install using :

```shell
$ npm install -g http-server
```
-   The rest of the pages are also available. The meta-analysis app is served when the symlink inside the webpages directory is reached.

## Note for maintainers

### About the directory structure
-   The code is organized in a way to avoid confusions and interactions between the legacy LiMA code and the new React-rewritten code.

-   The `/webpages` directory is the one served on production. It contains all the legacy pages as well as the legacy JavaSript code.

-   All the React code is under the `/webpages/react` subdirectory, and the built files are in `/webpages/react/dist`.

-   The only current difference is the symlink for an example of meta-analysis which now points to `/webpages/react/dist` instead of `/webpages/profile/metaanalysis.html`

In conclusion : the directory structure stays the same, and you can serve the `/webpages/` the same as before introducing React.

### Inside the `/webpages-react` directory

-   You can install the `ncu` package via npm and run `ncu`  to see dependencies upgrades. Then you can follow the instructions to proceed to the upgrades.

> Don't forget to read changelogs when updating dependancies, there are often breaking changes

>**Note : the application must be accessed on http://localhost:8080 to comply with the CORS policy from the API**

### About the code

The code was built with maintainability in mind.

The UI is separated from the data manipulation (most of the data manipulation happens in `tools/datatools.js`)

The UI components try to be logically separated. You can start reading from index.html and follow the render logic to get a global overview of the app.

If you want to know how a specific component works, you can easily find and read its source and the data it has access to (some of this data is generated in the `populateCircularMa` function in `tools/datatools.js`)

Some tricky parts are documented with comments.

It's ok to learn React while maintaining this version of LiMA, most of our use of React is well documented on the React documentation.
We extensively use React hooks (`useState`, `useEffect`), you'll want to look them up.

The directory structure tries to be logical as well.
