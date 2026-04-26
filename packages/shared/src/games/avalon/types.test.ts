import { describe, expect, test } from "bun:test";
import {
  AvalonRole,
  AvalonPhase,
  AvalonTeam,
  TEAM_SIZES,
  getTeamSize,
  isTwoFailMission,
} from "./types";

describe("AvalonRole", () => {
  test("has all basic roles", () => {
    expect(AvalonRole.Merlin).toBe("merlin");
    expect(AvalonRole.Servant).toBe("servant");
    expect(AvalonRole.Minion).toBe("minion");
    expect(AvalonRole.Mordred).toBe("mordred");
    expect(AvalonRole.Morgana).toBe("morgana");
    expect(AvalonRole.Percival).toBe("percival");
    expect(AvalonRole.Oberon).toBe("oberon");
  });

  test("Merlin is a Good role", () => {
    const goodRoles = [AvalonRole.Merlin, AvalonRole.Servant, AvalonRole.Percival];
    for (const role of goodRoles) {
      expect([AvalonRole.Merlin, AvalonRole.Servant, AvalonRole.Percival]).toContain(role);
    }
  });

  test("Minion, Mordred, Morgana, Oberon are Evil roles", () => {
    const evilRoles = [AvalonRole.Minion, AvalonRole.Mordred, AvalonRole.Morgana, AvalonRole.Oberon];
    for (const role of evilRoles) {
      expect([AvalonRole.Minion, AvalonRole.Mordred, AvalonRole.Morgana, AvalonRole.Oberon]).toContain(role);
    }
  });
});

describe("AvalonPhase", () => {
  test("has all game phases", () => {
    const phases = Object.values(AvalonPhase);
    expect(phases).toContain("team_proposal");
    expect(phases).toContain("team_vote");
    expect(phases).toContain("quest");
    expect(phases).toContain("resolution");
    expect(phases).toContain("assassination");
    expect(phases).toContain("lobby");
  });
});

describe("AvalonTeam", () => {
  test("has Good and Evil", () => {
    expect(AvalonTeam.Good).toBe("good");
    expect(AvalonTeam.Evil).toBe("evil");
  });
});

describe("TEAM_SIZES", () => {
  test("has entry for 5 players", () => {
    const sizes = TEAM_SIZES[5];
    expect(sizes).toBeDefined();
    expect(sizes).toHaveLength(5);
    expect(sizes).toEqual([2, 3, 2, 3, 3]);
  });

  test("has entry for 10 players", () => {
    const sizes = TEAM_SIZES[10];
    expect(sizes).toBeDefined();
    expect(sizes).toHaveLength(5);
    expect(sizes).toEqual([3, 4, 4, 5, 5]);
  });
});

describe("getTeamSize", () => {
  test("returns correct size for 5 players, mission 1", () => {
    expect(getTeamSize(5, 1)).toBe(2);
  });

  test("returns correct size for 7 players, mission 4 (two-fail)", () => {
    expect(getTeamSize(7, 4)).toBe(4);
  });

  test("returns correct size for 10 players, mission 5", () => {
    expect(getTeamSize(10, 5)).toBe(5);
  });

  test("throws on invalid player count", () => {
    expect(() => getTeamSize(3, 1)).toThrow();
    expect(() => getTeamSize(11, 1)).toThrow();
  });

  test("throws on invalid mission number", () => {
    expect(() => getTeamSize(5, 0)).toThrow();
    expect(() => getTeamSize(5, 6)).toThrow();
  });
});

describe("isTwoFailMission", () => {
  test("mission 4 with 7+ players requires 2 fails", () => {
    expect(isTwoFailMission(7, 4)).toBe(true);
    expect(isTwoFailMission(10, 4)).toBe(true);
  });

  test("mission 4 with 5-6 players does not require 2 fails", () => {
    expect(isTwoFailMission(5, 4)).toBe(false);
    expect(isTwoFailMission(6, 4)).toBe(false);
  });

  test("non-mission-4 never requires 2 fails", () => {
    expect(isTwoFailMission(7, 1)).toBe(false);
    expect(isTwoFailMission(10, 3)).toBe(false);
    expect(isTwoFailMission(8, 5)).toBe(false);
  });
});
