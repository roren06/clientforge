type WorkspaceAccessContext = {
  userId: string;
  workspaceId: string;
  role: string | null;
};

type DeliverableAccessTarget = {
  workspaceId: string;
  clientUserId: string | null;
};

export function canAccessDeliverable(
  context: WorkspaceAccessContext,
  target: DeliverableAccessTarget
) {
  if (target.workspaceId !== context.workspaceId) {
    return false;
  }

  if (context.role === "CLIENT") {
    return target.clientUserId === context.userId;
  }

  return true;
}
