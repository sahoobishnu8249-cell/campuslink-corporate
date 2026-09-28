import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Filter,
  DollarSign
} from 'lucide-react';
import { OfferRecord } from '../types/index.ts';

interface OffersViewProps {
  offers: OfferRecord[];
  onUpdateStatus: (id: string, status: OfferRecord['status']) => Promise<OfferRecord>;
}

export const OffersView: React.FC<OffersViewProps> = ({ offers, onUpdateStatus }) => {
  const [selectedOffer, setSelectedOffer] = useState<OfferRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = filterStatus === 'All'
    ? offers
    : offers.filter(o => o.status === filterStatus);

  const handleAction = async (id: string, status: OfferRecord['status']) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, status);
      if (selectedOffer && selectedOffer.id === id) {
        setSelectedOffer(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Offer Letters & Documentation Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official digital letters, compensation packages, and university placement records.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Offers ({offers.length})</option>
            <option value="Accepted">Accepted 🤝</option>
            <option value="Pending Acceptance">Pending Acceptance</option>
            <option value="Joined">Joined 🎓</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((offer) => (
          <div
            key={offer.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20 shrink-0">
                  {offer.companyLogo || offer.companyName.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {offer.companyName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {offer.jobTitle}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                offer.status === 'Accepted' || offer.status === 'Joined' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : offer.status === 'Pending Acceptance'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {offer.status}
              </span>
            </div>

            {/* Candidate & Package */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Candidate</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{offer.studentName}</div>
                <div className="text-[11px] text-slate-500">{offer.studentBranch}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total CTC</span>
                <div className="font-extrabold text-emerald-700 font-mono text-base mt-0.5">{offer.ctc}</div>
                <div className="text-[10px] text-slate-400 font-mono">{offer.baseFixed}</div>
              </div>
            </div>

            {/* Joining Date & Validity */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-mono">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Joining: {offer.joiningDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-right justify-end">
                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Valid Till: {offer.validTill}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedOffer(offer)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Inspect Official Letter</span>
              </button>

              <div className="flex items-center gap-1.5">
                {offer.status === 'Pending Acceptance' && (
                  <button
                    onClick={() => handleAction(offer.id, 'Accepted')}
                    disabled={updatingId === offer.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Accept Offer 🤝
                  </button>
                )}
                {offer.status === 'Accepted' && (
                  <button
                    onClick={() => handleAction(offer.id, 'Joined')}
                    disabled={updatingId === offer.id}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Confirm Joined 🎓
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Official Offer Letter Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in fade-in zoom-in-95">
            
            {/* Header with Company Seal */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                  {selectedOffer.companyLogo || selectedOffer.companyName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedOffer.companyName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    University Hiring Division · Offer Ref: OFF-{selectedOffer.id.slice(-6).toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Letter Body */}
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
              <p>
                Dear <strong>{selectedOffer.studentName}</strong>,
              </p>
              <p>
                On behalf of <strong>{selectedOffer.companyName}</strong>, we are delighted to formally extend this offer of employment for the position of <strong>{selectedOffer.jobTitle}</strong> following your stellar performance throughout our Campus Placement Drive interviews and assessments.
              </p>

              {/* Compensation Breakdown Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Compensation Package Breakdown
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400">Total CTC</span>
                    <div className="font-extrabold text-emerald-700 text-sm mt-0.5">{selectedOffer.ctc}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400">Base Fixed</span>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">{selectedOffer.baseFixed}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400">Joining Bonus</span>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">{selectedOffer.bonus}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400">Tentative Joining</span>
                    <div className="font-bold text-indigo-700 text-xs mt-0.5">{selectedOffer.joiningDate}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  • {selectedOffer.terms}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-900">
                  <strong>University Placement Cell Protocol:</strong> Formal confirmation securely locks your placement record in the official university records.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-[11px] text-slate-400 font-mono">
                Digitally authenticated by CAMPUSLINK
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                {selectedOffer.status === 'Pending Acceptance' && (
                  <button
                    onClick={() => handleAction(selectedOffer.id, 'Accepted')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Sign & Accept Offer
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
