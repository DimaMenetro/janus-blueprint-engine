import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalError } from '../../shared/errorResponse.ts';

// LIVE REFRESH RETRIEVAL (CP-002 §7.1 step 1: "search each subdomain by name for latest developments").
// Provider-neutral and model-free: no model is called here and nothing is paid for. Each of the 25 canonical
// subdomains is searched on the arXiv index, newest first, and what comes back is returned as provenance-bearing
// source records (title, link, publication date, retrieval time, quality label, abstract). Those records are
// UNTRUSTED EVIDENCE: the Refresh stage reads them through the data-plane boundary and reports what they establish.
// Nothing here decides relevance, and nothing is stated as retrieved that was not.
// Operators only, like execution. arXiv asks for one request every three seconds; the sweep is sequential.
const SEARCH = {
  ai_ml: 'abs:"foundation model" AND (abs:"mixture of experts" OR abs:"scaling law" OR abs:"inference efficiency")',
  distributed_systems: 'abs:"distributed systems" AND (abs:"fault tolerance" OR abs:"decentralized" OR abs:"edge computing")',
  data_engineering: 'abs:"data provenance" OR abs:"data lineage" OR (abs:"streaming" AND abs:"data pipeline")',
  cybersecurity: '(abs:"adversarial" AND abs:"large language model" AND abs:"attack") OR abs:"prompt injection" OR abs:"threat model"',
  neuroscience: 'abs:"predictive processing" OR abs:"memory consolidation" OR abs:"synaptic plasticity" OR abs:"global workspace"',
  physics: 'abs:"quantum information" AND (abs:"entanglement" OR abs:"thermodynamics" OR abs:"holographic")',
  systems_engineering: 'abs:"systems engineering" OR abs:"digital twin" OR abs:"model-based systems engineering"',
  unified_ai_cognitive: 'abs:"cognitive architecture" AND (abs:"language model" OR abs:"agent" OR abs:"memory")',
  epistemology: 'abs:"algorithm audit" OR abs:"epistemic uncertainty" OR (abs:"calibration" AND abs:"language model")',
  knowledge_representation: 'abs:"neuro-symbolic" OR (abs:"knowledge graph" AND abs:"language model")',
  semantic_networks: 'abs:"GraphRAG" OR abs:"graph retrieval-augmented" OR (abs:"causal inference" AND abs:"structural causal model")',
  systems_modeling: 'abs:"world model" OR (abs:"simulation" AND abs:"causal" AND abs:"complex system")',
  computational_linguistics: 'abs:"narrative" AND (abs:"computational" OR abs:"discourse") AND abs:"language model"',
  consciousness_theory: 'abs:"consciousness" AND (abs:"artificial intelligence" OR abs:"integrated information" OR abs:"global workspace")',
  philosophy_of_mind: '(abs:"philosophy of mind" OR abs:"moral status" OR abs:"personal identity") AND (abs:"AI" OR abs:"artificial")',
  ethics_governance: 'abs:"AI governance" OR abs:"AI Act" OR (abs:"ethics" AND abs:"artificial intelligence" AND abs:"policy")',
  ai_safety: 'abs:"AI alignment" OR abs:"deceptive alignment" OR abs:"interpretability" OR abs:"corrigibility"',
  risk_analysis: '(abs:"overreliance" OR abs:"automation bias" OR abs:"human autonomy") AND (abs:"AI" OR abs:"language model")',
  strategic_planning: '(abs:"strategic foresight" OR abs:"scenario planning" OR abs:"long-horizon planning") AND (abs:"AI" OR abs:"agent")',
  game_theory: 'abs:"game theory" AND (abs:"multi-agent" OR abs:"coalition" OR abs:"mechanism design")',
  mlops_product: 'abs:"MLOps" OR abs:"LLMOps" OR (abs:"agent orchestration" AND abs:"deployment")',
  feedback_iteration: '(abs:"iterative refinement" OR abs:"self-refine" OR abs:"continual learning") AND abs:"language model"',
  technical_writing: '(abs:"technical documentation" OR abs:"information design" OR abs:"summarization faithfulness") AND abs:"language model"',
  behavioral_economics: 'abs:"behavioral economics" OR (abs:"cognitive bias" AND abs:"decision making" AND abs:"language model")',
  api_design: '(abs:"API design" OR abs:"tool use" OR abs:"agent interoperability" OR abs:"model context protocol") AND abs:"agent"',
};
const PER_SUBDOMAIN = 3;
const PAUSE_MS = 3100;
const text = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const tag = (xml, name) => text((xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1]);

async function search(id, retrievedAt) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(SEARCH[id])}&sortBy=submittedDate&sortOrder=descending&max_results=${PER_SUBDOMAIN}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'JanusBlueprintEngine/2.0 (refresh retrieval)' } });
  if (!res.ok) throw new Error(`arXiv answered ${res.status}`);
  const xml = await res.text();
  return (xml.match(/<entry>[\s\S]*?<\/entry>/g) || []).map((entry) => ({
    kind: 'preprint', title: tag(entry, 'title'), origin: tag(entry, 'id'), published_at: tag(entry, 'published'), retrieved_at: retrievedAt,
    quality: 'arXiv preprint: not peer reviewed', text: tag(entry, 'summary'), subdomains: [id],
  })).filter((r) => r.title && r.text);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Janus retrieval is limited to operators' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    // `subdomains` narrows the sweep (diagnostics); a run always sweeps all 25.
    const ids = Array.isArray(body?.subdomains) && body.subdomains.length ? body.subdomains.filter((id) => SEARCH[id]) : Object.keys(SEARCH);
    const retrievedAt = new Date().toISOString();
    const records = [], gaps = [];
    for (let i = 0; i < ids.length; i += 1) {
      if (i) await new Promise((r) => setTimeout(r, PAUSE_MS));
      try {
        const found = await search(ids[i], retrievedAt);
        if (found.length) records.push(...found); else gaps.push({ subdomain: ids[i], reason: 'the index returned nothing' });
      } catch (error) {
        gaps.push({ subdomain: ids[i], reason: String(error?.message || error).slice(0, 200) });
      }
    }
    return Response.json({ source: 'arXiv API (export.arxiv.org), newest first', retrieved_at: retrievedAt, swept: ids, records, gaps });
  } catch (error) {
    return internalError('retrieveJanusEvidence', error);
  }
}