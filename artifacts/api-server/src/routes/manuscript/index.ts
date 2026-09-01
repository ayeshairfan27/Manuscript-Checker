import { Router, type IRouter } from "express";
import { CheckManuscriptBody, CheckManuscriptResponse } from "@workspace/api-zod";
import { runCompletion } from "../../lib/ai-provider";
import { parseJsonObjectResponse } from "../../lib/ai-response";

const router: IRouter = Router();

/** Count words the same way most word processors do. */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function buildSystemPrompt(
  submissionType: string,
  wordCount: number,
  journalRequirements?: string | null,
): string {
  const typeLabel =
    submissionType === "structured-abstract"
      ? "Structured Abstract (Original Research)"
      : submissionType === "correspondence"
        ? "Correspondence / Letter to the Editor"
        : "Full Original Research Manuscript";

  // Journal requirements section — placed FIRST so it overrides everything below.
  const journalSection = journalRequirements
    ? `\n\nJOURNAL-SPECIFIC REQUIREMENTS — these take full priority over every generic default below. For any check covered by these requirements, apply the journal's rule exactly and ignore the generic guidance:
${journalRequirements}\n`
    : "";

  // Generic word-count guidance used only when no journal requirement specifies a limit.
  const genericWordCountGuidance =
    submissionType === "structured-abstract"
      ? "typically 250–350 words"
      : submissionType === "correspondence"
        ? "typically 300–400 words"
        : "typically 3,000–5,000 words for the main body";

  const checksDescription =
    submissionType === "structured-abstract"
      ? `
- Background/Objective: Is there a clear background or objective statement?
- Methods: Is a methods section present and sufficiently described?
- Results: Are results clearly reported with data?
- Conclusion: Is a conclusion present and does it answer the objective?
- Word count: The manuscript contains exactly ${wordCount} words (calculated by the server — do NOT re-estimate). Apply the following logic in strict order:
    1. If journal-specific requirements specify a word limit (e.g. "maximum 250 words", "up to 300 words", "≤250 words"), use that limit: PASS if ${wordCount} ≤ limit, FAIL if ${wordCount} > limit.
    2. If no journal word limit is specified, use the generic guidance (${genericWordCountGuidance}): PASS if within range, WARNING if slightly outside.
    Your explanation must state the exact count (${wordCount} words) and the limit being applied.
- Primary outcome: Is a clear primary outcome stated?`
      : submissionType === "correspondence"
        ? `
- Central argument: Is there a clear, focused central argument or point?
- Reference to prior article: Does the letter reference or respond to a specific published article?
- Author contribution statement: Is an author contribution statement present?
- Word count: The manuscript contains exactly ${wordCount} words (calculated by the server — do NOT re-estimate). Apply the following logic in strict order:
    1. If journal-specific requirements specify a word limit, use that limit: PASS if ${wordCount} ≤ limit, FAIL if ${wordCount} > limit.
    2. If no journal word limit is specified, use the generic guidance (${genericWordCountGuidance}): PASS if within range, WARNING if slightly outside.
    Your explanation must state the exact count (${wordCount} words) and the limit being applied.`
        : `
- Introduction: Is there a clear introduction with rationale and objective?
- Methods: Are the methods described (design, population, outcomes, analysis)?
- Results: Are results presented clearly with appropriate data?
- Discussion: Is there a discussion that interprets findings and acknowledges limitations?
- Primary outcome: Is the primary outcome clearly defined and reported?
- Conflict of interest / Funding statement: Is there a COI disclosure and/or funding statement?
- Unsupported causal claims: Does the manuscript avoid overstating causality when evidence is only associative?
- Word count: The manuscript contains exactly ${wordCount} words (calculated by the server — do NOT re-estimate). Apply the following logic in strict order:
    1. If journal-specific requirements specify a word limit, use that limit: PASS if ${wordCount} ≤ limit, FAIL if ${wordCount} > limit.
    2. If no journal word limit is specified, use the generic guidance (${genericWordCountGuidance}): PASS if within range, WARNING if slightly outside.
    Your explanation must state the exact count (${wordCount} words) and the limit being applied.`;

  return `You are an expert scientific manuscript editor with 20+ years of experience reviewing submissions for top-tier medical and clinical journals. You have deep knowledge of ICMJE guidelines, structured reporting standards (CONSORT, STROBE, PRISMA), and journal submission requirements.

Your task is to analyze a ${typeLabel} and assess its readiness for journal submission.${journalSection}
Perform the following checks for this submission type:${checksDescription}

IMPORTANT OUTPUT FORMAT: Respond with ONLY one valid JSON object. Do not use markdown or code fences. Do not write any preamble, explanation, or trailing text. The response must be parseable by JSON.parse and must match this exact structure:
{
  "summary": "<2-3 sentence overall readiness assessment>",
  "overallStatus": "<READY | NEEDS_REVISION | NOT_READY>",
  "checks": [
    {
      "name": "<check name>",
      "status": "<PASS | WARNING | FAIL>",
      "explanation": "<specific, actionable explanation grounded in the actual submitted text>"
    }
  ]
}

Rules:
- overallStatus is READY only when every check is PASS.
- overallStatus is NEEDS_REVISION when there are WARNINGs but no FAILs.
- overallStatus is NOT_READY when any check FAILs.
- Each explanation must be specific to the submitted text — cite actual missing or present elements.
- Be constructive and precise. If something is missing, state exactly what is missing and why it matters for submission.
- Return valid JSON only, with double-quoted keys and string values. Do not include trailing commas.
- Output the JSON object and nothing else.`;
}

router.post("/manuscript/check", async (req, res): Promise<void> => {
  const parsed = CheckManuscriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, submissionType, journalRequirements } = parsed.data;

  const wordCount = countWords(text);
  const systemPrompt = buildSystemPrompt(submissionType, wordCount, journalRequirements);
  const userMessage = `Please analyze the following ${submissionType} for journal submission readiness. It contains exactly ${wordCount} words.\n\n---\n${text}\n---`;

  let rawText: string;
  try {
    rawText = await runCompletion(systemPrompt, userMessage);
  } catch (err) {
    req.log.error({ err }, "AI provider call failed");
    const message = err instanceof Error ? err.message : "AI service call failed";
    res.status(500).json({ error: message });
    return;
  }

  let aiResponse: unknown;
  try {
    aiResponse = parseJsonObjectResponse(rawText);
  } catch (err) {
    // Keep enough of the provider response to diagnose model formatting
    // issues, while bounding log size and never logging the API key.
    req.log.error(
      {
        err,
        responseLength: rawText.length,
        rawResponsePreview: rawText.slice(0, 12000),
      },
      "Failed to extract JSON object from AI response",
    );
    res.status(500).json({ error: "AI returned an unparseable response. Please try again." });
    return;
  }

  const result = CheckManuscriptResponse.safeParse({
    ...(aiResponse as object),
    submissionType,
  });

  if (!result.success) {
    req.log.error({ error: result.error, aiResponse }, "AI response failed schema validation");
    res.status(500).json({ error: "AI response did not match the expected format. Please try again." });
    return;
  }

  res.json(result.data);
});

export default router;
