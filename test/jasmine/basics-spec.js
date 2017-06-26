'use strict';
describe("basics", () => {
  it("sets TESTING", () => {
    expect(process.env.TESTING).toBeTruthy();
  });

});
