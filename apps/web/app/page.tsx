"use client";

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, isAdmin, isOrganizer, isMentor, isMentee } = useAuth();

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || user?.email}!
          </h1>
          <p className="mt-2 text-gray-600">
            Your roles: <span className="font-medium">{user?.roles.join(", ")}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <Link href="/admin/users">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  User Management
                </h2>
                <p className="text-gray-600">
                  Manage users and assign roles
                </p>
              </div>
            </Link>
          )}

          {isOrganizer && (
            <>
              <Link href="/organizer/events">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Manage Events
                  </h2>
                  <p className="text-gray-600">
                    Create and manage mentorship events
                  </p>
                </div>
              </Link>

              <Link href="/organizer/forms">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Feedback Forms
                  </h2>
                  <p className="text-gray-600">
                    Build custom feedback forms
                  </p>
                </div>
              </Link>

              <Link href="/organizer/reports">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Reports
                  </h2>
                  <p className="text-gray-600">
                    View feedback submission rates
                  </p>
                </div>
              </Link>
            </>
          )}

          {isMentor && (
            <Link href="/mentor/dashboard">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Mentor Dashboard
                </h2>
                <p className="text-gray-600">
                  Submit feedback for your mentees
                </p>
              </div>
            </Link>
          )}

          {isMentee && (
            <Link href="/mentee/dashboard">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Mentee Dashboard
                </h2>
                <p className="text-gray-600">
                  View feedback from your mentors
                </p>
              </div>
            </Link>
          )}

          <Link href="/profile">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Profile
              </h2>
              <p className="text-gray-600">
                Update your profile information
              </p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
