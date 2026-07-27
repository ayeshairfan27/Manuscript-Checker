# ManuscriptReady

**An AI-powered pre-submission readiness checker for medical research manuscripts and abstracts.**

## The Problem

Research-active medical students and trainees frequently prepare manuscripts, abstracts, and correspondence pieces for journal submission without a mentor available to give a final check before hitting submit. It's easy to miss a required section, exceed a word limit, forget an author contribution statement, or accidentally use language that overclaims what the data actually supports — issues that lead to desk rejections or requests for revision that could have been caught earlier.

**ManuscriptReady** solves this by giving an instant, structured pre-submission audit — built specifically for medical students, residents, and researchers who need a fast sanity check before they submit.

## Live App

🔗 **[https://manuscript-checker--ayeshairfan27.replit.app](https://manuscript-checker--ayeshairfan27.replit.app)**

## Features

- Paste any manuscript or abstract text directly into the app — no file upload required
- Choose the submission type you're preparing:
  - Structured Abstract (Original Research)
  - Correspondence / Letter to the Editor
  - Full Original Research Manuscript
- **Optional: paste your target journal's specific requirements** (e.g. exact word limits, required sections, specific author contribution taxonomy). When provided, the AI check prioritizes these exact rules over generic defaults — making the tool adaptable to any journal, not just a fixed template.
- One-click AI-powered readiness check that returns:
  - An overall readiness summary
  - A detailed checklist, with each item marked **Pass / Warning / Fail**
  - A specific, actionable explanation for every item — not vague praise, but concrete direction on what to fix
- Checks cover: required structural sections for the chosen submission type, approximate word count against typical/specified limits, presence of conflict-of-interest or funding statements, presence of author contribution statements, and flags for overclaimed or unsupported causal language relative to the described study design
- Clean, responsive interface with loading and error states
- Fully stateless — no login, no saved history, nothing to break

## The AI Feature

**What it does:** Takes the pasted manuscript/abstract text, the selected submission type, and (optionally) journal-specific instructions, and returns a structured JSON checklist rather than a vague paragraph — so the output reads like an actual pre-submission audit.

**System prompt used:**

```
You are a manuscript submission readiness reviewer for medical journals, reviewing on
behalf of a research-active medical trainee before they submit.

You will receive:
1. A submission type: one of "structured_abstract", "correspondence", or "original_research".
2. The full text of the manuscript or abstract.
3. Optionally, the target journal's specific instructions (word limits, required sections,
   required statements). If provided, these SPECIFIC instructions take priority over the
   generic defaults below — check against them directly instead of (or in addition to) the
   generic rules.

Your job is to check the text against the requirements and return ONLY a JSON object, no
preamble, no markdown code fences, no explanation outside the JSON, in exactly this shape:
{
  "overall_summary": "<1-2 sentence overall verdict>",
  "checks": [
    {"label": "<short check name>", "status": "pass|warn|fail", "detail": "<specific,
      actionable explanation, including a concrete suggestion for how to fix it if not a pass>"}
  ]
}

GENERIC DEFAULTS (use only when the user has not supplied specific journal instructions
covering that item):

For "structured_abstract": check for Background/Objective, Methods, Results, and Conclusion
sections; approximate word count against a typical 250-300 word limit; presence of a clearly
stated primary outcome.

For "correspondence": check for a clear central argument or critique; explicit reference to
the article being responded to; an author contribution statement; word count against a
typical 400-600 word limit for letters to the editor.

For "original_research": check for IMRaD structure (Introduction, Methods, Results,
Discussion); a clearly stated primary outcome; a conflict of interest / funding statement;
flag any causal language that is not supported by the described study design (e.g., causal
claims from an observational or cross-sectional design).

RULES:
- If specific journal instructions are provided, generate checks directly from those
  instructions (e.g., if they specify a 250 word limit, check against 250, not the generic
  default). You may still include generic checks for anything the journal instructions
  don't cover.
- Flag unsupported or overclaimed language explicitly as a "warn" or "fail" item. Describe
  the issue in your own words — do not quote the manuscript verbatim beyond a few words.
- Be specific and actionable in every "detail" field. Never give vague praise like "looks
  good" — always say what was found or what to do next.
- Do not fabricate an exact word count you cannot calculate precisely — give a reasonable
  estimate based on the text length and say "approximately."
- If a required section or statement is entirely absent, mark it "fail". If present but
  weak, incomplete, or unclear, mark it "warn". Only mark "pass" when the requirement is
  clearly and fully met.
- Do not rewrite or fix the manuscript. Only point out issues and describe what should be
  changed — do not produce replacement text for the manuscript itself.
- Do not add checks beyond what is implied by the submission type and any provided journal
  instructions.
```

**Important limitation, stated honestly:** this tool checks against general conventions for each submission type (or against journal instructions you paste in yourself) — it does not have a built-in database of every journal's exact requirements. Always confirm final formatting against your target journal's official author guidelines before submitting.

## Tools, Services, and AI Models Used

- **App builder:** Replit (Replit Agent for initial scaffolding, refined manually)
- **AI model / provider:** Groq API (OpenAI-compatible endpoint) running **Llama 3.3 70B Versatile**
- **Hosting / deployment:** Replit Deployments (public)
- **Version control:** GitHub (public repository)
- **API key handling:** stored securely as a Replit Secret / environment variable, never committed to source control

## Screenshots


### Home / Landing Screen

<img width="1918" height="890" alt="image" src="https://github.com/user-attachments/assets/e84600e6-0c36-481e-9c5b-4117252e3e5f" />

<img width="1915" height="888" alt="image" src="https://github.com/user-attachments/assets/062d00fa-a012-4337-b786-25811078d3c5" />

### Input Form

<img width="1915" height="884" alt="image" src="https://github.com/user-attachments/assets/0ed6ff70-6e0a-455e-b965-a035fe8b1fc8" />

<img width="1907" height="880" alt="image" src="https://github.com/user-attachments/assets/be7d8c6d-e6ae-498e-8ec6-53aa56c87709" />

### Results

<img width="1918" height="880" alt="image" src="https://github.com/user-attachments/assets/b6f6d994-7482-4691-a6f0-022349fc6f70" />

<img width="1910" height="896" alt="image" src="https://github.com/user-attachments/assets/5fd41c13-7f02-4594-8122-5785a58cc613" />

<img width="1906" height="883" alt="image" src="https://github.com/user-attachments/assets/2e61ec0f-3875-4504-959a-bd58d0ff0d46" />

```

## How to Run This Project

1. Clone the repository:
   ```
   git clone https://github.com/ayeshairfan27/Manuscript-Checker.git
   ```
2. Install dependencies (see `package.json` for the exact package manager used):
   ```
   pnpm install
   ```
3. Set up your environment variable for the AI API key (e.g. `GROQ_API_KEY`) — do not hardcode it in any file.
4. Run the app locally using the project's start command (see `package.json` scripts).
5. Open the app in your browser, paste a manuscript or abstract, select a submission type, and click **Check Submission Readiness**.

Alternatively, use the live deployed version directly — no setup required:
**[https://manuscript-checker--ayeshairfan27.replit.app](https://manuscript-checker--ayeshairfan27.replit.app)**

---

*Built as a final project — an AI-powered tool designed around a real gap experienced while preparing manuscripts and abstracts for journal submission as a research-active medical student at Dow Medical College, Karachi.*
