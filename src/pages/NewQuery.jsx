import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusPill from "@/components/janus/StatusPill";
import { Play, Zap, Info, Wrench } from "lucide-react";
import { EXECUTION_MODES, validateJanusOutput, JANUS_SCHEMA } from "@/components/janus/janusSchema";

function buildPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  let prompt = `You are the Janus Blueprint Engine (CP-002 v1.5). 

EXECUTION MODE: ${mode.label} (${mode.description})
BLUEPRINT LEVEL: ${blueprintLevel}
NOVELTY DIAL: ${noveltyDial}

CRITICAL RULES:
1. Output STRICT JSON ONLY - no markdown, no prose, no explanations
2. Include ONLY these domains: ${domains.join(", ")}
3. Follow domain order strictly
4. If something can't be done, declare it as a limitation and continue
5. High novelty MUST still obey Corpus constraints and Animus disallowed moves

`;

  // Refresh domain (only if included)
  if (domains.includes("refresh")) {
    if (refreshEnabled) {
      prompt += `
REFRESH & VERIFICATION (Tier 1 - Limited):
- mode: "tier1"
- attempted: true
- Use add_context_from_internet if absolutely critical
- Keep web searches minimal to conserve credits
- would_refresh: list 3-5 items you would verify with unlimited budget
`;
    } else {
      prompt += `
REFRESH & VERIFICATION (Tier 0 - No External Refresh):
- mode: "tier0"
- attempted: false
- limitations: "Not externally refreshed - analysis based on training data only"
- would_refresh: list 3-7 specific things you would verify if tools were available
`;
    }
  }

  // Corpus (always required)
  prompt += `
CORPUS:
- constraints: list real-world limitations, resource constraints, dependencies
- feasibility_notes: practical considerations

`;

  // Cogito (always required)
  prompt += `
COGITO (Claims & Reasoning with Evidence Discipline):
- Every claim MUST have:
  * id: "C1", "C2", etc.
  * tag: MUST be exactly one of: "Established", "Contested", "Speculative"
  * text: the claim statement
  * depends_on: array of claim IDs this builds on (can be empty)
  * why_believed: what makes this claim credible (evidence, logic, precedent)
  * falsifiable_by: what evidence would prove this claim wrong
  * verify_later: what should be verified/tested when possible
- reasoning_map: logical flow as strings

`;

  // Animus
  if (domains.includes("animus")) {
    prompt += `
ANIMUS (Boundaries & Safety):
- boundary_checks: ethical/legal/safety boundaries
- disallowed_moves: prohibited actions
- safety_notes: risk mitigations

`;
  }

  // Actus
  if (domains.includes("actus")) {
    prompt += `
ACTUS (Recommendations):
CONFIDENCE INHERITANCE RULE (CRITICAL):
- Every recommendation MUST reference depends_on_claims (array of claim IDs)
- inherited_confidence MUST equal the LOWEST confidence tag among those claims
  * If any dependent claim is "Speculative" → inherited_confidence = "Speculative"
  * If no Speculative but has "Contested" → inherited_confidence = "Contested"  
  * If all are "Established" → inherited_confidence = "Established"
- probability: "low" | "medium" | "high" (matches confidence level)
- failure_modes: potential failure scenarios
- next_actions: concrete next steps

`;
  }

  // Synthesis
  if (domains.includes("synthesis")) {
    prompt += `
SYNTHESIS (Cross-Domain):
- key_takeaways: structural insights from all domains
- constraint_collisions: conflicting requirements
- limitation_foreground: overall limitations

`;
  }

  // Blueprint (always required)
  const requireAlternatives = executionMode === "full" && noveltyDial === "high";
  
  prompt += `
BLUEPRINT (Level ${blueprintLevel}, Novelty: ${noveltyDial}):
- goal: clear objective
- assumptions: foundational assumptions
${requireAlternatives ? `- alternative_approaches: REQUIRED - list 3+ alternative approaches with:
  * name: approach name
  * pros: advantages (2-4 items)
  * cons: disadvantages (2-4 items)
  * why_not_chosen: reason for not selecting this approach
` : ""}
- steps: sequential actions with:
  * step: number
  * title: short title
  * instructions: detailed what/how
  * inputs: required inputs
  * outputs: expected outputs
  * validation: how to verify success
  * depends_on_steps: prerequisite step numbers
${blueprintLevel !== "L1" ? `  * time_estimate: realistic time estimate (e.g., "2-3 hours", "1-2 weeks")
  * effort_level: "low" | "medium" | "high"
` : ""}
${blueprintLevel === "L2" || blueprintLevel === "L3" ? `  * substeps: array of {substep: string, details: string} breaking down the step
` : ""}
${blueprintLevel === "L3" ? `  * checklist: array of completion checklist items
  * acceptance_tests: array of tests to verify the step worked
` : ""}
- success_criteria: measurable outcomes
- risk_register: {risk, impact: "low"|"med"|"high", mitigation}

OUTPUT MODE: ${outputMode}

USER QUERY:
`;

  return prompt;
}

function generateMarkdown(data, executionMode) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  let md = `# Janus Blueprint Engine Output\n\n**Mode:** ${mode.label}\n\n`;

  if (domains.includes("refresh") && data.refresh) {
    md += "## 1. Refresh & Verification\n\n";
    md += `**Mode:** ${data.refresh?.mode || "tier0"}\n`;
    md += `**Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
    md += `**Limitations:** ${data.refresh?.limitations || "N/A"}\n\n`;
    if (data.refresh?.would_refresh?.length) {
      md += "**Would Verify:**\n";
      data.refresh.would_refresh.forEach(item => md += `- ${item}\n`);
    }
    md += "\n";
  }

  if (data.corpus) {
    md += "## Corpus\n\n";
    if (data.corpus?.constraints?.length) {
      md += "**Constraints:**\n";
      data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`);
    }
    if (data.corpus?.feasibility_notes?.length) {
      md += "\n**Feasibility Notes:**\n";
      data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`);
    }
    md += "\n";
  }

  if (data.cogito) {
    md += "## Cogito\n\n";
    if (data.cogito?.claims?.length) {
      md += "**Claims:**\n\n";
      data.cogito.claims.forEach(claim => {
        md += `### ${claim.id} [${claim.tag}]\n`;
        md += `${claim.text}\n`;
        if (claim.depends_on?.length) {
          md += `*Depends on: ${claim.depends_on.join(", ")}*\n`;
        }
        md += "\n";
      });
    }
    if (data.cogito?.reasoning_map?.length) {
      md += "**Reasoning Map:**\n";
      data.cogito.reasoning_map.forEach(r => md += `- ${r}\n`);
    }
    md += "\n";
  }

  if (domains.includes("animus") && data.animus) {
    md += "## Animus\n\n";
    if (data.animus?.boundary_checks?.length) {
      md += "**Boundary Checks:**\n";
      data.animus.boundary_checks.forEach(b => md += `- ${b}\n`);
    }
    if (data.animus?.disallowed_moves?.length) {
      md += "\n**Disallowed Moves:**\n";
      data.animus.disallowed_moves.forEach(d => md += `- ⛔ ${d}\n`);
    }
    if (data.animus?.safety_notes?.length) {
      md += "\n**Safety Notes:**\n";
      data.animus.safety_notes.forEach(s => md += `- ⚠️ ${s}\n`);
    }
    md += "\n";
  }

  if (domains.includes("actus") && data.actus) {
    md += "## Actus\n\n";
    if (data.actus?.recommendations?.length) {
      md += "**Recommendations:**\n\n";
      data.actus.recommendations.forEach(rec => {
        md += `### ${rec.id} [${rec.inherited_confidence}] - ${rec.probability} probability\n`;
        md += `${rec.text}\n\n`;
        md += `*Based on: ${rec.depends_on_claims?.join(", ") || "N/A"}*\n\n`;
        if (rec.failure_modes?.length) {
          md += "**Failure Modes:**\n";
          rec.failure_modes.forEach(f => md += `- ${f}\n`);
        }
        if (rec.next_actions?.length) {
          md += "\n**Next Actions:**\n";
          rec.next_actions.forEach(a => md += `- ${a}\n`);
        }
        md += "\n";
      });
    }
  }

  if (domains.includes("synthesis") && data.synthesis) {
    md += "## Cross-Domain Synthesis\n\n";
    if (data.synthesis?.key_takeaways?.length) {
      md += "**Key Takeaways:**\n";
      data.synthesis.key_takeaways.forEach((t, i) => md += `${i + 1}. ${t}\n`);
    }
    if (data.synthesis?.constraint_collisions?.length) {
      md += "\n**Constraint Collisions:**\n";
      data.synthesis.constraint_collisions.forEach(c => md += `- ⚠️ ${c}\n`);
    }
    if (data.synthesis?.limitation_foreground) {
      md += `\n**Limitations:** ${data.synthesis.limitation_foreground}\n`;
    }
    md += "\n";
  }

  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint?.goal) {
      md += `**Goal:** ${data.blueprint.goal}\n\n`;
    }
    if (data.blueprint?.assumptions?.length) {
      md += "**Assumptions:**\n";
      data.blueprint.assumptions.forEach(a => md += `- ${a}\n`);
      md += "\n";
    }
    if (data.blueprint?.steps?.length) {
      md += "### Steps\n\n";
      data.blueprint.steps.forEach(step => {
        md += `#### Step ${step.step}: ${step.title}\n`;
        md += `${step.instructions}\n\n`;
        if (step.inputs?.length) md += `**Inputs:** ${step.inputs.join(", ")}\n`;
        if (step.outputs?.length) md += `**Outputs:** ${step.outputs.join(", ")}\n`;
        if (step.validation) md += `**Validation:** ${step.validation}\n`;
        if (step.depends_on_steps?.length) md += `*Depends on: Steps ${step.depends_on_steps.join(", ")}*\n`;
        md += "\n";
      });
    }
    if (data.blueprint?.success_criteria?.length) {
      md += "### Success Criteria\n";
      data.blueprint.success_criteria.forEach(c => md += `- ✅ ${c}\n`);
      md += "\n";
    }
    if (data.blueprint?.risk_register?.length) {
      md += "### Risk Register\n\n";
      md += "| Risk | Impact | Mitigation |\n";
      md += "|------|--------|------------|\n";
      data.blueprint.risk_register.forEach(r => {
        md += `| ${r.risk} | ${r.impact} | ${r.mitigation} |\n`;
      });
    }
  }

  return md;
}

export default function NewQuery() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [executionMode, setExecutionMode] = useState("standard");
  const [outputMode, setOutputMode] = useState("Blueprint");
  const [blueprintLevel, setBlueprintLevel] = useState("L2");
  const [noveltyDial, setNoveltyDial] = useState("medium");
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleExecute = async () => {
    if (!queryText.trim()) return;

    setStatus("running");
    setErrorMessage("");

    const mode = EXECUTION_MODES[executionMode.toUpperCase()];
    const fullPrompt = buildPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) + queryText;

    let result;
    try {
      // Build detailed schema with proper structure for each domain
      const responseSchema = {
        type: "object",
        properties: Object.fromEntries(
          mode.domains.map(d => [d, JANUS_SCHEMA.properties[d]])
        ),
        required: mode.domains
      };

      result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: refreshEnabled && mode.domains.includes("refresh"),
        response_json_schema: responseSchema
      });
    } catch (err) {
      await base44.entities.Run.create({
        query_text: queryText,
        full_prompt: fullPrompt,
        execution_mode: executionMode,
        output_mode: outputMode,
        blueprint_level: blueprintLevel,
        novelty_dial: noveltyDial,
        refresh_enabled: refreshEnabled,
        status: "failed",
        error_message: `LLM call failed: ${err.message || err}`,
        raw_json: JSON.stringify(err)
      });
      setStatus("failed");
      setErrorMessage(`LLM ERROR: ${err.message || err}`);
      return;
    }

    setStatus("validating");

    let parsedData;
    let rawJsonString;

    if (typeof result === "string") {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedData = JSON.parse(jsonMatch[0]);
        rawJsonString = jsonMatch[0];
      } catch (e) {
        await base44.entities.Run.create({
          query_text: queryText,
          full_prompt: fullPrompt,
          execution_mode: executionMode,
          output_mode: outputMode,
          blueprint_level: blueprintLevel,
          novelty_dial: noveltyDial,
          refresh_enabled: refreshEnabled,
          status: "failed",
          error_message: "Failed to parse JSON from LLM response",
          raw_json: result
        });
        setStatus("failed");
        setErrorMessage("PARSE ERROR: Could not extract valid JSON.\n\n" + result);
        return;
      }
    } else {
      parsedData = result;
      rawJsonString = JSON.stringify(result, null, 2);
    }

    // Validate against schema
    const validation = validateJanusOutput(parsedData, mode.domains);

    if (!validation.valid) {
      const run = await base44.entities.Run.create({
        query_text: queryText,
        full_prompt: fullPrompt,
        execution_mode: executionMode,
        output_mode: outputMode,
        blueprint_level: blueprintLevel,
        novelty_dial: noveltyDial,
        refresh_enabled: refreshEnabled,
        status: "failed",
        validation_errors: validation.errors,
        error_message: validation.errors.join("\n"),
        raw_json: rawJsonString
      });
      setStatus("failed");
      setErrorMessage("VALIDATION FAILED:\n\n" + validation.errors.join("\n") + "\n\nRaw JSON:\n" + rawJsonString);
      navigate(`/results?id=${run.id}`);
      return;
    }

    const renderMd = generateMarkdown(parsedData, executionMode);

    const runData = {
      query_text: queryText,
      full_prompt: fullPrompt,
      execution_mode: executionMode,
      output_mode: outputMode,
      blueprint_level: blueprintLevel,
      novelty_dial: noveltyDial,
      refresh_enabled: refreshEnabled,
      status: "completed",
      raw_json: rawJsonString,
      render_md: renderMd
    };

    // Add domains that were generated
    mode.domains.forEach(domain => {
      if (parsedData[domain]) {
        runData[domain] = parsedData[domain];
      }
    });

    const run = await base44.entities.Run.create(runData);

    setStatus("completed");
    navigate(`/results?id=${run.id}`);
  };

  const showRefreshToggle = executionMode === "full";

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-mono">
          <span className="font-semibold">New Query route mounted ✅</span> | Path: {window.location.pathname}
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-slate-900" />
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Janus Blueprint Engine
            </h1>
          </div>
          <p className="text-slate-500 text-sm">CP-002 v1.5</p>
          {(new URLSearchParams(window.location.search).get('debug') === '1') && (
            <div className="mt-3 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 font-mono text-xs text-slate-600">
              <div><strong>Route:</strong> {window.location.pathname}</div>
              <div><strong>Registered:</strong> /new-query, /history, /results, /diagnostics</div>
            </div>
          )}
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-2xl">
          <div className="space-y-6">
            <div>
              <Label htmlFor="query" className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 block">
                Query
              </Label>
              <Textarea
                id="query"
                placeholder="Enter your natural-language query..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="min-h-[160px] text-base resize-none backdrop-blur-sm bg-white/50 dark:bg-black/30 border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3 block">
                Execution Mode
              </Label>
              <RadioGroup value={executionMode} onValueChange={setExecutionMode}>
                <div className="space-y-3">
                  {Object.values(EXECUTION_MODES).map(mode => (
                    <div key={mode.id} className="flex items-center space-x-3 backdrop-blur-md bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 rounded-xl p-3 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
                      <RadioGroupItem value={mode.id} id={mode.id} />
                      <label htmlFor={mode.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-slate-900 dark:text-white">{mode.label}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{mode.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="output-mode" className="text-sm font-medium text-slate-700 mb-2 block">
                  Output Mode
                </Label>
                <Select value={outputMode} onValueChange={setOutputMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blueprint">Blueprint</SelectItem>
                    <SelectItem value="Research Plan">Research Plan</SelectItem>
                    <SelectItem value="Product Spec">Product Spec</SelectItem>
                    <SelectItem value="Technical Architecture">Technical Architecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="blueprint-level" className="text-sm font-medium text-slate-700 mb-2 block">
                  Blueprint Level
                </Label>
                <Select value={blueprintLevel} onValueChange={setBlueprintLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">L1 - Simple (3-7 steps)</SelectItem>
                    <SelectItem value="L2">L2 - Detailed (substeps, estimates)</SelectItem>
                    <SelectItem value="L3">L3 - Complete (checklists, tests)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="novelty-dial" className="text-sm font-medium text-slate-700 mb-2 block">
                  Novelty Level
                </Label>
                <Select value={noveltyDial} onValueChange={setNoveltyDial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Conservative</SelectItem>
                    <SelectItem value="medium">Medium - Balanced</SelectItem>
                    <SelectItem value="high">High - Innovative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showRefreshToggle && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    External Refresh
                  </Label>
                  <div className="flex items-center justify-between h-10 px-3 border border-slate-200 rounded-md bg-slate-50">
                    <span className="text-sm text-slate-600">Use credits for web search</span>
                    <Switch checked={refreshEnabled} onCheckedChange={setRefreshEnabled} />
                  </div>
                  {refreshEnabled && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Limited refresh to conserve credits
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <StatusPill status={status} />
                <Link to="/diagnostics">
                  <Button variant="ghost" size="sm">
                    <Wrench className="w-3 h-3 mr-1" />
                    Diagnostics
                  </Button>
                </Link>
              </div>
              <Button
                onClick={handleExecute}
                disabled={!queryText.trim() || status === "running" || status === "validating"}
                className="px-6"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Janus
              </Button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 backdrop-blur-xl bg-red-100/60 dark:bg-red-900/40 border border-red-300/50 dark:border-red-500/30 rounded-2xl p-6 shadow-xl">
            <h3 className="text-red-900 dark:text-red-200 font-semibold mb-2">Validation Failed</h3>
            <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono bg-red-50/60 dark:bg-red-950/40 p-4 rounded-lg overflow-auto max-h-96">
              {errorMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}