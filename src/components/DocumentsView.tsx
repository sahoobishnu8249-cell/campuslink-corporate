import React, { useState, useRef } from 'react';
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
  Filter,
  Download,
  Eye,
  File,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { DocumentItem } from '../types/index.ts';
import { extractFileContent } from '../utils/fileExtractor.ts';
import { api } from '../services/api.ts';

interface DocumentsViewProps {
  documents: DocumentItem[];
  isTPO: boolean;
  onUploadDocument: (doc: any) => Promise<DocumentItem>;
  onVerifyDocument: (id: string, status: 'Verified' | 'Rejected', note?: string) => Promise<DocumentItem>;
  onNavigateTab?: (tab: any) => void;
  activeStudent?: any;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  isTPO,
  onUploadDocument,
  onVerifyDocument,
  onNavigateTab,
  activeStudent
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentItem['category']>('Resume');
  const [filename, setFilename] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setFilename(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      const extracted = await extractFileContent(file);
      setFileDataUrl(extracted.dataUrl);
      setFileSizeStr(extracted.fileSize);
      setExtractedText(extracted.text);
    } catch (err) {
      console.warn('File extraction error:', err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !filename) return;
    setUploading(true);
    setUploadFeedback(null);

    try {
      const effectiveFilename = filename || (selectedFile ? selectedFile.name : `${title.replace(/\s+/g, '_')}.pdf`);
      const effectiveSize = fileSizeStr || '1.2 MB';

      // If category is Resume, also process with AI skill extraction & ATS scorer
      if (category === 'Resume' && activeStudent) {
        try {
          await api.uploadResumeForSkillAnalysis(
            extractedText || `Resume of ${activeStudent.fullName}. Degree: ${activeStudent.degree} in ${activeStudent.branch}. Skills: ${activeStudent.skills?.join(', ') || 'React, Python, SQL'}`,
            effectiveFilename,
            activeStudent.userId,
            fileDataUrl,
            effectiveSize
          );
        } catch (parseErr) {
          console.warn('Resume analysis during doc upload:', parseErr);
        }
      }

      await onUploadDocument({
        title: title || effectiveFilename,
        category,
        filename: effectiveFilename,
        fileUrl: fileDataUrl || '',
        fileSize: effectiveSize
      });

      setUploadFeedback(`✓ ${effectiveFilename} uploaded successfully!`);
      setTimeout(() => {
        setShowUploadModal(false);
        setTitle('');
        setFilename('');
        setSelectedFile(null);
        setFileDataUrl('');
        setFileSizeStr('');
        setExtractedText('');
        setUploadFeedback(null);
      }, 1200);
    } catch (e: any) {
      alert(e.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback virtual download
      const blob = new Blob([`Document: ${doc.title}\nCategory: ${doc.category}\nFile: ${doc.filename}\nStatus: ${doc.status}\nUploaded Date: ${doc.uploadedDate}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename || `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            Official university credentials, identity proofs, resumes with AI extraction, semester marksheets, and offer letters.
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
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Quick Resume Studio Banner if on Resume Studio view */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-900/50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">Resume Studio & AI Skill Parser</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                Live NLP Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload your resume (PDF/DOCX/TXT) to automatically parse programming languages, frameworks, calculate ATS compatibility, and take AI verification tests.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setCategory('Resume');
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Resume File
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('skillverification')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Verify Skills →
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">{doc.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{doc.category}</span>
                  </div>
                </div>

                {doc.status === 'Verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : doc.status === 'Rejected' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3 h-3" />
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium truncate max-w-[170px]">{doc.filename}</span>
                  <span className="font-mono text-slate-400">{doc.fileSize}</span>
                </div>
                {doc.verificationNote && (
                  <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">
                    {doc.verificationNote}
                  </p>
                )}
              </div>
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
                  onClick={() => handleDownload(doc)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Preview Document Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Upload Document</h3>
                <p className="text-xs text-slate-500">Supports PDF, DOCX, TXT, PNG, JPG up to 15MB</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{uploadFeedback}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400 cursor-pointer text-xs font-semibold"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {category === 'Resume' && (
                  <p className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Uploading a resume triggers automated AI skill extraction and ATS compatibility scoring!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cumulative Semester Grade Transcript (Sem 1-6)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400 text-xs"
                />
              </div>

              {/* REAL File Input & Dropzone */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">File Attachment</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInputChange} 
                  accept=".pdf,.doc,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg" 
                  className="hidden" 
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 text-xs truncate max-w-xs mx-auto">
                        {selectedFile.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {fileSizeStr || `${(selectedFile.size / 1024).toFixed(1)} KB`} · Ready to upload
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilename('');
                          setFileDataUrl('');
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:underline"
                      >
                        Remove and choose another
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <div className="font-bold text-slate-700 text-xs">
                        Click to browse or drag file here
                      </div>
                      <div className="text-[10px] text-slate-400">
                        PDF, DOCX, TXT, PNG, JPG up to 15MB
                      </div>
                    </div>
                  )}
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
                  disabled={uploading || (!selectedFile && !title)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing & Uploading...</span>
                    </>
                  ) : (
                    <span>Submit Document</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500 font-mono">{previewDoc.filename} ({previewDoc.fileSize})</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                  <div className="font-bold text-slate-800">{previewDoc.category}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Verification Status</span>
                  <div className="font-bold text-emerald-600">{previewDoc.status}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Uploaded Date</span>
                  <div className="font-mono text-slate-700">{previewDoc.uploadedDate}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Student</span>
                  <div className="font-bold text-slate-800">{previewDoc.studentName}</div>
                </div>
              </div>

              {previewDoc.verificationNote && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900">
                  <span className="font-extrabold block mb-0.5">Verification / AI Note:</span>
                  <p>{previewDoc.verificationNote}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewDoc)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
