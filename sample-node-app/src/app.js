function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function health() {
  return {
    status: "ok",
    service: "sample-node-app"
  };
}

if (require.main === module) {
  console.log("sample-node-app is running");
}

module.exports = {
  add,
  multiply,
  health
};