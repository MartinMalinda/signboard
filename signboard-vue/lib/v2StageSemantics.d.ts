export declare const V2_STAGE_KEYS: readonly [
  "inbox",
  "shaping",
  "ready",
  "active",
  "review",
  "blocked",
  "done",
  "dropped",
];

export declare const V2_TERMINAL_STAGES: readonly ["done", "dropped"];

export declare function resolveV2StageSemantics(
  profile: unknown,
  listName: unknown,
): {
  stage:
    | "inbox"
    | "shaping"
    | "ready"
    | "active"
    | "review"
    | "blocked"
    | "done"
    | "dropped"
    | null;
  mapped: boolean;
  ambiguous: boolean;
  terminal: boolean;
};
