import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/guards";
import { canAccessDeliverable } from "@/lib/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireWorkspaceAccess();
  const { id } = await context.params;

  try {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!deliverable || !deliverable.fileUrl) {
      return NextResponse.json(
        { error: "File not found." },
        { status: 404 }
      );
    }

    if (
      !canAccessDeliverable(
        {
          userId: result.user.id,
          workspaceId: result.workspace.id,
          role: result.role,
        },
        {
          workspaceId: deliverable.project.workspaceId,
          clientUserId: deliverable.project.client.userId,
        }
      )
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    let upstream = await fetch(deliverable.fileUrl);

    if (!upstream.ok || !upstream.body) {
      const signedUrl = getSignedCloudinaryDownloadUrl(deliverable.fileUrl);

      if (signedUrl) {
        upstream = await fetch(signedUrl);
      }
    }

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {
          error:
            "File could not be loaded. If this is a PDF, enable PDF/ZIP delivery in Cloudinary Security settings or re-upload after storage settings are updated.",
        },
        { status: 502 }
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${toSafeFileName(
          deliverable.fileName ?? "deliverable-file"
        )}"`,
        "Content-Type": deliverable.fileType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Failed to download deliverable file:", error);

    return NextResponse.json(
      { error: "Failed to download file." },
      { status: 500 }
    );
  }
}

function toSafeFileName(fileName: string) {
  return fileName.replace(/["\\\r\n]/g, "_");
}

function getSignedCloudinaryDownloadUrl(fileUrl: string) {
  try {
    const parsed = parseCloudinaryUrl(fileUrl);

    if (!parsed) {
      return null;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return cloudinary.utils.private_download_url(
      parsed.publicId,
      parsed.format,
      {
        resource_type: parsed.resourceType,
        type: parsed.deliveryType,
        attachment: true,
        expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
      }
    );
  } catch (error) {
    console.error("Failed to sign Cloudinary download URL:", error);
    return null;
  }
}

function parseCloudinaryUrl(fileUrl: string) {
  const url = new URL(fileUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.findIndex((part) => part === "upload");

  if (!url.hostname.endsWith("cloudinary.com") || uploadIndex < 2) {
    return null;
  }

  const resourceType = parts[uploadIndex - 1];
  const deliveryType = parts[uploadIndex];
  const assetParts = parts.slice(uploadIndex + 1);
  const withoutVersion =
    assetParts[0]?.startsWith("v") && /^\d+$/.test(assetParts[0].slice(1))
      ? assetParts.slice(1)
      : assetParts;
  const assetPath = decodeURIComponent(withoutVersion.join("/"));
  const extensionMatch = assetPath.match(/\.([^.\/]+)$/);
  const format = extensionMatch?.[1] ?? "";
  const publicId = extensionMatch
    ? assetPath.slice(0, -(format.length + 1))
    : assetPath;

  if (!publicId || !format || !["image", "video", "raw"].includes(resourceType)) {
    return null;
  }

  return {
    resourceType,
    deliveryType,
    publicId,
    format,
  };
}
