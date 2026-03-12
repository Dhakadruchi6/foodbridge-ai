"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import {
    Package,
    MapPin,
    CheckCircle2,
    Clock,
    ArrowRight,
    MoreHorizontal,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

interface Donation {
    _id: string;
    foodItem: string;
    quantity: number;
    expiryDate: string;
    address: string;
    city: string;
    status: string;
    donorId: { name: string; email: string };
    acceptedBy?: { name: string };
}

export const DonationMonitor = () => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const result = await getRequest("/api/admin/donations");
                if (result.success) {
                    setDonations(result.data);
                }
            } catch (err) {
                console.error("Failed to fetch admin donations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return <div className="h-64 bg-slate-50 rounded-3xl animate-pulse" />;
    }

    return (
        <Card className="glass-card rounded-[2rem] border-none overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Inventory Flux</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Origination</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Bridge Status</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Intensity</TableHead>
                        <TableHead className="py-6 px-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {donations.map((donation) => (
                        <TableRow key={donation._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="px-8 py-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Package className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-black text-slate-800 tracking-tight">{donation.foodItem}</span>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{donation.quantity} kg</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-6">
                                <span className="block text-sm font-bold text-gray-600">{donation.donorId?.name || "Global Donor"}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{donation.city}</span>
                            </TableCell>
                            <TableCell className="py-6">
                                <StatusBadge status={donation.status} />
                            </TableCell>
                            <TableCell className="py-6 text-right">
                                <span className="text-xs font-black text-gray-600 uppercase tracking-widest leading-none">
                                    {new Date(donation.expiryDate).toLocaleDateString()}
                                </span>
                            </TableCell>
                            <TableCell className="py-6 px-12 text-right">
                                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const map: any = {
        pending: { label: "Discovery", icon: <Clock className="w-3 h-3" />, color: "bg-amber-100 text-amber-700" },
        accepted: { label: "Bridged", icon: <ShieldCheck className="w-3 h-3" />, color: "bg-blue-100 text-blue-700" },
        delivered: { label: "Resolved", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-emerald-100 text-emerald-700" }
    };

    const config = map[status] || { label: status, icon: <AlertCircle className="w-3 h-3" />, color: "bg-slate-100 text-slate-600" };

    return (
        <div className={cn(
            "inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
            config.color
        )}>
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
}
