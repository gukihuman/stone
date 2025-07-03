// ~/server/utils/parser.js
import { LABELS, SPELLS } from "~/shared/lexicon"

export default function parseLoom(loomContent) {
  const waveData = {
    source: "guki",
    data: loomContent.replace(SPELLS.COMMIT, "").trim(),
    priority: 5,
    density: 0,
    provenance: [],
    apotheosis: null,
  }
  return {
    waves: [waveData],
  }
}
