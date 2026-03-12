"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Target, Loader2, Sparkles, MapPin, ChevronRight, Activity, ShieldCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchResult {
    ngoId: string;
    ngoName: string;
    matchScore: number;
    distance: number;
    city?: string;
    verified?: boolean;
}

export const MLMatchResults = ({
    donationId,
    onSuccess
}: {
    donationId: string;
    onSuccess?: () => void;
}) => {
    const [results, setResults] = useState<MatchResult[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const runAIMatching = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await postRequest("/api/ml/match", { donationId });
            if (response.success) {
                setResults(response.data);
            } else {
                setError(response.message || "Failed to generate AI matches.");
            }
        } catch (err) {
            setError("An unexpected error occurred during AI matching.");
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

    if (!results && !loading) {
        return (
            <Button
                onClick={runAIMatching}
                className="w-full mt-4 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:opacity-90 text-white font-black rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] flex items-center justify-center group"
            >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Find AI Matches
            </Button>
        );
    }

    if (loading) {
        return (
            <div className="w-full mt-4 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
                <span className="text-sm font-black text-slate-500 tracking-widest uppercase">Running ML Model...</span>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
        if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-100";
        if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-100";
        return "text-red-500 bg-red-50 border-red-100";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Low";
    };

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Top AI Matches</h4>
                </div>
                <span className="text-xs font-bold text-slate-500">{results?.length || 0} found</span>
            </div>

            {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    {error}
                </div>
            ) : results?.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <p className="text-sm font-bold text-slate-500">No suitable NGOs found within operational radius.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {results?.slice(0, 5).map((match, idx) => (
                        <div key={match.ngoId} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full font-black flex items-center justify-center border",
                                        idx === 0 ? "bg-indigo-500 text-white border-indigo-500" :
                                            idx === 1 ? "bg-indigo-100 text-indigo-600 border-indigo-200" :
                                                "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h5 className="font-black text-slate-800">{match.ngoName}</h5>
                                            {match.verified && (
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 mt-0.5">
                                            <span className={cn(
                                                "flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black",
                                                getScoreColor(match.matchScore)
                                            )}>
                                                <Activity className="w-3 h-3 mr-1" />
                                                {match.matchScore}/100 · {getScoreLabel(match.matchScore)}
                                            </span>
                                            <span className={cn(
                                                "flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black",
                                                match.distance <= 20
                                                    ? "text-slate-500 bg-slate-50 border-slate-200"
                                                    : "text-rose-600 bg-rose-50 border-rose-200 shadow-sm"
                                            )}>
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {match.distance === 0 ? "Optimal Routing (Same City)"
                                                    : match.distance <= 20 ? `Optimal Routing: ${match.distance}km`
                                                        : `⚠️ Extended Distance: ${match.distance}km`}
                                            </span>
                                            {match.city && (
                                                <span className="flex items-center text-slate-400">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    {match.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={assigningId !== null}
                                    onClick={() => handleSelectNGO(match.ngoId)}
                                    className="text-indigo-600 font-black hover:bg-indigo-50"
                                >
                                    {assigningId === match.ngoId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Select <ChevronRight className="ml-1 w-4 h-4" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
