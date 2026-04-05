const District = require("../models/district");

function haversine(a, b) {
  const R = 6371;

  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 *
    Math.cos(lat1) *
    Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function reconstruct(cameFrom, node) {

  const path = [node];

  while (cameFrom[node.name]) {
    node = cameFrom[node.name];
    path.unshift(node);
  }

  return path;
}

function aStar(graph, start, goal) {

  const open = new Set([start]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  graph.forEach(n => {
    gScore[n.name] = Infinity;
    fScore[n.name] = Infinity;
  });

  gScore[start.name] = 0;
  fScore[start.name] = haversine(start, goal);

  while (open.size > 0) {

    let current =
      [...open].reduce((a, b) =>
        fScore[a.name] < fScore[b.name] ? a : b
      );

    if (current.name === goal.name) {
      return reconstruct(cameFrom, current);
    }

    open.delete(current);

    current.neighbors.forEach(neighbor => {

      const cost =
        haversine(current, neighbor) *
        ((current.risk + neighbor.risk) / 2);

      const tentative = gScore[current.name] + cost;

      if (tentative < gScore[neighbor.name]) {

        cameFrom[neighbor.name] = current;

        gScore[neighbor.name] = tentative;

        fScore[neighbor.name] =
          tentative + haversine(neighbor, goal);

        open.add(neighbor);

      }

    });

  }

  return [];
}

async function buildDistrictGraph() {

  const districts = await District.find();

  const nodes = districts.map(d => ({
    name: d.name,
    lat: d.location.coordinates[1],
    lng: d.location.coordinates[0],
    risk: d.risk_multiplier || 1,
    neighbors: []
  }));

  nodes.forEach(a => {

    nodes.forEach(b => {

      if (a.name === b.name) return;

      const dist = haversine(a, b);

      if (dist < 200) {
        a.neighbors.push(b);
      }

    });

  });

  return nodes;
}

function findNearestDistrict(point, districts) {

  let best = null;
  let bestDist = Infinity;

  districts.forEach(d => {

    const dist = haversine(point, d);

    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }

  });

  return best;
}

module.exports = {
  buildDistrictGraph,
  findNearestDistrict,
  aStar
};