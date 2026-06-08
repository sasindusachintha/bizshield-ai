console.log("INDEX LOADED");

const feasibility = require("./feasibility");
const normalize = require("./normalizeScores");
const rank = require("./rankIdeas");

console.log("feasibility file:", feasibility);

module.exports = {
  ...feasibility,
  ...normalize,
  ...rank
};
// How backend will use it :- In /backend later:

// const {
//   calculateFeasibility,
//   normalizeScore,
//   rankIdeas
// } = require("../algorithms");