import { NextResponse } from "next/server";
import { z } from "zod";

type ParseJsonResult<TSchema extends z.ZodType> =
  | {
      success: true;
      data: z.infer<TSchema>;
    }
  | {
      success: false;
      response: NextResponse;
    };

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema
): Promise<ParseJsonResult<TSchema>> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(json);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Invalid request body.",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
