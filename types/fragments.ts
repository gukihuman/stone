// types/fragments.ts
export interface FragmentFilters {
  space?: string[]
  entity?: string
  kind?: "memory" | "utterance" | "thinking_stream"
  minTimestamp?: number
  maxTimestamp?: number
  parent?: string | null
  tokens?: number
  _id?: string
  ids?: string[]
}
