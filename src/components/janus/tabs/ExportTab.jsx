import { Button } from "@/components/ui/button";
import { Download, Copy, FileJson, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ExportTab({ rawJson, renderMd, fullPrompt, isAdmin }) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const handleCopy = async (content, type) => {
    await navigator.clipboard.writeText(content || "");
    if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
    toast.success(`${type === "json" ? "JSON" : "Markdown"} copied to clipboard`);
  };

  const handleDownload = (content, filename, type) => {
    const blob = new Blob([content || ""], { type: type === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  };

  return (
    <div className="space-y-6 p-6">
      {isAdmin && fullPrompt && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200">Full Prompt (Admin Only)</h4>
              <p className="text-sm text-amber-600 dark:text-amber-300">Complete prompt sent to LLM - hidden from end users</p>
            </div>
          </div>
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => handleCopy(fullPrompt, "prompt")}
              className="flex-1 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </Button>
            <Button
              onClick={() => handleDownload(fullPrompt, "janus-prompt.txt", "text")}
              className="flex-1 backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 hover:bg-slate-900/[0.80] dark:hover:bg-slate-100/[0.80] border border-slate-700/60 dark:border-slate-300/60"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Prompt
            </Button>
          </div>
          <div className="max-h-96 overflow-auto">
            <pre className="backdrop-blur-[40px] bg-amber-100/[0.20] dark:bg-amber-900/[0.20] border border-amber-300/60 dark:border-amber-500/35 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
              {fullPrompt}
            </pre>
          </div>
        </div>
      )}
      <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileJson className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Export JSON</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Raw structured data output</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleCopy(rawJson, "json")}
            className="flex-1 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
          >
            {copiedJson ? (
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedJson ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button
            onClick={() => handleDownload(rawJson, "janus-blueprint.json", "json")}
            className="flex-1 backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 hover:bg-slate-900/[0.80] dark:hover:bg-slate-100/[0.80] border border-slate-700/60 dark:border-slate-300/60"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
        {rawJson && (
          <div className="mt-4 max-h-48 overflow-auto">
            <pre className="backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {rawJson.substring(0, 500)}
              {rawJson.length > 500 && "..."}
            </pre>
          </div>
        )}
      </div>

      <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Export Markdown</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Human-readable format</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleCopy(renderMd, "md")}
            className="flex-1 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
          >
            {copiedMd ? (
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedMd ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button
            onClick={() => handleDownload(renderMd, "janus-blueprint.md", "md")}
            className="flex-1 backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 hover:bg-slate-900/[0.80] dark:hover:bg-slate-100/[0.80] border border-slate-700/60 dark:border-slate-300/60"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Markdown
          </Button>
        </div>
        {renderMd && (
          <div className="mt-4 max-h-48 overflow-auto">
            <pre className="backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {renderMd.substring(0, 500)}
              {renderMd.length > 500 && "..."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}