"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Target, Loader2, Sparkles, MapPin, ChevronRight, Activity, ShieldCheck, Building2, AlertCircle, Zap, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedNgo {
    name: string;
    id: string;
    distance: number;
    priorityLevel: string;
    reason: string;
}

interface MatchResponse {
    selectedNgo?: SelectedNgo;
    allMatches?: any[];
    expired?: boolean;
    message?: string;
}

export const MLMatchResults = ({
    donationId,
    onSuccess
}: {
    donationId: string;
    onSuccess?: () => void;
}) => {
    const [result, setResult] = useState<MatchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const runSmartMatching = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await postRequest("/api/ml/match", { donationId });
            if (response.success) {
                setResult(response.data);
            } else {
                setError(response.message || "Failed to find optimal NGO.");
            }
        } catch (err) {
            setError("An unexpected error occurred during matching.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectNGO = async (ngoId: string) => {
        setAssigningId(ngoId);
        setError("");
        try {
            const response = await postRequest("/api/donations/assign", { donationId, ngoId });
            if (response.success) {
                if (onSuccess) onSuccess();
            } else {
                setError(response.message || "Failed to assign donation.");
            }
        } catch (err) {
            setError("Failed to connect to assignment server.");
        } finally {
            setAssigningId(null);
        }
    };

    if (loading) {
        return (
            <div className="w-full mt-4 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Calculating Smart Match...</span>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="space-y-4 mt-4">
                {error && (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[11px] font-black border border-rose-100 uppercase tracking-wider flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                        {error}
                    </div>
                )}
                <Button
                    onClick={runSmartMatching}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center group"
                >
                    <Target className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Find Best NGO
                </Button>
            </div>
        );
    }

    if (result?.expired) {
        return (
            <div className="mt-4 p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="font-black text-sm uppercase tracking-wider">Food Expired</h4>
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                    {result.message}
                </p>
                <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-100/50 text-[10px] font-black uppercase tracking-widest shrink-0">
                    Redirection Protocol Active
                </Button>
            </div>
        );
    }

    const matchedNgoList = result?.allMatches || [];
    const selectedNgo = result?.selectedNgo;

    return (
        <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Logic</h4>
                </div>
            </div>

            {error ? (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[11px] font-black border border-rose-100 uppercase tracking-wider">
                    {error}
                </div>
            ) : !selectedNgo ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center border-2 border-dashed border-slate-200">
                    <Box className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No NGOs available within 10km operational radius.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Primary Recommended Match */}
                    <div className="relative group overflow-hidden bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-sm shadow-primary/5 transition-all hover:border-primary/40">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <Zap className="w-20 h-20 text-primary" />
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <h5 className="text-xl font-black text-slate-900 tracking-tight">{selectedNgo.name}</h5>
                                        <div className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest">Optimal</div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" /> {selectedNgo.distance}km from your location
                                    </p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    selectedNgo.priorityLevel === 'CRITICAL' ? "bg-rose-500 text-white border-rose-600" :
                                        selectedNgo.priorityLevel === 'HIGH' ? "bg-amber-400 text-slate-900 border-amber-500" :
                                            "bg-emerald-500 text-white border-emerald-600"
                                )}>
                                    {selectedNgo.priorityLevel}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-600 italic">
                                    <span className="font-black text-slate-900 uppercase tracking-wide mr-2">Reason:</span>
                                    {selectedNgo.reason}
                                </p>
                            </div>

                            <Button
                                className="w-full h-11 bg-primary text-white font-black rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all"
                                disabled={assigningId !== null}
                                onClick={() => handleSelectNGO(selectedNgo.id)}
                            >
                                {assigningId === selectedNgo.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Authorize Distribution Sequence <ChevronRight className="ml-2 w-4 h-4" /></>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Other potential nodes */}
                    {matchedNgoList.length > 1 && (
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pl-2">Alternative Processing Nodes</p>
                            <div className="grid grid-cols-1 gap-2">
                                {matchedNgoList.filter(n => n.ngoId !== selectedNgo.id).slice(0, 2).map((match) => (
                                    <div key={match.ngoId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {match.ngoName[0]}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[11px] font-black text-slate-700">{match.ngoName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{match.distance}km · {match.urgency} Urgency</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={assigningId !== null}
                                            onClick={() => handleSelectNGO(match.ngoId)}
                                            className="text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5"
                                        >
                                            Select
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

