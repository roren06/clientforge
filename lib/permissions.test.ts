import { describe, expect, it } from "vitest";
import { canAccessDeliverable } from "@/lib/permissions";

const ownerContext = {
  userId: "owner-user",
  workspaceId: "workspace-a",
  role: "OWNER",
};

const clientContext = {
  userId: "client-user",
  workspaceId: "workspace-a",
  role: "CLIENT",
};

describe("canAccessDeliverable", () => {
  it("allows internal users to access deliverables in their workspace", () => {
    expect(
      canAccessDeliverable(ownerContext, {
        workspaceId: "workspace-a",
        clientUserId: "another-client-user",
      })
    ).toBe(true);
  });

  it("blocks internal users from other workspaces", () => {
    expect(
      canAccessDeliverable(ownerContext, {
        workspaceId: "workspace-b",
        clientUserId: "client-user",
      })
    ).toBe(false);
  });

  it("allows client users only when the deliverable belongs to their linked client record", () => {
    expect(
      canAccessDeliverable(clientContext, {
        workspaceId: "workspace-a",
        clientUserId: "client-user",
      })
    ).toBe(true);
  });

  it("blocks client users from another client's deliverables in the same workspace", () => {
    expect(
      canAccessDeliverable(clientContext, {
        workspaceId: "workspace-a",
        clientUserId: "other-client-user",
      })
    ).toBe(false);
  });

  it("blocks client users when the client record is not linked to a user", () => {
    expect(
      canAccessDeliverable(clientContext, {
        workspaceId: "workspace-a",
        clientUserId: null,
      })
    ).toBe(false);
  });
});
