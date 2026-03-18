"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX, Search, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { patchRequest } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

interface PlatformUser {
  _id: string;
  name: string;
  email: string;
  role: "donor" | "ngo" | "admin";
  createdAt: string;
  isActive: boolean;
}

interface NGOProfile {
  _id: string;
  ngoName: string;
  city: string;
  verificationStatus: "pending" | "approved" | "rejected";
  userId: { name: string; email: string };
}

const roleStyle: Record<string, string> = {
  donor: "bg-indigo-50 text-indigo-700 border-indigo-100/50",
  ngo: "bg-slate-100 text-slate-700 border-slate-200/50",
  admin: "bg-rose-50 text-rose-700 border-rose-100/50",
};

const ngoStatusStyle: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
};

export const UserTable = ({
  users,
  ngos,
  onNGOAction,
}: {
  users: PlatformUser[];
  ngos: NGOProfile[];
  onNGOAction: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleNGOAction = async (ngoId: string, action: "approve" | "reject") => {
    setLoading(ngoId);
    try {
      const res = await patchRequest("/api/admin/approve-ngo", { ngoId, action });
      if (res.success) {
        onNGOAction();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("NGO action error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Entity Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Entity Registry</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200/50">
              {users.length} Nodes
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 w-64"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Node</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Channel</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tier</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Initialized</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No operational nodes detected.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-black text-[10px]">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-black text-slate-900 tracking-tight">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold text-xs">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest", roleStyle[user.role])}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.isActive ? (
                          <span className="flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Online
                          </span>
                        ) : (
                          <span className="flex items-center text-rose-500 text-[10px] font-black uppercase tracking-widest">
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Blocked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NGO Hub Verification */}
      {ngos.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Hub Verification</h3>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded border border-amber-200/50">
              Action Required
            </span>
          </div>
          <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hub Entity</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Context</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Jurisdiction</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Orchestration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ngos.map((ngo) => (
                  <tr key={ngo._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900 tracking-tight">{ngo.ngoName}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold text-xs">{ngo.userId?.email || "—"}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold text-[11px] uppercase tracking-tighter">{ngo.city}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest", ngoStatusStyle[ngo.verificationStatus])}>
                        {ngo.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {ngo.verificationStatus === "pending" ? (
                          <>
                            <Button
                              disabled={!!loading}
                              onClick={() => handleNGOAction(ngo._id, "approve")}
                              className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800"
                            >
                              Approve Hub
                            </Button>
                            <Button
                              variant="outline"
                              disabled={!!loading}
                              onClick={() => handleNGOAction(ngo._id, "reject")}
                              className="h-8 px-4 rounded-lg border-slate-200 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50"
                            >
                              Deny
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            {ngo.verificationStatus === 'approved' ? (
                              <span className="text-emerald-600 flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Verified Entity</span>
                            ) : (
                              <span className="text-rose-400 flex items-center"><ShieldX className="w-3.5 h-3.5 mr-1.5" /> Rejected</span>
                            )}
                          </div>
                        )}
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-300">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
