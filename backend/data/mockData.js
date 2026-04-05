function getMockNodes() {
  return [
    { id: "A", lat: 19.0760, lng: 72.8777 },
    { id: "B", lat: 19.0860, lng: 72.8877 },
    { id: "C", lat: 19.0960, lng: 72.8977 },
    { id: "D", lat: 19.0820, lng: 72.8677 },
  ];
}

function getMockEdges() {
  return [
    {
      from: "A",
      to: "B",
      distance: 5,
      lighting: 0.8,
      footfall: 0.7,
      crime: 0.2,
    },
    {
      from: "B",
      to: "C",
      distance: 4,
      lighting: 0.3,
      footfall: 0.2,
      crime: 0.7,
    },
    {
      from: "A",
      to: "D",
      distance: 6,
      lighting: 0.9,
      footfall: 0.8,
      crime: 0.1,
    },
    {
      from: "D",
      to: "C",
      distance: 3,
      lighting: 0.7,
      footfall: 0.6,
      crime: 0.2,
    },
  ];
}

module.exports = { getMockNodes, getMockEdges };