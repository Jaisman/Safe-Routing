function normalize(value, min, max) {
  if (value == null || isNaN(value)) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
}

function calculateSafety(edge) {
  const lighting = normalize(edge.lighting, 0, 10);
  const footfall = normalize(edge.footfall, 0, 10);
  const commercial = normalize(edge.commercial, 0, 10);
  const crime = normalize(edge.crime, 0, 10);

  const score = 0.35 * lighting + 0.30 * footfall + 0.20 * commercial - 0.40 * crime;
  return Math.max(0, score); // still 0..1
}
module.exports = { calculateSafety };