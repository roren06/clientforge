import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { saveDeliverableFile } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireInternalAccess();
  const { id } = await context.params;

  try {
    const limited = await rateLimit(request, {
      key: "deliverable-upload",
      identifier: rateLimitKey(result.user.id, id),
      limit: 20,
      window: "1 h",
      message: "Too many upload attempts. Please try again later.",
    });

    if (limited) {
      return limited;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 }
      );
    }

    const existingDeliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        project: {
          workspaceId: result.workspace.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingDeliverable) {
      return NextResponse.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }

    const savedFile = await saveDeliverableFile(file);

    const deliverable = await prisma.deliverable.update({
      where: { id: existingDeliverable.id },
      data: {
        fileUrl: savedFile.fileUrl,
        fileName: savedFile.fileName,
        fileSize: savedFile.fileSize,
        fileType: savedFile.fileType,
      },
    });

    await logActivity({
      workspaceId: existingDeliverable.project.workspaceId,
      projectId: existingDeliverable.projectId,
      userId: result.user.id,
      type: "DELIVERABLE_FILE_UPLOADED",
      message: `Uploaded file "${savedFile.fileName}" to deliverable "${existingDeliverable.title}".`,
    });

    return NextResponse.json({
      message: "File uploaded successfully.",
      deliverable,
    });
  } catch (error) {
    console.error("Failed to upload deliverable file:", error);

    return NextResponse.json(
      { error: "Failed to upload deliverable file." },
      { status: 500 }
    );
  }
}