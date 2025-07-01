// ~/server/utils/parser.js
export default function parseLoom(loomContent) {
  // We will expand this logic later to handle @spells
  const waveData = {
    source: "guki", // Default for guki's flow for now
    data: loomContent.replace("#commit", "").trim(),
    priority: 5,
    density: 0,
    provenance: [],
    apotheosis: null,
  }
  return {
    waves: [waveData],
  }
}
