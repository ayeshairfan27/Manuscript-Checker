/**
 * Extracts a JSON object from an LLM response.
 *
 * Models sometimes add a short preamble, markdown fences, or a trailing
 * sentence even when explicitly asked for JSON. This parser keeps the normal
 * JSON.parse path fast, then tries the common recoverable variants.
 */
export function parseJsonObjectResponse(rawResponse: string): unknown {
  const normalized = rawResponse
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  const candidates: string[] = [];
  const fencedPattern = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
  for (const match of normalized.matchAll(fencedPattern)) {
    if (match[1]) candidates.push(match[1].trim());
  }
  candidates.push(normalized.trim());

  for (const candidate of candidates) {
    const direct = tryParse(candidate);
    if (direct !== undefined) return direct;

    for (const objectText of extractBalancedObjects(candidate)) {
      const parsed = tryParse(objectText);
      if (parsed !== undefined) return parsed;

      const repaired = repairCommonJsonIssues(objectText);
      const repairedResult = tryParse(repaired);
      if (repairedResult !== undefined) return repairedResult;
    }
  }

  throw new Error("No valid JSON object found in AI response");
}

function tryParse(value: string): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Finds every balanced {...} range while respecting braces inside strings.
 * Returning every range lets the caller recover if a preamble contains an
 * unrelated object before the actual response.
 */
function extractBalancedObjects(value: string): string[] {
  const objects: string[] = [];

  for (let start = 0; start < value.length; start += 1) {
    if (value[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < value.length; index += 1) {
      const character = value[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          objects.push(value.slice(start, index + 1));
          break;
        }
      }
    }
  }

  return objects;
}

function repairCommonJsonIssues(value: string): string {
  return value
    // A frequent model error: a comma immediately before } or ].
    .replace(/,\s*([}\]])/g, "$1")
    // Another frequent error: object keys are not quoted.
    .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3');
}