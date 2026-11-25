"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  ShieldAlert,
  Search,
  RefreshCw,
  MoreVertical,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | "DEACTIVATED";
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface RoleItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
}

interface SecurityEventItem {
  id: string;
  type: string;
  event: string;
  actor: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface SessionItem {
  id: string;
  user: { id?: string; name: string; email: string; role: string };
  deviceLabel: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  lastActivityAt: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "sessions" | "audit">("users");

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("dispatcher");
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Roles state
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // New role modal
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleMessage, setRoleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Audit state
  const [auditEvents, setAuditEvents] = useState<SecurityEventItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // General action message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [userSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "audit") fetchAudit();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
        setAvailablePermissions(data.availablePermissions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/security/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/security/activity?limit=50");
      const data = await res.json();
      if (data.success) {
        setAuditEvents(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInvite(true);
    setInviteMessage(null);
    setCreatedInviteUrl(null);

    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          roleSlug: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate invitation.");
      }

      setInviteMessage({ type: "success", text: data.message });
      setCreatedInviteUrl(data.invitation?.inviteUrl || null);
      fetchUsers();
    } catch (err: any) {
      setInviteMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Action failed");
      setActionNotice(data.message);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Action failed");
      setActionNotice(data.message);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRevokeUserSessions = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/revoke-sessions`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Action failed");
      setActionNotice(data.message);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRevokeSpecificSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/security/sessions?id=${sessionId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to revoke session");
      fetchSessions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleMessage(null);

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          slug: newRoleSlug.trim().toLowerCase(),
          description: newRoleDesc.trim(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to create role");

      setRoleMessage({ type: "success", text: data.message });
      setIsNewRoleOpen(false);
      setNewRoleName("");
      setNewRoleSlug("");
      setNewRoleDesc("");
      setSelectedPermissions([]);
      fetchRoles();
    } catch (err: any) {
      setRoleMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to permanently delete custom role '${roleName}'?`)) return;
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Deletion failed");
      fetchRoles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">
              Access Control & User Management
            </h1>
            <Badge variant="outline" className="border-brand-orange text-brand-orange text-xs font-bold">
              RBAC & MFA Protected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee accounts, invitation onboarding, configurable roles, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setIsInviteOpen(true);
              setInviteMessage(null);
              setCreatedInviteUrl(null);
            }}
            className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Invite Employee
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "users"
              ? "border-brand-navy text-brand-navy font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Employees Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "roles"
              ? "border-brand-navy text-brand-navy font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Roles & Permissions ({roles.length})
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "sessions"
              ? "border-brand-navy text-brand-navy font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Laptop className="h-4 w-4" />
          Active Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "audit"
              ? "border-brand-navy text-brand-navy font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          Security Audit Log
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === "users" && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <Input
                  placeholder="Search by employee name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="contenteditor">Content Editor</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INVITED">Invited</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>

                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="h-9 w-9"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-bold text-slate-600">Employee</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600">Assigned Role</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600">MFA Security</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600">Last Login</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                      No administrator accounts match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-brand-navy flex items-center justify-center text-white font-bold text-xs">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {u.name}
                              {u.isSuperAdmin && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] rounded font-extrabold">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.role === "superadmin"
                              ? "bg-purple-50 text-purple-700 border-purple-200 font-bold"
                              : u.role === "dispatcher"
                              ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : u.status === "INVITED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {u.status === "ACTIVE" && <CheckCircle2 className="h-3 w-3" />}
                          {u.status === "INVITED" && <Clock className="h-3 w-3" />}
                          {u.status === "SUSPENDED" && <XCircle className="h-3 w-3" />}
                          {u.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {u.mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" /> TOTP Enabled
                          </span>
                        ) : u.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" /> Enforced at Login
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not configured</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === "ACTIVE" && !u.isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(u.id)}
                              className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Lock className="h-3 w-3 mr-1" /> Suspend
                            </Button>
                          )}

                          {u.status === "SUSPENDED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivateUser(u.id)}
                              className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Unlock className="h-3 w-3 mr-1" /> Reactivate
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeUserSessions(u.id)}
                            className="h-7 text-[11px] text-slate-600 hover:bg-slate-100"
                            title="Terminate all active employee sessions"
                          >
                            Revoke Sessions
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              System roles are pre-configured. Custom roles allow granular permission assignment.
            </p>
            <Button
              onClick={() => setIsNewRoleOpen(true)}
              size="sm"
              className="bg-brand-navy hover:bg-brand-navyLight text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Create Custom Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <Card key={r.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {r.name}
                        {r.isSystemRole && (
                          <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 text-slate-700">
                            SYSTEM
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        {r.description || `Role slug: ${r.slug}`}
                      </CardDescription>
                    </div>

                    {!r.isSystemRole && (
                      <button
                        onClick={() => handleDeleteRole(r.id, r.name)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Delete custom role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between text-xs py-2 border-t border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Assigned Employees:</span>
                    <span className="font-bold text-brand-navy bg-slate-100 px-2 py-0.5 rounded-full">
                      {r.userCount} active
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Permissions ({r.permissions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {r.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {activeTab === "sessions" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-brand-navy">Active Authenticated Sessions</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                All currently valid MongoDB sessions across devices. Revoke suspicious sessions instantly.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSessions} disabled={isLoadingSessions}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoadingSessions ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-bold">Employee</TableHead>
                  <TableHead className="text-xs font-bold">Device / Browser</TableHead>
                  <TableHead className="text-xs font-bold">IP Address</TableHead>
                  <TableHead className="text-xs font-bold">Session Started</TableHead>
                  <TableHead className="text-xs font-bold">Last Activity</TableHead>
                  <TableHead className="text-xs font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-500">
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900">{s.user.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{s.user.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">{s.deviceLabel}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{s.ipAddress}</TableCell>
                      <TableCell className="text-xs text-slate-600">{new Date(s.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {new Date(s.lastActivityAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSpecificSession(s.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                        >
                          Terminate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-brand-navy">Security & Operational Audit Log</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Immutable chronological log of authentication events, invitations, and privilege modifications.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAudit} disabled={isLoadingAudit}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoadingAudit ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-bold">Timestamp</TableHead>
                  <TableHead className="text-xs font-bold">Severity</TableHead>
                  <TableHead className="text-xs font-bold">Event Action</TableHead>
                  <TableHead className="text-xs font-bold">Actor</TableHead>
                  <TableHead className="text-xs font-bold">IP Address</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {auditEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs text-slate-500">
                      No security audit events recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditEvents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {new Date(a.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.severity === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : a.severity === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 font-mono">{a.event}</TableCell>
                      <TableCell className="text-xs text-slate-700">{a.actor}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{a.ipAddress || "127.0.0.1"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MODAL: INVITE EMPLOYEE */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-black text-brand-navy">Invite Employee</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Generates a secure 24-hour invitation link. The employee will set their own password to activate.
            </p>

            {inviteMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs border ${
                  inviteMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {inviteMessage.text}
              </div>
            )}

            {createdInviteUrl && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Activation Link (Single-Use):
                </span>
                <input
                  type="text"
                  readOnly
                  value={createdInviteUrl}
                  className="w-full text-xs font-mono bg-white p-2 border border-slate-200 rounded select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(createdInviteUrl)}
                  className="w-full text-xs mt-1"
                >
                  Copy Activation Link
                </Button>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Employee Name</label>
                <Input
                  placeholder="e.g. David Miller"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Work Email Address</label>
                <Input
                  type="email"
                  placeholder="david@mobiletyrechampions.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium"
                >
                  <option value="dispatcher">Dispatcher (Operations & Bookings)</option>
                  <option value="contenteditor">Content Editor (Website & Reviews)</option>
                  <option value="superadmin">Super Administrator (Full System Access)</option>
                  {roles
                    .filter((r) => !r.isSystemRole)
                    .map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name} (Custom)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 text-xs"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 bg-brand-orange hover:bg-orange-600 font-bold text-xs text-white"
                >
                  {isSubmittingInvite ? "Generating..." : "Generate Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ROLE */}
      {isNewRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-brand-navy">Create Custom Role</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Configure granular module and action permissions for this role.
            </p>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role Name</label>
                  <Input
                    placeholder="e.g. Junior Dispatcher"
                    value={newRoleName}
                    onChange={(e) => {
                      setNewRoleName(e.target.value);
                      setNewRoleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role Slug</label>
                  <Input
                    placeholder="e.g. junior_dispatcher"
                    value={newRoleSlug}
                    onChange={(e) => setNewRoleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                <Input
                  placeholder="Operational responsibilities..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Assign Permissions ({selectedPermissions.length} selected)
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                  {availablePermissions.map((perm: any) => (
                    <label
                      key={perm.key}
                      className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.key]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter((k) => k !== perm.key));
                          }
                        }}
                        className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900 font-mono text-[11px]">{perm.key}</div>
                        <div className="text-[10px] text-slate-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewRoleOpen(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={selectedPermissions.length === 0}
                  className="flex-1 bg-brand-navy hover:bg-brand-navyLight font-bold text-xs text-white"
                >
                  Save Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
