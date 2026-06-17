import OpenAI from "openai";
import { z } from "zod";

type ProjectInput = {
  title: string;
  status: string;
  progress: number;
  deadline: string | null;
  client: {
    name: string;
    company: string | null;
  };
};

type DeliverableInput = {
  id: string;
  title: string;
  status: string;
};

type ActivityInput = {
  id: string;
  message: string;
  createdAt: Date;
};

type ProjectSummaryResult = {
  summary: string;
  highlights: string[];
  source: "ai" | "fallback";
};

const aiSummarySchema = z.object({
  summary: z.string().min(1).max(1200),
  highlights: z.array(z.string().min(1).max(220)).min(3).max(5),
});

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function generateFallbackProjectSummary(
  project: ProjectInput,
  deliverables: DeliverableInput[],
  activity: ActivityInput[]
): ProjectSummaryResult {
  const totalDeliverables = deliverables.length;
  const approvedCount = deliverables.filter((d) => d.status === "APPROVED").length;
  const inReviewCount = deliverables.filter((d) => d.status === "IN_REVIEW").length;
  const revisionCount = deliverables.filter(
    (d) => d.status === "REVISION_REQUESTED"
  ).length;
  const draftCount = deliverables.filter((d) => d.status === "DRAFT").length;

  const recentActivity = activity.slice(0, 5);
  const latestActivity = recentActivity[0]?.message ?? "No recent activity yet.";

  const completionTone =
    project.progress >= 80
      ? "The project is in a strong late-stage position."
      : project.progress >= 40
      ? "The project is progressing steadily."
      : "The project is still in an early-to-mid execution stage.";

  const reviewTone =
    revisionCount > 0
      ? `There ${revisionCount === 1 ? "is" : "are"} ${revisionCount} deliverable${
          revisionCount === 1 ? "" : "s"
        } currently needing revision attention.`
      : inReviewCount > 0
      ? `There ${inReviewCount === 1 ? "is" : "are"} ${inReviewCount} deliverable${
          inReviewCount === 1 ? "" : "s"
        } actively under review.`
      : approvedCount === totalDeliverables && totalDeliverables > 0
      ? "All current deliverables have been approved."
      : "There are no urgent review blockers right now.";

  const deadlineTone = project.deadline
    ? `The current deadline is ${new Date(project.deadline).toLocaleDateString()}.`
    : "No deadline has been set yet.";

  const summary = `${project.title} for ${project.client.company || project.client.name} is currently ${project.status.toLowerCase()} with overall progress at ${project.progress}%. ${completionTone} There are ${totalDeliverables} deliverable${
    totalDeliverables === 1 ? "" : "s"
  } in this project, with ${approvedCount} approved, ${inReviewCount} in review, ${revisionCount} revision-requested, and ${draftCount} in draft. ${reviewTone} ${deadlineTone} The latest activity was: ${latestActivity}`;

  const highlights = [
    `Project status: ${project.status}`,
    `Progress: ${project.progress}%`,
    `Deliverables: ${totalDeliverables} total`,
    `Approved: ${approvedCount} · In Review: ${inReviewCount} · Revisions: ${revisionCount}`,
    `Latest activity: ${latestActivity}`,
  ];

  return {
    summary,
    highlights,
    source: "fallback",
  };
}

function buildProjectSummaryPrompt(
  project: ProjectInput,
  deliverables: DeliverableInput[],
  activity: ActivityInput[]
) {
  return JSON.stringify({
    project,
    deliverables: deliverables.map((deliverable) => ({
      title: deliverable.title,
      status: deliverable.status,
    })),
    recentActivity: activity.slice(0, 8).map((item) => ({
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function generateProjectSummary(
  project: ProjectInput,
  deliverables: DeliverableInput[],
  activity: ActivityInput[]
): Promise<ProjectSummaryResult> {
  const fallback = generateFallbackProjectSummary(project, deliverables, activity);
  const openai = getOpenAIClient();

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize client project health for an agency dashboard. Return only JSON with a concise summary and 3-5 practical highlights. Be specific, operational, and avoid hype.",
        },
        {
          role: "user",
          content: `Create a project summary from this data. JSON shape: {"summary": string, "highlights": string[]}. Data: ${buildProjectSummaryPrompt(
            project,
            deliverables,
            activity
          )}`,
        },
      ],
    });

    const content = completion.choices[0]?.message.content;

    if (!content) {
      return fallback;
    }

    const parsedJson = JSON.parse(content) as unknown;
    const parsed = aiSummarySchema.safeParse(parsedJson);

    if (!parsed.success) {
      console.error("AI summary response failed validation:", parsed.error.issues);
      return fallback;
    }

    return {
      ...parsed.data,
      source: "ai",
    };
  } catch (error) {
    console.error("AI summary generation failed; using fallback:", error);
    return fallback;
  }
}