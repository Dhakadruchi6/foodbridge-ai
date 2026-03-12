"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import {
    Building2,
    MapPin,
    CheckCircle2,
    Mail,
    ShieldCheck,
    UserCheck,
    MoreHorizontal,
    ExternalLink
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
import { Button } from "@/components/ui/button";

interface NGO {
    _id: string;
    name: string;
    email: string;
    address: string;
    city: string;
}

export const NGOTable = () => {
    const [ngos, setNgos] = useState<NGO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNgos = async () => {
            try {
                const result = await getRequest("/api/admin/ngos");
                if (result.success) {
                    setNgos(result.data);
                }
            } catch (err) {
                console.error("Failed to fetch ngos", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNgos();
    }, []);

    if (loading) {
        return <div className="h-64 bg-slate-50 rounded-3xl animate-pulse" />;
    }

    return (
        <Card className="glass-card rounded-[2rem] border-none overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Verified Partner</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Communication</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600">Base of Operations</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Protocol</TableHead>
                        <TableHead className="py-6 px-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ngos.map((ngo) => (
                        <TableRow key={ngo._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="px-8 py-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Building2 className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-black text-slate-800 tracking-tight">{ngo.name}</span>
                                        <div className="flex items-center space-x-1">
                                            <UserCheck className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Authenticated NGO</span>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-6">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-sm font-bold">{ngo.email}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-6">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-sm font-bold">{ngo.city}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-6 text-right">
                                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Active</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-6 px-12 text-right">
                                <Button variant="ghost" size="sm" className="font-bold text-primary group">
                                    Audit
                                    <ExternalLink className="ml-2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};
