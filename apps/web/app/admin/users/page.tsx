"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

const ROLES = ["admin", "organizer", "mentor", "mentee", "user"];

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<{
    id: string;
    email: string;
    name: string | null;
    roles: string[];
  } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    limit: 50,
  });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      addToast("User roles updated successfully", "success");
      setEditingUser(null);
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to update roles", "error");
    },
  });

  const handleEditRoles = (user: typeof editingUser) => {
    if (user) {
      setEditingUser(user);
      setSelectedRoles(user.roles);
    }
  };

  const handleSaveRoles = async () => {
    if (!editingUser || selectedRoles.length === 0) {
      addToast("Please select at least one role", "error");
      return;
    }

    await updateRoleMutation.mutateAsync({
      userId: editingUser.id,
      roles: selectedRoles as any,
    });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (isLoading) {
    return (
      <ProtectedLayout requiredRoles={["admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:gap-4">
          <div className="flex-1">
            <Input
              id="search"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: "", label: "All Roles" },
                ...ROLES.map((role) => ({ value: role, label: role })),
              ]}
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.companyName && (
                      <div className="text-xs text-gray-400">{user.companyName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRoles(user)}
                    >
                      Edit Roles
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data?.users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Roles Dialog */}
      <Dialog
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Roles"
        size="sm"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{editingUser.name}</p>
              <p className="text-sm text-gray-500">{editingUser.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Roles</label>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <Checkbox
                    key={role}
                    id={`role-${role}`}
                    label={role.charAt(0).toUpperCase() + role.slice(1)}
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoles} isLoading={updateRoleMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </ProtectedLayout>
  );
}
