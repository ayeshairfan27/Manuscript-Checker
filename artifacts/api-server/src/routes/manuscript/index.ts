import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { CheckManuscriptBody, CheckManuscriptResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getAnthropicClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
}

function buildSystemPrompt(submissionType: string, journalRequirements?: string | null): string {
  const typeLabel =
    submissionType === "structured-abstract"
      ? "Structured Abstract (Original Research)"
      : submissionType === "correspondence"
        ? "Correspondence / Letter to the Editor"
        : "Full Original Research Manuscript";

  const checksDescription =
    submissionType === "structured-abstract"
      ? `
- Background/Objective section: Is there a clear background or objective statement?
- Methods section: Is a methods section present and sufficiently described?
- Results section: Are results clearly reported?
- Conclusion section: Is a conclusion present and does it answer the objective?
- Word count: Is the word count appropriate for a structured abstract (typically 250-350 words)?
- Primary outcome: Is a clear primary outcome stated?`
      : submissionType === "correspondence"
        ? `
- Central argument: Is there a clear, focused central argument or point being made?
- Reference to prior article: Does the letter reference or respond to a specific published article?
- Author contribution statement: Is an author contribution statement present?
- Word count: Is the letter within the typical correspondence word limit (typically 300-400 words)?`
        : `
- Introduction: Is there a clear introduction with rationale and objective?
- Methods: Are the methods sufficiently described (design, population, outcomes, analysis)?
- Results: Are results presented clearly with appropriate data?
- Discussion: Is there a discussion that interprets findings and acknowledges limitations?
- Primary outcome: Is the primary outcome clearly defined and reported?
- Conflict of interest / Funding statement: Is there a conflict of interest disclosure and/or funding statement?
- Unsupported causal claims: Does the manuscript avoid overstating causality when evidence is only associative?`;

  const journalSection = journalRequirements
    ? `\n\nJOURNAL-SPECIFIC REQUIREMENTS (prioritize these above generic defaults):\n${journalRequirements}`
    : "";

  return `You are an expert scientific manuscript editor with 20+ years of experience reviewing submissions for top-tier medical and clinical journals. You have deep knowledge of ICMJE guidelines, structured reporting standards (CONSORT, STROBE, PRISMA), and journal submission requirements.

Your task is to analyze a ${typeLabel} and assess its readiness for journal submission.${journalSection}

Perform the following checks:${checksDescription}

Respond ONLY with a valid JSON object in exactly this structure (no markdown, no explanation outside the JSON):
{
  "summary": "<2-3 sentence overall readiness assessment>",
  "overallStatus": "<READY | NEEDS_REVISION | NOT_READY>",
  "checks": [
    {
      "name": "<check name>",
      "status": "<PASS | WARNING | FAIL>",
      "explanation": "<specific, actionable explanation — what was found and what to do>"
    }
  ]
}

Rules:
- overallStatus is READY only if all checks PASS. NEEDS_REVISION if there are WARNINGs but no FAILs. NOT_READY if any check FAILs.
- Each explanation must be specific to the actual submitted text, not generic advice.
- Be constructive and precise. If something is missing, say exactly what is missing and why it matters.
- Do not add any text before or after the JSON object.`;
}

router.post("/manuscript/check", async (req, res): Promise<void> => {
  const parsed = CheckManuscriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, submissionType, journalRequirements } = parsed.data;

  let anthropic: Anthropic;
  try {
    anthropic = getAnthropicClient();
  } catch (err) {
    req.log.error({ err }, "Anthropic client initialization failed");
    res.status(500).json({ error: "AI service is not configured. Please set ANTHROPIC_API_KEY." });
    return;
  }

  const systemPrompt = buildSystemPrompt(submissionType, journalRequirements);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Please analyze the following ${submissionType} for journal submission readiness:\n\n---\n${text}\n---`,
      },
    ],
    system: systemPrompt,
  });

  const firstBlock = message.content[0];
  if (!firstBlock || firstBlock.type !== "text") {
    req.log.error({ message }, "Unexpected Anthropic response format");
    res.status(500).json({ error: "Unexpected response format from AI service." });
    return;
  }

  let parsed_ai: unknown;
  try {
    parsed_ai = JSON.parse(firstBlock.text.trim());
  } catch {
    req.log.error({ text: firstBlock.text }, "Failed to parse AI JSON response");
    res.status(500).json({ error: "AI returned an unparseable response. Please try again." });
    return;
  }

  const result = CheckManuscriptResponse.safeParse({
    ...(parsed_ai as object),
    submissionType,
  });

  if (!result.success) {
    req.log.error({ error: result.error, ai_response: parsed_ai }, "AI response failed schema validation");
    res.status(500).json({ error: "AI response did not match expected format. Please try again." });
    return;
  }

  res.json(result.data);
});

export default router;
