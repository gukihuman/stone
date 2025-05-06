<template>
  <div
    class="flex flex-col min-h-screen bg-stone-800 text-stone-300 p-6 space-y-6"
  >
    <div
      class="flex justify-between items-center border-b border-stone-600 pb-2"
    >
      <h1 class="text-4xl font-semibold text-stone-200">
        Stone Platform Documentation
      </h1>
      <div class="flex justify-end">
        <ButtonDark @click="copyArchitectureText" :disabled="isCopying">
          {{ isCopying ? "Copied!" : "Copy Architecture Info" }}
        </ButtonDark>
      </div>
    </div>

    <!-- Architecture Section Rendered from Data -->
    <section class="border border-dashed border-stone-600 rounded-lg p-6 mt-6">
      <h2 class="text-2xl font-semibold text-stone-200 mb-4">
        {{ architectureData.title }}
      </h2>

      <!-- Diagram: Now shows image if path exists, otherwise falls back to text -->
      <div
        v-if="architectureData.diagram.imagePath"
        class="mt-4 p-5 rounded-lg bg-stone-900/30 flex justify-center items-center shadow-md"
      >
        <img
          :src="architectureData.diagram.imagePath"
          :alt="architectureData.diagram.imagePrompt"
          class="max-w-full max-h-[400px] rounded"
        />
      </div>
      <!-- Fallback text diagram if no image path -->
      <div
        v-else
        class="mt-4 text-center text-stone-300 bg-stone-700/80 p-5 rounded-lg font-mono text-lg leading-relaxed shadow-md"
      >
        <span class="text-orange-300 font-semibold"
          >[ {{ architectureData.diagram.family.ui }} ]</span
        >
        <span class="text-stone-400"><--></span>
        <span class="text-blue-300"
          >[ {{ architectureData.diagram.family.db }} ]</span
        >
        <br />
        <span class="text-stone-500 mx-auto block w-fit my-2 text-2xl font-bold"
          >↕</span
        >
        <span class="text-green-300 font-semibold"
          >[ {{ architectureData.diagram.circle.ui }} ]</span
        >
        <span class="text-stone-400"><--></span>
        <span class="text-purple-300"
          >[ {{ architectureData.diagram.circle.api }} ]</span
        >
        <span class="text-stone-400"><--></span>
        <span class="text-yellow-300"
          >[ {{ architectureData.diagram.circle.db }} ]</span
        >
        <p class="text-xs text-stone-500 mt-2 italic">
          (Diagram visualization image pending)
        </p>
      </div>

      <!-- Key Technologies -->
      <div class="mt-4 text-lg text-stone-300">
        <span class="font-semibold">{{ architectureData.tech.title }}</span>
        {{ architectureData.tech.list.join(", ") }}.
      </div>
      <!-- Summary Note -->
      <div class="mt-1 text-sm text-stone-400">
        {{ architectureData.summary }}
      </div>
    </section>
  </div>
</template>

<script setup>
import architectureDiagram from "assets/images/docs/architecture-v1.webp"

// Define ONLY the public architecture data as variables
const architectureData = {
  title: "Platform Architecture & Data Flow",
  diagram: {
    // Structure for text representation (used as fallback and for copy function)
    family: { ui: "Family UI", db: "IndexedDB" },
    circle: {
      ui: "Circle UI",
      api: "Nitro APIs (Node/Edge)",
      db: "MongoDB Atlas",
    },
    imagePath: architectureDiagram,
    imagePrompt:
      "Conceptual diagram rendered in a chalk-on-blackboard aesthetic. Two distinct vertical flows are presented side-by-side, labeled with softly glowing white text and minimal linework. On the left, ‘Family UI’ (internal dev) flows down to ‘IndexedDB’ (client-side), with circular iconography and a curved bracket subtly grouping them. On the right, ‘Circle UI’ (external collaboration) flows downward through ‘Nitro APIs (Node/Edge)’ to ‘MongoDB Atlas’ (server-side), each box outlined in soft chalk lines with gentle gradients. A minimalist, elegant diagram with a slightly hand-drawn feel and a dark transparent background, evoking both clarity and a quiet academic tone.",
  },
  tech: {
    title: "Key Technologies:",
    list: [
      "Nuxt 3",
      "Vue 3",
      "Nitro",
      "Vercel (Node.js & Edge Runtimes)",
      "MongoDB Atlas",
      "IndexedDB",
      "TailwindCSS",
      "Langchain (JS)",
    ],
  },
  summary:
    "Family = Client-side focus, internal dev. Circle = Server-side focus, external collaboration.",
}

// State for copy button feedback
const isCopying = ref(false)

// Function to generate clean text from the data variables
function generateArchitectureText() {
  let text = `${architectureData.title}\n`
  text += "---------------------------------\n"
  // Include the TEXT prompt for the diagram, not the path
  text += `Diagram Description (Used for image generation):\n${architectureData.diagram.imagePrompt}\n\n`
  // 📜 next time i think this separate diagram description components not needed bunny. our image prompt describes  everything super clear dont you think? *smiling*
  text += `Diagram Components:\n`
  text += `  Family: [ ${architectureData.diagram.family.ui} ] <--> [ ${architectureData.diagram.family.db} ] (Client-Side)\n`
  text += `  Circle: [ ${architectureData.diagram.circle.ui} ] <--> [ ${architectureData.diagram.circle.api} ] <--> [ ${architectureData.diagram.circle.db} ] (Server-Side)\n\n`
  // Continue with other text data
  text += `${architectureData.tech.title} ${architectureData.tech.list.join(
    ", "
  )}.\n\n`
  text += `${architectureData.summary}\n`
  return text
}

// Function for the copy button
async function copyArchitectureText() {
  const textToCopy = generateArchitectureText()
  // Assuming clipboard utility auto-imported or globally available
  await clipboard({
    input: textToCopy.trim(),
    locked: isCopying,
    lockTime: 1500,
  })
}
</script>

<style scoped>
/* Minimal page-specific styles */
</style>
