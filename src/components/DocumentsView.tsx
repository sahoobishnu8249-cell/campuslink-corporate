import React, { useState } from 'react';
import { 
  FileCheck2, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  Plus,
  Filter
} from 'lucide-react';
import { DocumentItem } from '../types/index.ts';

interface DocumentsViewProps {
  documents: DocumentItem[];
  isTPO: boolean;
  onUploadDocument: (doc: any) => Promise<DocumentItem>;
  onVerifyDocument: (id: string, status: 'Verified' | 'Rejected', note?: string) => Promise<DocumentItem>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  isTPO,
  onUploadDocument,
  onVerifyDocument
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentItem['category']>('Academic Marksheet');
  const [filename, setFilename] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [uploading, setUploading] = useState(false);

  const categories: DocumentItem['category'][] = [
    'Resume',
    'ID Proof',
    'Academic Marksheet',
    'Certificates',
    'Offer Letter',
    'Joining Documents'
  ];

  const filtered = filterCategory === 'All'
    ? documents
    : documents.filter(d => d.category === filterCategory);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setUploading(true);
    try {
      await onUploadDocument({
        title,
        category,
        filename: filename || `${title.replace(/\s+/g, '_')}.pdf`,
        fileSize: '1.2 MB'
      });
      setShowUploadModal(false);
      setTitle('');
      setFilename('');
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Student Document Verification Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official university credentials, identity proofs, semester marksheets, and countersigned offer letters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {doc.category}
                </span>

                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  doc.status === 'Uploaded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {doc.status}
                </span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm mt-2 leading-tight">
                {doc.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {doc.filename} · {doc.fileSize}
              </p>

              {doc.verificationNote && (
                <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600">
                  <span className="font-bold text-slate-700">TPO Note:</span> {doc.verificationNote}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">
                Uploaded: {doc.uploadedDate}
              </span>

              <div className="flex items-center gap-1.5">
                {isTPO && doc.status === 'Uploaded' && (
                  <>
                    <button
                      onClick={() => onVerifyDocument(doc.id, 'Verified', 'Verified by Placement Officer')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors"
                    >
                      Verify ✓
                    </button>
                    <button
                      onClick={() => onVerifyDocument(doc.id, 'Rejected', 'Document unclear or signature missing')}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors"
                    >
                      Reject ✕
                    </button>
                  </>
                )}
                <button
                  onClick={() => alert(`Opening preview for ${doc.filename}...`)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                  title="View Document"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Upload Student Document</h3>
                <p className="text-xs text-slate-500">Supports PDF, DOCX up to 10MB</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cumulative Semester Grade Transcript (Sem 1-6)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">File Simulation</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-700">Click or drag file here</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">PDF or DOCX accepted</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {uploading ? 'Uploading...' : 'Submit for Verification'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
