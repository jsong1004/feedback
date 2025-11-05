"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

export default function ProfilePage() {
  const { addToast } = useToast();
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();
  const updateProfileMutation = trpc.user.updateProfile.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    description: "",
  });

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        companyName: profile.companyName || "",
        description: profile.description || "",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfileMutation.mutateAsync(formData);
      addToast("Profile updated successfully!", "success");
    } catch (error) {
      addToast("Failed to update profile. Please try again.", "error");
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="pb-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update your personal information
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-900">{profile?.email}</p>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Roles</label>
            <div className="flex gap-2 flex-wrap">
              {profile?.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <Input
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />

            <Input
              id="companyName"
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Enter your company name"
            />

            <Textarea
              id="description"
              label="Bio / Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us a bit about yourself"
              rows={4}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={updateProfileMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}
