const test = require("node:test");
const assert = require("node:assert/strict");

const { add, multiply, health } = require("../src/app");

test("add(2, 3) returns 5", () => {
  assert.equal(add(2, 3), 5);
});

test("multiply(4, 5) returns 20", () => {
  assert.equal(multiply(4, 5), 20);
});

test("health() returns service status", () => {
  assert.deepEqual(health(), {
    status: "ok",
    service: "sample-node-app"
  });
});