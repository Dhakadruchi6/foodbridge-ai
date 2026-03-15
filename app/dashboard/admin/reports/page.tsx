"use client";

import { useEffect, useState } from "react";
import { getRequest, patchRequest } from "@/lib/apiClient";
import {
    AlertTriangle,
    Loader2,
    CheckCircle2,
    XCircle,
    HelpCircle,
    User,
    ShieldCheck,
    Eye,
    Calendar,
    Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await getRequest("/api/admin/reports");
            if (res.success) {
                setReports(res.data);
            } else {
                setError(res.error || "Failed to load reports");
            }
        } catch (err: any) {
            setError("An error occurred while fetching reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        try {
            setActionLoadingId(reportId);
            const res = await patchRequest("/api/admin/reports", {
                reportId,
                status: newStatus,
                adminNotes: `Marked as ${newStatus} by admin`
            });
            if (res.success) {
                // Optimistic update
                setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));
            } else {
                alert(res.error || "Failed to update report status");
            }
        } catch (err) {
            alert("An error occurred while updating the report.");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trust & Safety Feed</h2>
                    <p className="text-slate-500 font-bold mt-1">Review AI and community-flagged anomalous donations.</p>
                </div>
                <div className="flex space-x-2">
                    <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-black text-sm flex items-center shadow-sm">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {reports.filter(r => r.status === 'pending').length} Actionable Alerts
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 font-black text-sm flex items-center shadow-sm">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {reports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length} Processed
                    </div>
                </div>
            </div>

            {error ? (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 font-bold text-sm">
                    {error}
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-400">All Clear</h3>
                    <p className="text-slate-500 text-sm mt-2">No reported donations in the ecosystem queue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports.map((report) => (
                        <ReportCard
                            key={report._id}
                            report={report}
                            onStatusChange={handleStatusChange}
                            actionLoading={actionLoadingId === report._id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const ReportCard = ({ report, onStatusChange, actionLoading }: { report: any; onStatusChange: (id: string, s: string) => void; actionLoading: boolean }) => {
    const isPending = report.status === 'pending';
    const isResolved = report.status === 'resolved'; // Action taken against donor
    const isDismissed = report.status === 'dismissed'; // False alarm

    // Safely retrieve populated fields
    const donation = report.donationId || {};
    const donor = donation.donorId || {};
    const reportedBy = report.reportedByNgoId || {};

    return (
        <div className={cn(
            "bg-white border rounded-2xl overflow-hidden shadow-sm transition-all",
            isPending ? "border-amber-200 shadow-amber-900/5 hover:border-amber-300"
                : "border-slate-200 opacity-75"
        )}>
            {/* Top Bar */}
            <div className={cn(
                "px-6 py-3 border-b flex items-center justify-between",
                isPending ? "bg-amber-50/50 border-amber-100" : "bg-slate-50/50 border-slate-100"
            )}>
                <div className="flex items-center space-x-3 text-xs font-black uppercase tracking-wider">
                    {isPending && <span className="text-amber-600 flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Needs Review</span>}
                    {isResolved && <span className="text-rose-600 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Resolved (Fraud)</span>}
                    {isDismissed && <span className="text-emerald-600 flex items-center"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Dismissed (Safe)</span>}
                    <span className="text-slate-400">• ID: {report._id.substring(report._id.length - 6)}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 flex items-center tracking-widest uppercase">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(report.createdAt).toLocaleString()}
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* 1. Evidence Image Col */}
                <div className="md:col-span-3">
                    <div className="w-full h-40 bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden relative group">
                        {donation.foodImage ? (
                            <img src={donation.foodImage} alt="Reported Asset" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-black uppercase">No Visual</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={donation.foodImage} target="_blank" rel="noopener" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-colors text-white hover:text-slate-900">
                                <Eye className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                    <div className="mt-3 text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-black tracking-widest rounded-md">
                            Flag: {report.reason.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* 2. Details Col */}
                <div className="md:col-span-6 space-y-5">
                    <div>
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{donation.foodType || "Unknown Batch"} - {donation.quantity}kg</h4>
                        <p className="text-base font-medium text-slate-700 italic border-l-2 border-amber-300 pl-3">
                            "{donation.description || "No description provided by donor."}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-200 rounded-full" />
                            <div className="pl-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <User className="w-3 h-3 mr-1" /> Reported Donor
                                </p>
                                <p className="text-sm font-black text-slate-800 mt-0.5">{donor.name || "Unknown"}</p>
                                <p className="text-xs text-slate-500 font-medium">{donor.email || "No email"}</p>
                                <p className="text-xs text-slate-500 font-medium">{donor.phone || "No phone"}</p>
                            </div>
                        </div>
                        <div className="space-y-2 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-200 rounded-full" />
                            <div className="pl-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Flagged By (NGO)
                                </p>
                                <p className="text-sm font-black text-slate-800 mt-0.5">{reportedBy.name || "Unknown NGO"}</p>
                                <p className="text-xs text-slate-500 font-medium">{reportedBy.email || "No email"}</p>
                                <p className="text-xs text-slate-500 font-medium">{reportedBy.phone || "No phone"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Action Col */}
                <div className="md:col-span-3 flex flex-col justify-center space-y-3 h-full pb-6">
                    {isPending ? (
                        <>
                            <button
                                onClick={() => onStatusChange(report._id, 'resolved')}
                                disabled={actionLoading}
                                className="w-full h-12 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 hover:border-rose-600 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center shadow-sm disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Fraud <XCircle className="w-4 h-4 ml-2" /></>}
                            </button>
                            <button
                                onClick={() => onStatusChange(report._id, 'dismissed')}
                                disabled={actionLoading}
                                className="w-full h-12 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center shadow-sm disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Safe (Dismiss) <CheckCircle2 className="w-4 h-4 ml-2" /></>}
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 p-4">
                            <ShieldCheck className="w-6 h-6 mb-2 opacity-50" />
                            <span className="text-center text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Moderated by Admin
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
