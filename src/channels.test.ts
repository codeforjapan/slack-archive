import { describe, it, expect } from "vitest";

import { channelKind, addIncludeChannels } from "./channels.js";

// Slack sets `is_private: true` on DMs and group DMs as well as on private
// channels, so a classifier that asks "is it private?" first labels every DM
// in the archive a private channel. That is the difference between a gate that
// withholds direct messages and one that hands them to whoever asks, which is
// why the ordering has tests of its own.
describe("channelKind", () => {
  it("classifies an ordinary channel as public", () => {
    expect(channelKind({ id: "C1", name: "general" })).toBe("public");
  });

  it("classifies a private channel as private", () => {
    expect(channelKind({ id: "C2", name: "salainen", is_private: true })).toBe(
      "private",
    );
  });

  it("classifies a DM as im even though Slack marks it private", () => {
    expect(channelKind({ id: "D1", is_im: true, is_private: true })).toBe("im");
  });

  it("classifies a group DM as mpim even though Slack marks it private", () => {
    expect(channelKind({ id: "G1", is_mpim: true, is_private: true })).toBe(
      "mpim",
    );
  });

  it("prefers im over mpim when Slack sets both", () => {
    expect(
      channelKind({ id: "D2", is_im: true, is_mpim: true, is_private: true }),
    ).toBe("im");
  });

  it("treats explicitly false flags as public rather than unknown", () => {
    expect(
      channelKind({
        id: "C3",
        name: "avoin",
        is_private: false,
        is_im: false,
        is_mpim: false,
      }),
    ).toBe("public");
  });
});

describe("addIncludeChannels", () => {
  const allChannels = [
    { id: "C1", name: "general" },
    { id: "C2", name: "random" },
    { id: "C3", name: "dev" },
    { id: "C4", name: "design" },
  ];
  const selected = [{ id: "C1", name: "general" }];

  it("adds channels matched by name", () => {
    const result = addIncludeChannels(allChannels, selected, ["random", "dev"]);
    expect(result.map((c) => c.id)).toEqual(["C1", "C2", "C3"]);
  });

  it("adds channels matched by id", () => {
    const result = addIncludeChannels(allChannels, selected, ["C4"]);
    expect(result.map((c) => c.id)).toEqual(["C1", "C4"]);
  });

  it("does not duplicate already-selected channels", () => {
    const result = addIncludeChannels(allChannels, selected, ["general"]);
    expect(result.map((c) => c.id)).toEqual(["C1"]);
  });

  it("ignores names that do not match any channel", () => {
    const result = addIncludeChannels(allChannels, selected, ["nonexistent"]);
    expect(result.map((c) => c.id)).toEqual(["C1"]);
  });

  it("returns selected unchanged when include list is empty", () => {
    const result = addIncludeChannels(allChannels, selected, []);
    expect(result.map((c) => c.id)).toEqual(["C1"]);
  });
});
