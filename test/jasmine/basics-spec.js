'use strict';
describe("basics", () => {
  it("sets TESTING", () => {
    expect(process.env.TESTING).toBeTruthy();
    expect(+process.env.PORT).toBe(8082);
  })

  describe("server", () => {
    let originalTimeout;
    let oldLog;
    let oldInfo;
    let oldError;
    let oldWarn;

    beforeEach(() => {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 31000;
      spyOn(console, "log");
      spyOn(console, "info");
      spyOn(console, "warn");
      spyOn(console, "error");
    })

    it("starts within 30s", (done) => {
      const timeout = setTimeout(() => {
        expect("startup time").toBe("less than 30s");
        done();
      }, 30000);

      let server = require('./../../server');
      // server is already starting
      server.ready.then(() => { clearTimeout(timeout); done(); });
    })

    afterEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    })

  })

});
