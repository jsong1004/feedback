"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

export default function OrganizerReportsPage() {
  const [selectedEventId, setSelectedEventId] = useState("");

  const { data: events } = trpc.event.getMyEvents.useQuery();
  const { data: report, isLoading } = trpc.organizerReport.getFeedbackSubmissionRates.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId }
  );

  return (
    <ProtectedLayout requiredRoles={["organizer", "admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            View feedback submission rates and analytics for your events
          </p>
        </div>

        {/* Event Selector */}
        <div className="bg-white p-4 rounded-lg shadow">
          <Select
            id="event"
            label="Select Event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            options={
              events?.events.map((event) => ({
                value: event.id,
                label: event.name,
              })) || []
            }
          />
        </div>

        {isLoading && selectedEventId && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Event Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {report.event.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {new Date(report.event.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">End Date</p>
                  <p className="font-medium">
                    {new Date(report.event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Form</p>
                  <p className="font-medium">{report.event.feedbackForm.name}</p>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {report.stats.totalAssignments}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {report.stats.totalSubmissions}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {report.stats.pendingSubmissions}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Submission Rate</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {report.stats.submissionRate}%
                </p>
              </div>
            </div>

            {/* Mentor Breakdown */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mentor Performance
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.mentorStats.map((stat) => (
                    <tr key={stat.mentor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.mentor.name || stat.mentor.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stat.mentor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.submitted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stat.submissionRate === 100
                              ? "bg-green-100 text-green-800"
                              : stat.submissionRate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {stat.submissionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assignment Details
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mentee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.breakdown.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.mentor.name || item.mentor.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.mentee.name || item.mentee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.submitted
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.submitted ? "Submitted" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.submissionDate
                          ? new Date(item.submissionDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedEventId && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Select an event to view its report</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
