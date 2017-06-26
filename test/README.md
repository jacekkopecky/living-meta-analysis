# LiMA testing

We use [Jasmine](https://jasmine.github.io/) and [Gemini](https://github.com/gemini-testing/gemini) for testing.

## Unit Testing (Jasmine)

### Running tests

Just run `npm run jasmine`.

### Adding tests

Put your tests in `test/jasmine`, name them `*-spec.js` and follow the directory structure of `server/` as appropriate. Files in `test/jasmine/helpers` run before all jasmine tests.

### Coverage

We use [Istanbul](https://github.com/gotwarlost/istanbul) for checking test coverage. Simply run it using `npm run coverage`. It produces a report in `coverage/`; open `coverage/lcov-report/index.html` in your browser to see it.

**Note that Istanbul only reports coverage on files that have been loaded by the jasmine tests.**

--------------------------------------

## Visual Testing (Gemini)

The tests expect LiMA to be running at localhost:8081. They also expect selenium-standalone. You can start both with

```
PORT=8081 TESTING=1 node server &
selenium-standalone start &
```

TODO: tests could start their own server

### Setup

First, in a known working state, switch to the `test/` directory and run `gemini update` to generate a base set of screenshots on your machine.

TODO: Host a master set for each release?

### Running tests

It's nice to see the screenshots of the failed tests, so we use [Gemini GUI](https://github.com/gemini-testing/gemini-gui). Just run `npm run gemini-gui` and then run the tests in the browser.

#### Command-line interface

If you prefer command-line use, the commands are:

- `npm run gemini` – run the tests (if any fail, we find it best to use the GUI above to review the screenshots)
- `npm run gemini-update` – accept the current screenshots as correct

### Adding tests

Put your tests in `test/gemini/`, follow the existing `.js` files already there.

Run the tests, check that the screenshots are OK and no other tests broke, then you can accept the new screenshots.

**Note that Gemini-GUI needs restarting when you change tests.**
