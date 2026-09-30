import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Award, 
  Building2, 
  Calendar, 
  MapPin, 
  FileCheck, 
  Clock, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  Download
} from 'lucide-react';
import { StudentProfile, OfferRecord, DocumentItem } from '../types/index.ts';

interface JoiningStatusViewProps {
  student: StudentProfile;
  offers: OfferRecord[];
  documents: DocumentItem[];
  onConfirmJoining: (companyName: string, packageLPA: string, date: string) => Promise<void>;
  onNavigateTab: (tab: any) => void;
}

export const JoiningStatusView: React.FC<JoiningStatusViewProps> = ({
  student,
  offers,
  documents,
  onConfirmJoining,
  onNavigateTab
}) => {
  const [confirming, setConfirming] = useState(false);
  const isPlaced = student.placementStatus === 'Placed';
  
  const activeOffer = offers.find(o => o.studentId === student.userId) || offers[0];
  const companyName = student.placedCompany || activeOffer?.companyName || 'Meridian Technologies';
  const ctc = student.placedPackage || activeOffer?.ctc || '₹22.5 LPA';
  const joiningDate = student.joiningDate || activeOffer?.joiningDate || '2026-07-15';
  const location = student.joiningLocation || 'Bengaluru Tech Park / Hybrid';

  const requiredDocs = [
    { title: 'Signed Offer Letter Acceptance', category: 'Offer Letter', required: true },
    { title: 'Official Academic Marksheets & Degree', category: 'Academic Marksheet', required: true },
    { title: 'Government ID Proof (Aadhaar / Passport)', category: 'ID Proof', required: true },
    { title: 'Verified Technical Resume', category: 'Resume', required: true },
    { title: 'Medical Fitness & Background Verification', category: 'Joining Documents', required: false },
  ];

  const docChecklist = requiredDocs.map(req => {
    const uploaded = documents.find(d => 
      d.category === req.category || d.title.toLowerCase().includes(req.title.toLowerCase())
    );
    return {
      ...req,
      uploaded: Boolean(uploaded),
      status: uploaded ? uploaded.status : 'Pending',
      filename: uploaded?.filename
    };
  });

  const verifiedCount = docChecklist.filter(d => d.status === 'Verified' || d.status === 'Uploaded').length;
  const docsComplete = verifiedCount >= 3;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirmJoining(companyName, ctc, joiningDate);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Placement Joining Status & Onboarding Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            End-to-end post-offer verification, pre-joining documentation, and institutional placement certification.
          </p>
        </div>

        <div className="self-start sm:self-auto">
          {isPlaced ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-300 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Status: Officially Placed 🎓</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Status: Joining Onboarding in Progress</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Placement Certificate / Card if PLACED */}
      {isPlaced && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Institutional Placement Completed</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Congratulations, {student.fullName}!
              </h3>
              <p className="text-sm text-emerald-100/80 max-w-xl leading-relaxed">
                You have officially fulfilled all selection rounds, accepted your offer, and completed institutional documentation with <strong>{companyName}</strong>. Your placement is recorded in the university convocation registry.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-emerald-200">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                  <Building2 className="w-4 h-4 text-emerald-300" />
                  <span>{companyName}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Package: {ctc}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                  <Calendar className="w-4 h-4 text-sky-300" />
                  <span>Joining: {joiningDate}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={() => onNavigateTab('offers')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>View Offer Letter</span>
              </button>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs border border-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Campus Placement Stats</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Joining Progression Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">
          Campus-to-Corporate Onboarding Journey
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {[
            { step: '1', title: 'Offer Accepted', done: true, desc: 'Candidate confirmed campus offer' },
            { step: '2', title: 'Documents Submitted', done: docsComplete, desc: `${verifiedCount} of ${requiredDocs.length} files on record` },
            { step: '3', title: 'TPO Verified', done: isPlaced || verifiedCount >= 3, desc: 'Placement cell verification audit' },
            { step: '4', title: 'Joining Scheduled', done: Boolean(joiningDate), desc: `Scheduled for ${joiningDate}` },
            { step: '5', title: 'Joined & Placed', done: isPlaced, desc: 'University placement completed' },
          ].map((item, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                item.done 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  item.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.done ? '✓' : item.step}
                </span>
                {item.done && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">DONE</span>}
              </div>
              <div>
                <h4 className={`text-xs font-black ${item.done ? 'text-slate-900' : 'text-slate-500'}`}>
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Offer Details & Required Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Required Documents Checklist */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Corporate Onboarding Document Verification
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory documentation required before company reporting date
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('documents')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {docChecklist.map((doc, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                    doc.uploaded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{doc.title}</span>
                      {doc.required && (
                        <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Category: {doc.category} {doc.filename ? `· ${doc.filename}` : ''}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {doc.status === 'Verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : doc.uploaded ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Under Audit</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onNavigateTab('documents')}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Upload Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Offer Details & Joining Confirmation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Reporting & Joining Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiring Organization</span>
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>{companyName}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offered Compensation</span>
                <div className="font-extrabold text-emerald-700 text-base font-mono">
                  {ctc}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date & Reporting</span>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{joiningDate}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {!isPlaced ? (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{confirming ? 'Recording Placement...' : 'Confirm Joining & Mark as PLACED'}</span>
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold border border-emerald-200">
                ✓ Institutional record locked: Student is officially Placed.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
