'use strict';
describe("server/lib/tools.js", () => {
  let tools;
  beforeAll(() => {
    tools = require('./../../../server/lib/tools');
  });

  it("imports correctly", () => {
    expect(tools).not.toBeNull();
  });

  describe("tools.number", () => {
    beforeEach(() => {
      spyOn(console, "error");
    });

    it("parses correct numbers", function() {
      expect(tools.number(3)).toBe(3);
      expect(tools.number("3")).toBe(3);
      expect(tools.number("3.14")).toBe(3.14);
    });

    it("parses expected special values", function() {
      expect(tools.number(null)).toBeNull();
      expect(tools.number(undefined)).not.toBeDefined();
    });

    it("fails on non-numbers", function() {
      expect(tools.number(NaN)).not.toBeDefined();
      expect(tools.number({})).not.toBeDefined();
      expect(tools.number([])).not.toBeDefined();
      expect(tools.number(()=>{})).not.toBeDefined();

      expect(tools.number("i")).not.toBeDefined();
      expect(tools.number("3i")).not.toBeDefined();
      expect(tools.number("")).not.toBeDefined();

      expect(console.error).toHaveBeenCalled(); // eslint-disable-line no-console
    });
  });

  // todo more
});
