const {
  calculateFeasibility,
  normalizeScore,
  rankIdeas
} = require("../index");

// 🔹 Test 1: feasibility score
const score = calculateFeasibility(8, 4, 7);

console.log("Feasibility Score:", score);

// 🔹 Test 2: normalize
console.log("Normalize 15:", normalizeScore(15));
console.log("Normalize 5:", normalizeScore(5));

// 🔹 Test 3: rank ideas
const ideas = [
  { name: "Idea A", score: 6 },
  { name: "Idea B", score: 9 },
  { name: "Idea C", score: 7 }
];

console.log("Ranked Ideas:", rankIdeas(ideas));