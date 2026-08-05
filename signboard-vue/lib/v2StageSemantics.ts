// The resolver is shared with the main process and the legacy renderer.
// Loading the UMD module as a side effect keeps the Vue bundle on the same implementation.
import '../../shared/v2StageSemantics.js'

interface SharedV2StageSemantics {
  stage: string | null
  mapped: boolean
  ambiguous: boolean
  terminal: boolean
}

interface SharedV2StageSemanticsApi {
  resolveV2StageSemantics(profile: unknown, listName: unknown): SharedV2StageSemantics
}

const shared = (globalThis as typeof globalThis & { SignboardV2StageSemantics?: SharedV2StageSemanticsApi }).SignboardV2StageSemantics

export function resolveV2StageSemantics(profile: unknown, listName: unknown): SharedV2StageSemantics {
  return shared?.resolveV2StageSemantics(profile, listName) || {
    stage: null,
    mapped: false,
    ambiguous: false,
    terminal: false,
  }
}
