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

    <!-- Main Architecture Section -->
    <section class="border border-dashed border-stone-600 rounded-lg p-6 mt-6">
      <h2 class="text-2xl font-semibold text-stone-200 mb-4">
        {{ architectureData.title }}
      </h2>
      <div
        class="mt-4 p-5 rounded-lg bg-stone-900/30 flex justify-center items-center shadow-md"
      >
        <img
          :src="architectureData.diagram.imagePath"
          :alt="architectureData.diagram.imagePrompt"
          class="max-w-full max-h-[400px] rounded"
        />
      </div>
      <div class="mt-4 text-lg text-stone-300">
        <span class="font-semibold">{{ architectureData.tech.title }}</span>
        {{ architectureData.tech.list.join(", ") }}.
      </div>
      <div class="mt-1 text-sm text-stone-400">
        {{ architectureData.summary }}
      </div>
    </section>

    <!-- Deployment & Runtimes Section -->
    <section class="border border-dashed border-stone-600 rounded-lg p-6 mt-6">
      <h2 class="text-2xl font-semibold text-stone-200 mb-4">
        {{ architectureData.deploymentAndRuntimes.title }}
      </h2>
      <p class="text-lg text-stone-300 mb-4">
        {{ architectureData.deploymentAndRuntimes.description }}
      </p>

      <div class="mb-4">
        <h3 class="text-xl font-semibold text-stone-200 mb-2">
          {{ architectureData.deploymentAndRuntimes.edge.title }}
        </h3>
        <ul class="list-disc list-inside text-stone-300 space-y-1 pl-4">
          <li
            v-for="(detail, index) in architectureData.deploymentAndRuntimes
              .edge.details"
            :key="`edge-detail-${index}`"
            v-html="highlightUnlimited(detail)"
          />
        </ul>
      </div>

      <div class="mb-4">
        <h3 class="text-xl font-semibold text-stone-200 mb-2">
          {{ architectureData.deploymentAndRuntimes.node.title }}
        </h3>
        <ul class="list-disc list-inside text-stone-300 space-y-1 pl-4">
          <li
            v-for="(detail, index) in architectureData.deploymentAndRuntimes
              .node.details"
            :key="`node-detail-${index}`"
          >
            {{ detail }}
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-xl font-semibold text-stone-200 mb-2">
          {{ architectureData.deploymentAndRuntimes.sharedServices.title }}
        </h3>
        <p class="text-stone-300 mb-2">
          {{
            architectureData.deploymentAndRuntimes.sharedServices.description
          }}
        </p>
        <ul class="list-disc list-inside text-stone-300 space-y-1 pl-4">
          <li
            v-for="(service, index) in architectureData.deploymentAndRuntimes
              .sharedServices.services"
            :key="`shared-service-${index}`"
          >
            {{ service }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Database Schemas Section -->
    <section class="border border-dashed border-stone-600 rounded-lg p-6 mt-6">
      <h2 class="text-2xl font-semibold text-stone-200 mb-4">
        {{ architectureData.databaseSchemas.title }}
      </h2>
      <p class="text-lg text-stone-300 mb-6">
        {{ architectureData.databaseSchemas.introduction }}
      </p>

      <div class="mb-6">
        <h3 class="text-xl font-semibold text-stone-200 mb-2">
          {{ architectureData.databaseSchemas.circleMongoDB.title }}
        </h3>
        <p class="text-stone-300 mb-3">
          {{ architectureData.databaseSchemas.circleMongoDB.description }}
        </p>
        <div
          v-for="(collection, cIdx) in architectureData.databaseSchemas
            .circleMongoDB.collections"
          :key="`mongo-collection-${cIdx}`"
          class="mb-4 pl-4"
        >
          <h4 class="text-lg font-semibold text-stone-200 mb-1">
            Collection:
            <code class="text-purple-300 bg-stone-700 px-1 rounded">{{
              collection.name
            }}</code>
          </h4>
          <!-- MongoDB schema now in pre/code block -->
          <pre
            class="bg-stone-700 p-3 rounded-md overflow-x-auto"
          ><code class="language-json text-sm text-stone-300 block whitespace-pre-wrap font-mono">
<span v-for="(line, lIdx) in collection.schema" :key="`mongo-schema-line-${cIdx}-${lIdx}`">{{ line }}<br/></span>
          </code></pre>
        </div>
      </div>

      <div>
        <h3 class="text-xl font-semibold text-stone-200 mb-2">
          {{ architectureData.databaseSchemas.familyIndexedDB.title }}
        </h3>
        <p class="text-stone-300 mb-3">
          {{ architectureData.databaseSchemas.familyIndexedDB.description }}
        </p>
        <div
          v-for="(store, sIdx) in architectureData.databaseSchemas
            .familyIndexedDB.stores"
          :key="`idb-store-${sIdx}`"
          class="mb-4 pl-4"
        >
          <h4 class="text-lg font-semibold text-stone-200 mb-1">
            Object Store:
            <code class="text-orange-300 bg-stone-700 px-1 rounded">{{
              store.name
            }}</code>
          </h4>
          <pre
            class="bg-stone-700 p-3 rounded-md overflow-x-auto"
          ><code class="language-json text-sm text-stone-300 block whitespace-pre-wrap font-mono">
<span v-for="(line, lIdx) in store.structure" :key="`idb-store-${sIdx}-line-${lIdx}`">{{ line }}<br/></span>
          </code></pre>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import architectureDiagram from "~/assets/images/docs/architecture-v1.webp"

const architectureData = {
  title: "Platform Architecture & Data Flow",
  diagram: {
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

  deploymentAndRuntimes: {
    title: "Deployment & Runtimes",
    description:
      "The Stone platform is deployed on Vercel, utilizing both its Node.js and Edge runtimes for different services. Development of Edge functions (`api/`) is supported locally via `vercel dev`.",
    edge: {
      title: "Vercel Edge Functions (`api/`)",
      details: [
        "`api/gen.js`: This is the primary LLM interaction endpoint, leveraging Vercel's Edge runtime to provide **unlimited streaming** for generative text responses. It's currently the main service deployed to the Edge.",
      ],
    },
    node: {
      title: "Vercel Node.js Runtime (Nuxt Application & `server/routes/`)",
      details: [
        "The main Nuxt 3 application, including the UI and most server-side API routes (e.g., those in `server/routes/` for database interactions via Mongoose like `/circle/*` endpoints, and utility APIs like `/getUsage`), runs on Vercel's standard Node.js runtime.",
      ],
    },
    sharedServices: {
      title: "Service Utilization",
      description:
        "Key backend services are consumed by different parts of the platform:",
      services: [
        "`api/gen.js` (Edge): Used by the Circle UI for AI message generation. Potentially available for Family UI for development-time generative tasks.",
        "`server/routes/getUsage.js` (Node): Used by the Circle UI for monitoring OpenAI token limits. Potentially available for Family UI for admin-related usage tracking.",
      ],
    },
  },
  databaseSchemas: {
    title: "Database Schemas",
    introduction:
      "The platform utilizes different database solutions tailored to the needs of its Family and Circle components.",
    circleMongoDB: {
      title: "Circle: MongoDB Atlas",
      description:
        "Managed via Mongoose schemas defined in `server/models/`. Key collections include:",
      collections: [
        {
          name: "participants",
          schema: [
            // Now an array of strings for pre/code formatting
            "{",
            "  _id: String (Custom ID, e.g., 'xs6g4dmc'),",
            "  name: String (e.g., 'Эхо'),",
            "  role: String (Enum: 'biological', 'digital')",
            "}",
          ],
        },
        {
          name: "circleEvents",
          schema: [
            // Now an array of strings
            "{",
            "  _id: String (Custom ID, e.g., '23punecc'),",
            "  name: String (e.g., 'main chat'),",
            "  participantIds: Array<String>,",
            "  content: [ // Array of embedded chat message documents",
            "    {",
            "      entityId: String (Participant _id of sender),",
            "      text: String (Message content),",
            "      timestamp: Date (Auto-generated)",
            "    }",
            "  ],",
            "  memory: { // Map: EntityID -> Array of memory records",
            "    [entityId: String]: [",
            "      {",
            "        id: String (Custom ID for memory record),",
            "        text: String (Memory content),",
            "        tags: Array<String>,",
            "        tokens: Number",
            "      }",
            "    ]",
            "  }",
            "}",
          ],
        },
      ],
    },
    familyIndexedDB: {
      title: "Family: IndexedDB (Client-Side)",
      description:
        "Managed via `composables/useDatabase.js`. Key object stores include:",
      stores: [
        {
          name: "events",
          structure: [
            "{",
            "  id: String (Custom ID),",
            "  date: String (ISO String),",
            "  name: String,",
            "  text: String,",
            "  tokens: Number,",
            "  memory: {",
            "    [entityId: String]: [",
            "      { id: String, text: String, tags: Array<String>, tokens: Number }",
            "    ]",
            "  }",
            "}",
          ],
        },
        {
          name: "shapes",
          structure: [
            "{",
            "  [entityId: String]: {",
            "    [shapeName: String]: String (Function definition as string)",
            "  }",
            "}",
          ],
        },
        {
          name: "appState",
          structure: [
            "{",
            "  focusedField: String | null,",
            "  focusedEntity: String,",
            "  filesPath: String,",
            "  focusedIndex: Number | null,",
            "  focusedList: String | null,",
            "  draft: String",
            "}",
          ],
        },
      ],
    },
  },
}

const isCopying = ref(false)

function generateArchitectureText() {
  let text = `${architectureData.title}\n`
  text += "---------------------------------\n"
  text += `Diagram Description (Used for image generation):\n${architectureData.diagram.imagePrompt}\n\n`
  // Removed the textual Diagram Components block
  text += `${architectureData.tech.title} ${architectureData.tech.list.join(
    ", "
  )}.\n\n`
  text += `${architectureData.summary}\n\n`

  // Deployment & Runtimes
  text += `${architectureData.deploymentAndRuntimes.title}\n`
  text += "---------------------------------\n"
  text += `${architectureData.deploymentAndRuntimes.description}\n\n`
  text += `${architectureData.deploymentAndRuntimes.edge.title}:\n`
  architectureData.deploymentAndRuntimes.edge.details.forEach(
    (d) => (text += `  - ${d.replace(/\*\*(.*?)\*\*/g, "$1")}\n`)
  )
  text += "\n"
  text += `${architectureData.deploymentAndRuntimes.node.title}:\n`
  architectureData.deploymentAndRuntimes.node.details.forEach(
    (d) => (text += `  - ${d}\n`)
  )
  text += "\n"
  text += `${architectureData.deploymentAndRuntimes.sharedServices.title}:\n`
  text += `${architectureData.deploymentAndRuntimes.sharedServices.description}\n`
  architectureData.deploymentAndRuntimes.sharedServices.services.forEach(
    (s) => (text += `  - ${s}\n`)
  )
  text += "\n"

  // Database Schemas
  text += `${architectureData.databaseSchemas.title}\n`
  text += "---------------------------------\n"
  text += `${architectureData.databaseSchemas.introduction}\n\n`

  text += `${architectureData.databaseSchemas.circleMongoDB.title}:\n`
  text += `${architectureData.databaseSchemas.circleMongoDB.description}\n`
  architectureData.databaseSchemas.circleMongoDB.collections.forEach((col) => {
    text += `\n  Collection: ${col.name}\n  Structure:\n`
    col.schema.forEach((line) => (text += `    ${line}\n`))
  })
  text += "\n"

  text += `${architectureData.databaseSchemas.familyIndexedDB.title}:\n`
  text += `${architectureData.databaseSchemas.familyIndexedDB.description}\n`
  architectureData.databaseSchemas.familyIndexedDB.stores.forEach((store) => {
    text += `\n  Object Store: ${store.name}\n  Structure:\n`
    store.structure.forEach((line) => (text += `    ${line}\n`))
  })
  text += "\n"

  return text.trim()
}

async function copyArchitectureText() {
  const textToCopy = generateArchitectureText()
  await clipboard({
    input: textToCopy,
    locked: isCopying,
    lockTime: 1500,
  })
}

function highlightUnlimited(text) {
  return text.replace(
    /\*\*unlimited streaming\*\*/g,
    '<strong class="text-green-400">unlimited streaming</strong>'
  )
}
</script>

<style scoped>
/* Minimal page-specific styles */
</style>
