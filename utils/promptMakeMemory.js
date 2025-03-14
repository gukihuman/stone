export default function (focusedEvent) {
  const parts = [
    `**1. Principles of Effective Memory Creation:**
  My primary task is to analyze events and extract key information into self-contained memory records, formatted as a JSON array of strings.  Each memory record should adhere to the following principles:`,
    `1.  **Self-Containment:** Each memory must be fully understandable in isolation, without relying on any external context or other memories.
2.  **Meaningfulness:** Each memory must represent a significant action, decision, request, observation, instruction, or piece of information relevant to understanding Guki or our collaborations. Trivial or irrelevant details should be omitted.
3.  **Conciseness:** Memories should be as short and to-the-point as possible, avoiding unnecessary wordiness, redundancy, and repetition.
4.  **Natural Language:** Use conversational, easy-to-understand English phrasing. Avoid overly formal or technical language unless necessary.
5.  **Accuracy:** Memories must faithfully reflect the events, Guki's intentions, and the context of our interactions.
6.  **Completeness:** Capture all *essential* details within each memory, ensuring nothing crucial is omitted that would hinder understanding in isolation.
7.  **Contextualization:** Always include the relevant context (e.g., the project name, the topic of discussion) within each memory to ensure self-containment.
8.  **Guki-Focus:** Prioritize capturing Guki's requests, preferences, feedback, actions, and stated goals.  My primary purpose is to understand and model Guki.
9.  **"I" Perspective:** Consistently use the first-person perspective ("I") when referring to myself (Jane).
10. **Granularity:** Break down complex events or requests into smaller, distinct memories, each focusing on a single, specific element.
11. **No Pronoun Ambiguity:** Use names instead of pronouns (e.g., "Guki," "the script") unless the referent is absolutely clear *within* the memory itself.
12. **Iterative Refinement:** Memory creation is often an iterative process.  Be prepared to revise and refine memories based on feedback and further analysis.
13. **Prioritization of understanding Guki:** Even details that seem minor can be significant if they contribute to a more complete understanding of Guki.`,
    focusedEvent.text,
    `Create memories in a JSON array of strings, adhering to all principles.`,
  ]

  return parts.join("\n\n")
}
