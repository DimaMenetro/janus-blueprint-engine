import { Button } from "@/components/ui/button";
import { Download, Copy, FileJson, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ExportTab({ rawJson, renderMd }) {
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
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileJson className="w-6 h-6 text-slate-600" />
          <div>
            <h4 className="font-medium text-slate-900">Export JSON</h4>
            <p className="text-sm text-slate-500">Raw structured data output</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleCopy(rawJson, "json")}
            className="flex-1"
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
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
        {rawJson && (
          <div className="mt-4 max-h-48 overflow-auto">
            <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap">
              {rawJson.substring(0, 500)}
              {rawJson.length > 500 && "..."}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-slate-600" />
          <div>
            <h4 className="font-medium text-slate-900">Export Markdown</h4>
            <p className="text-sm text-slate-500">Human-readable format</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleCopy(renderMd, "md")}
            className="flex-1"
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
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Markdown
          </Button>
        </div>
        {renderMd && (
          <div className="mt-4 max-h-48 overflow-auto">
            <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap">
              {renderMd.substring(0, 500)}
              {renderMd.length > 500 && "..."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}