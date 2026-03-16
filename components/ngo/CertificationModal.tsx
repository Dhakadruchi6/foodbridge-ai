import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, CheckCircle2, FileText, Activity } from "lucide-react";

interface CertificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CertificationModal({ isOpen, onClose }: CertificationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-900 border border-slate-800 text-white rounded-[2rem]">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="w-64 h-64 text-emerald-500" />
                </div>

                <div className="relative z-10 p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight">System Certifications</DialogTitle>
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            FoodBridge AI operates under strict safety and compliance protocols. The following automated systems are currently active and green.
                        </p>
                    </DialogHeader>

                    <div className="space-y-4">
                        <CertItem
                            icon={<Activity className="w-5 h-5 text-blue-500" />}
                            title="Real-Time Data Encryption"
                            desc="AES-256 standard encryption for all ledger data."
                            status="ACTIVE"
                        />
                        <CertItem
                            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            title="AI Vision Engine v4.2"
                            desc="98.7% accuracy threshold for decay kinetics scanning."
                            status="VERIFIED"
                        />
                        <CertItem
                            icon={<FileText className="w-5 h-5 text-indigo-500" />}
                            title="Regulatory Compliance"
                            desc="Automated checks against local NGO regulatory frameworks."
                            status="PASSED"
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all border border-white/5 hover:border-white/20"
                    >
                        Acknowledge
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CertItem({ icon, title, desc, status }: { icon: React.ReactNode, title: string, desc: string, status: string }) {
    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-4">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                {icon}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {status}
                    </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
        </div>
    );
}
