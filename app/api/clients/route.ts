import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInternalAccess } from "@/lib/guards";
import { parseJsonBody } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required.").max(120),
  email: z.string().trim().email("Enter a valid client email.").max(160),
  company: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "LEAD"]).default("ACTIVE"),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET() {
  const result = await requireInternalAccess();

  try {
    const clients = await prisma.client.findMany({
      where: {
        workspaceId: result.workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error("Failed to fetch clients:", error);

    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const result = await requireInternalAccess();

  try {
    const limited = await rateLimit(request, {
      key: "client-create",
      identifier: rateLimitKey(result.user.id, result.workspace.id),
      limit: 20,
      window: "10 m",
      message: "Too many client creation attempts. Please try again shortly.",
    });

    if (limited) {
      return limited;
    }

    const parsed = await parseJsonBody(request, createClientSchema);

    if (!parsed.success) {
      return parsed.response;
    }

    const { name, status } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();
    const company = parsed.data.company?.trim() || null;
    const notes = parsed.data.notes?.trim() || null;

    const existingClient = await prisma.client.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: result.workspace.id,
          email,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email already exists." },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        workspaceId: result.workspace.id,
        name,
        email,
        company,
        status,
        notes,
      },
    });

    return NextResponse.json(
      {
        message: "Client created successfully.",
        client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create client:", error);

    return NextResponse.json(
      { error: "Failed to create client." },
      { status: 500 }
    );
  }
}