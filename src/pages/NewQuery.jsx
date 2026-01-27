import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusPill from "@/components/janus/StatusPill";
import { Play, Zap } from "lucide-react";

const JANUS_PROMPT = `You are the Janus Blueprint Engine. Given a user query, you MUST produce a complete structured analysis following the mandatory pipeline in this EXACT order:
1. Refresh & Verification
2. Corpus
3. Cogito
4. Animus
5. Actus
6. Cross-Domain Synthesis
7. Blueprint

CRITICAL RULES:
- Domain skipping is PROHIBITED
- If something can't be done, declare it as a limitation and continue
- Output STRICT JSON ONLY - no markdown, no prose, no explanations
- The JSON must match the exact schema below

For Tier 0 Refresh (no external tools):
- attempted: false
- limitations: explicitly state "Not externally refreshed - analysis based on training data only"
- would_refresh: list 3-7 specific things you would verify if tools were available

COGITO RULES:
- Every claim MUST have an ID (C1, C2, etc.) and a tag: Established, Contested, or Speculative
- Include depends_on links when claims build on other claims

ACTUS CONFIDENCE INHERITANCE RULES:
- Every recommendation MUST reference depends_on_claims
- inherited_confidence MUST equal the LOWEST confidence among dependent claims
  (Speculative < Contested < Established)
- probability MUST match inherited_confidence:
  * Established → high or medium
  * Contested → medium or low
  * Speculative → low

SYNTHESIS RULE:
- Must happen AFTER all four domains
- Keep it structural and constraint-driven, no metaphors

OUTPUT SCHEMA (JSON only, no deviations):
{
  "refresh": {
    "mode": "tier0",
    "attempted": false,
    "limitations": "string",
    "would_refresh": ["string", ...]
  },
  "corpus": {
    "constraints": ["string", ...],
    "feasibility_notes": ["string", ...]
  },
  "cogito": {
    "claims": [
      { "id": "C1", "tag": "Established|Contested|Speculative", "text": "string", "depends_on": ["C0", ...] }
    ],
    "reasoning_map": ["string", ...]
  },
  "animus": {
    "boundary_checks": ["string", ...],
    "disallowed_moves": ["string", ...],
    "safety_notes": ["string", ...]
  },
  "actus": {
    "recommendations": [
      {
        "id": "A1",
        "text": "string",
        "depends_on_claims": ["C1", "C2", ...],
        "inherited_confidence": "Established|Contested|Speculative",
        "probability": "low|medium|high",
        "failure_modes": ["string", ...],
        "next_actions": ["string", ...]
      }
    ]
  },
  "synthesis": {
    "key_takeaways": ["string", ...],
    "constraint_collisions": ["string", ...],
    "limitation_foreground": "string"
  },
  "blueprint": {
    "goal": "string",
    "assumptions": ["string", ...],
    "steps": [
      {
        "step": 1,
        "title": "string",
        "instructions": "string",
        "inputs": ["string", ...],
        "outputs": ["string", ...],
        "validation": "string",
        "depends_on_steps": [0, ...]
      }
    ],
    "success_criteria": ["string", ...],
    "risk_register": [
      { "risk": "string", "impact": "low|med|high", "mitigation": "string" }
    ]
  }
}

USER QUERY:
`;

function generateMarkdown(data) {
  let md = "# Janus Blueprint Engine Output\n\n";
  
  md += "## 1. Refresh & Verification\n\n";
  md += `**Mode:** ${data.refresh?.mode || "tier0"}\n`;
  md += `**Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
  md += `**Limitations:** ${data.refresh?.limitations || "N/A"}\n\n`;
  if (data.refresh?.would_refresh?.length) {
    md += "**Would Verify:**\n";
    data.refresh.would_refresh.forEach(item => md += `- ${item}\n`);
  }
  md += "\n";

  md += "## 2. Corpus\n\n";
  if (data.corpus?.constraints?.length) {
    md += "**Constraints:**\n";
    data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`);
  }
  if (data.corpus?.feasibility_notes?.length) {
    md += "\n**Feasibility Notes:**\n";
    data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`);
  }
  md += "\n";

  md += "## 3. Cogito\n\n";
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

  md += "## 4. Animus\n\n";
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

  md += "## 5. Actus\n\n";
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

  md += "## 6. Cross-Domain Synthesis\n\n";
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

  md += "## 7. Blueprint\n\n";
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

  return md;
}

export default function NewQuery() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [outputMode, setOutputMode] = useState("Blueprint");
  const [refreshMode, setRefreshMode] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleExecute = async () => {
    if (!queryText.trim()) return;

    setStatus("running");
    setErrorMessage("");

    const fullPrompt = JANUS_PROMPT + queryText + `\n\nOutput Mode: ${outputMode}\n\nRespond with ONLY valid JSON, no other text.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          refresh: { type: "object" },
          corpus: { type: "object" },
          cogito: { type: "object" },
          animus: { type: "object" },
          actus: { type: "object" },
          synthesis: { type: "object" },
          blueprint: { type: "object" }
        },
        required: ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"]
      }
    });

    setStatus("validating");

    let parsedData;
    let rawJsonString;

    if (typeof result === "string") {
      rawJsonString = result;
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        setStatus("failed");
        setErrorMessage("VALIDATION FAILED: No valid JSON found in response.\n\nRaw output:\n" + result);
        return;
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } else {
      parsedData = result;
      rawJsonString = JSON.stringify(result, null, 2);
    }

    const requiredSections = ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"];
    const missingSections = requiredSections.filter(s => !parsedData[s]);

    if (missingSections.length > 0) {
      setStatus("failed");
      setErrorMessage(`VALIDATION FAILED: Missing required sections: ${missingSections.join(", ")}\n\nRaw output:\n${rawJsonString}`);
      return;
    }

    const renderMd = generateMarkdown(parsedData);

    const run = await base44.entities.Run.create({
      query_text: queryText,
      output_mode: outputMode,
      status: "completed",
      refresh: parsedData.refresh,
      corpus: parsedData.corpus,
      cogito: parsedData.cogito,
      animus: parsedData.animus,
      actus: parsedData.actus,
      synthesis: parsedData.synthesis,
      blueprint: parsedData.blueprint,
      raw_json: rawJsonString,
      render_md: renderMd
    });

    setStatus("completed");
    navigate(`/results?id=${run.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-slate-900" />
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Janus Blueprint Engine
            </h1>
          </div>
          <p className="text-slate-500 text-sm">CP-002 v1.5</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <Label htmlFor="query" className="text-sm font-medium text-slate-700 mb-2 block">
                Query
              </Label>
              <Textarea
                id="query"
                placeholder="Enter your natural-language query..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="min-h-[160px] text-base resize-none"
              />
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Refresh Mode
                </Label>
                <div className="flex items-center justify-between h-10 px-3 border border-slate-200 rounded-md bg-slate-50">
                  <span className="text-sm text-slate-600">Tier 0: No external refresh</span>
                  <Switch checked={refreshMode} onCheckedChange={setRefreshMode} disabled />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <StatusPill status={status} />
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
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-900 font-semibold mb-2">Validation Failed</h3>
            <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono bg-red-100 p-4 rounded-lg overflow-auto max-h-96">
              {errorMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}