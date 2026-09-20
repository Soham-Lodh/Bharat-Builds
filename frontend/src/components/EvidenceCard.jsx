import React from "react";
import { ExternalLink } from "lucide-react";

const EvidenceCard = ({ sources = [], evidenceGrade }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="font-semibold text-gray-900">Sources</h3>
      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        {evidenceGrade || "LOW_CONFIDENCE"}
      </span>
    </div>
    {sources.length ? (
      <div className="space-y-3">
        {sources.map((source) => (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            key={source.id || source.title}
            className="block rounded-md border border-gray-100 p-3 text-sm hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="flex items-center justify-between gap-2 font-medium text-gray-900">
              {source.title}
              <ExternalLink size={14} />
            </span>
            <span className="mt-1 block text-xs text-gray-500">{source.sourceType}</span>
            <span className="mt-2 block text-gray-700">{source.excerpt}</span>
          </a>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-600">No source was retrieved for this response.</p>
    )}
  </div>
);

export default EvidenceCard;
