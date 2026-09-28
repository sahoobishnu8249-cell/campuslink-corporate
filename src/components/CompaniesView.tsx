import React from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Briefcase, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Company, JobPosting } from '../types/index.ts';

interface CompaniesViewProps {
  companies: Company[];
  jobs: JobPosting[];
  onSelectCompanyJobs: (companyId: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  jobs,
  onSelectCompanyJobs
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Corporate Hiring Partners & Employers
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Verified corporate partners actively participating in campus placement sprints.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
          {companies.length} Active Partners
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => {
          const companyJobs = jobs.filter(j => j.companyId === company.id || j.companyName === company.name);
          return (
            <div
              key={company.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-base text-indigo-900 shadow-2xs">
                    {company.logo || company.name.slice(0, 3)}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {company.hiringStatus}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {company.name}
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    {company.industry}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{company.location}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {company.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500">
                  <strong className="text-indigo-600 font-mono">{companyJobs.length} active roles</strong>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onSelectCompanyJobs(company.id)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <span>View Roles</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
