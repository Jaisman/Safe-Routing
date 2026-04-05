const { getMockNodes, getMockEdges } = require("../data/mockData");
const { calculateSafety } = require("./safetyScore");

function buildGraph() {
  const nodes = getMockNodes();
  const edges = getMockEdges();

  let graph = {};

  nodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    const safety = calculateSafety(edge);

    graph[edge.from].push({
      node: edge.to,
      distance: edge.distance,
      safety,
    });

    graph[edge.to].push({
      node: edge.from,
      distance: edge.distance,
      safety,
    });
  });

  return graph;
}

module.exports = { buildGraph };