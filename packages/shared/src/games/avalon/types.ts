// Avalon: The Resistance — Core Types
// Shared types used by both server game engine and client UI

// ─── Roles ──────────────────────────────────────────────────
export const AvalonRole = {
  // Good
  Merlin: "merlin",
  Servant: "servant",
  Percival: "percival",
  Guinevere: "guinevere",
  GoodLancelot: "good_lancelot",
  Tristan: "tristan",
  Isolde: "isolde",
  Cleric: "cleric",
  Revealer: "revealer",
  Troublemaker: "troublemaker",
  MerlinPure: "merlin_pure",
  // Evil
  Minion: "minion",
  Mordred: "mordred",
  Morgana: "morgana",
  Oberon: "oberon",
  EvilLancelot: "evil_lancelot",
  Trickster: "trickster",
  Witch: "witch",
  Lunatic: "lunatic",
  Brute: "brute",
} as const;

export type AvalonRoleType = (typeof AvalonRole)[keyof typeof AvalonRole];

export const GOOD_ROLES = new Set<AvalonRoleType>([
  AvalonRole.Merlin,
  AvalonRole.Servant,
  AvalonRole.Percival,
  AvalonRole.Guinevere,
  AvalonRole.GoodLancelot,
  AvalonRole.Tristan,
  AvalonRole.Isolde,
  AvalonRole.Cleric,
  AvalonRole.Revealer,
  AvalonRole.Troublemaker,
  AvalonRole.MerlinPure,
]);

export const EVIL_ROLES = new Set<AvalonRoleType>([
  AvalonRole.Minion,
  AvalonRole.Mordred,
  AvalonRole.Morgana,
  AvalonRole.Oberon,
  AvalonRole.EvilLancelot,
  AvalonRole.Trickster,
  AvalonRole.Witch,
  AvalonRole.Lunatic,
  AvalonRole.Brute,
]);

// ─── Game Phases ─────────────────────────────────────────────
export const AvalonPhase = {
  Lobby: "lobby",
  RoleAssignment: "role_assignment",
  TeamProposal: "team_proposal",
  TeamVote: "team_vote",
  Quest: "quest",
  Resolution: "resolution",
  Assassination: "assassination",
  GameEnd: "game_end",
} as const;

export type AvalonPhaseType = (typeof AvalonPhase)[keyof typeof AvalonPhase];

// ─── Teams ────────────────────────────────────────────────────
export const AvalonTeam = {
  Good: "good",
  Evil: "evil",
} as const;

export type AvalonTeamType = (typeof AvalonTeam)[keyof typeof AvalonTeam];

// ─── Mission Team Sizes ───────────────────────────────────────
// Index: [5 players, 6, 7, 8, 9, 10] → mission 1-5 team sizes
const TEAM_SIZE_TABLE: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

export const TEAM_SIZES: Record<number, number[]> = TEAM_SIZE_TABLE;

/**
 * Get the required team size for a given player count and mission number.
 * Player count must be 5-10. Mission number must be 1-5.
 */
export function getTeamSize(playerCount: number, missionNumber: number): number {
  if (!TEAM_SIZE_TABLE[playerCount]) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
  }
  if (missionNumber < 1 || missionNumber > 5) {
    throw new Error(`Invalid mission number: ${missionNumber}. Must be 1-5.`);
  }
  return TEAM_SIZE_TABLE[playerCount][missionNumber - 1];
}

/**
 * Mission 4 in 7-10 player games requires TWO fail cards to fail the mission.
 * All other missions require only one fail card.
 */
export function isTwoFailMission(playerCount: number, missionNumber: number): boolean {
  return missionNumber === 4 && playerCount >= 7;
}
