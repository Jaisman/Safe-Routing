
function dijkstra(graph, start, end, preference) {
  const dist = {};
  const prev = {};
  const pq = [];

  for (let node in graph) {
    dist[node] = Infinity;
  }

  dist[start] = 0;
  pq.push({ node: start, cost: 0 });

  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost);
    const { node, cost } = pq.shift();

    // 🔥 FIX
    if (cost > dist[node]) continue;

    if (node === end) break;

    for (let nei of graph[node] || []) {
      let weight;

      if (preference === "safe") {
        weight = nei.distance + (10 - nei.safety) * 5;
      } else {
        weight = nei.distance;
      }

      const newCost = cost + weight;

      if (newCost < dist[nei.node]) {
        dist[nei.node] = newCost;
        prev[nei.node] = node;
        pq.push({ node: nei.node, cost: newCost });
      }
    }
  }

  // ❌ no path
  if (dist[end] === Infinity) {
    return { path: [], cost: null };
  }

  // ✅ build path
  let path = [];
  let curr = end;

  while (curr !== undefined) {
    path.push(curr);
    curr = prev[curr];
  }

  path.reverse();

  return { path, cost: dist[end] };
}
module.exports = { dijkstra };
