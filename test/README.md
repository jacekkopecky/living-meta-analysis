# LiMA testing

We use [Gemini](https://github.com/gemini-testing/gemini) for testing. Follow the Gemini installation instructions first.

The tests expect LiMA to be running at localhost:8080.

TODO: tests should start their own server

## Setup

First, in a known working state, switch to the `test/` directory and run `gemini update` to generate a base set of screenshots on your machine.

TODO: Host a master set for each release?

## Running tests

It's nice to see the screenshots of the failed tests, so we use [Gemini GUI](https://github.com/gemini-testing/gemini-gui). Install this and then in the `test` directory run `gemini-gui` and then run the tests in the browser.

### Command-line interface

If you prefer command-line use, the commands are:

- `gemini test --reporter flat` – run the tests
- `gemini update` – accept the current screenshots as correct

## Adding tests

Put your tests in `test/gemini/`, follow the existing `.js` files already there.

Run the tests, check that the screenshots are OK and no other tests broke, then you can accept the new screenshots.

**Note that Gemini-GUI needs restarting when you change tests.**
