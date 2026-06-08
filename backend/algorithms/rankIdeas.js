function rankIdeas(ideas) {
  return ideas.sort((a, b) => b.score - a.score);
}

module.exports = { rankIdeas };