"use client";

import { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/lib/apiClient";
import { Loader2, ShieldCheck, FileCheck, XCircle, FileText, CheckCircle2, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminVerificationsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingNGOs, setPendingNGOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPendingNGOs = async () => {
        setLoading(true);
        try {
            const res = await getRequest("/api/admin/verifications");
            if (res.success) {
                setPendingNGOs(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch pending verifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingNGOs();
    }, []);

    const handleAction = async (ngoId: string, action: 'approve' | 'reject') => {
        setActionLoading(ngoId);
        try {
            const res = await postRequest("/api/admin/verifications", { ngoId, action });
            if (res.success) {
                // Remove from list
                setPendingNGOs(prev => prev.filter(ngo => ngo._id !== ngoId));
            }
        } catch (err) {
            console.error(`Failed to ${action} NGO`, err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-slate-100">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Secure Documents...</p>
            </div>
        );
    }

    if (pendingNGOs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 mb-6 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Platform Secure</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                    All NGO applicants have been processed. There are no pending verifications waiting in the queue.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                        Verification Queue
                        <span className="ml-3 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">{pendingNGOs.length}</span>
                    </h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">Review applicant regulatory documents to authorize network access</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {pendingNGOs.map((ngo) => (
                    <div key={ngo._id} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        {/* Profile Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{ngo.ngoName}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Reg No: {ngo.registrationNumber}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                                <div><span className="text-slate-400 block text-[9px] uppercase font-bold tracking-widest">Contact Phone</span> {ngo.contactPhone}</div>
                                <div><span className="text-slate-400 block text-[9px] uppercase font-bold tracking-widest">Base Address</span> {ngo.address}</div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <span className={cn(
                                    "px-2 py-1 flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest rounded border",
                                    ngo.certificateUrl ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                )}>
                                    {ngo.certificateUrl ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    <span>Cert Uploaded</span>
                                </span>
                                <span className={cn(
                                    "px-2 py-1 flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest rounded border",
                                    ngo.idProofUrl ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                )}>
                                    {ngo.idProofUrl ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    <span>ID Uploaded</span>
                                </span>
                            </div>
                        </div>

                        {/* Document Viewers */}
                        <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center">
                                <FileText className="w-4 h-4 mr-2" /> Audit Documents
                            </h4>
                            <div className="flex flex-col space-y-3">
                                {ngo.certificateUrl ? (
                                    <a href={ngo.certificateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-primary transition-colors group">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><FileCheck className="w-4 h-4" /></div>
                                            <span className="font-bold text-sm text-slate-700 group-hover:text-primary">View Registration Certificate</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                    </a>
                                ) : (
                                    <div className="p-3 text-sm text-rose-500 font-bold bg-rose-50 rounded-lg">Missing Certificate</div>
                                )}

                                {ngo.idProofUrl ? (
                                    <a href={ngo.idProofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-primary transition-colors group">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><ShieldCheck className="w-4 h-4" /></div>
                                            <span className="font-bold text-sm text-slate-700 group-hover:text-primary">Inspect Authorized ID</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                    </a>
                                ) : (
                                    <div className="p-3 text-sm text-rose-500 font-bold bg-rose-50 rounded-lg">Missing ID Proof</div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 w-full md:w-auto h-full justify-center">
                            <Button
                                disabled={actionLoading === ngo._id}
                                onClick={() => handleAction(ngo._id, 'approve')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 h-12 rounded-xl flex items-center justify-center w-full shadow-lg shadow-emerald-600/20"
                            >
                                {actionLoading === ngo._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Approve</>}
                            </Button>

                            <Button
                                variant="outline"
                                disabled={actionLoading === ngo._id}
                                onClick={() => handleAction(ngo._id, 'reject')}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-black px-6 h-12 rounded-xl flex items-center justify-center w-full"
                            >
                                <X className="w-5 h-5 mr-2" /> Reject
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
