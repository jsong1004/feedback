"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function MentorDashboardPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const { data: assignments, isLoading: assignmentsLoading } =
    trpc.menteeAssignment.getMenteesForMentor.useQuery({
      eventId: selectedEventId || undefined,
    });

  const { data: submissions } = trpc.feedbackSubmission.getMentorSubmissions.useQuery({
    eventId: selectedEventId || undefined,
  });

  // Get unique events from assignments
  const events = assignments?.reduce((acc, assignment) => {
    if (!acc.find((e) => e.id === assignment.event.id)) {
      acc.push(assignment.event);
    }
    return acc;
  }, [] as any[]);

  // Check if feedback has been submitted for an assignment
  const isSubmitted = (menteeId: string, eventId: string) => {
    return submissions?.some(
      (sub) => sub.mentee.id === menteeId && sub.event.id === eventId
    );
  };

  if (assignmentsLoading) {
    return (
      <ProtectedLayout requiredRoles={["mentor", "organizer", "admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout requiredRoles={["mentor", "organizer", "admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-600 mt-2">
            View your assigned mentees and submit feedback
          </p>
        </div>

        {/* Event Filter */}
        {events && events.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <Select
              id="event-filter"
              label="Filter by Event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={[
                { value: "", label: "All Events" },
                ...events.map((event) => ({
                  value: event.id,
                  label: event.name,
                })),
              ]}
            />
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments?.map((assignment) => {
            const submitted = isSubmitted(assignment.mentee.id, assignment.event.id);

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.mentee.name || assignment.mentee.email}
                      </h3>
                      {submitted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Submitted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {assignment.mentee.email}
                    </p>
                    {assignment.mentee.companyName && (
                      <p className="text-sm text-gray-500">
                        {assignment.mentee.companyName}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Event:</span>
                        <span className="font-medium">{assignment.event.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Period:</span>
                        <span className="font-medium">
                          {new Date(assignment.event.startDate).toLocaleDateString()} -{" "}
                          {new Date(assignment.event.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/mentor/events/${assignment.event.id}/mentees/${assignment.mentee.id}/submit-feedback`}
                    >
                      <Button variant={submitted ? "secondary" : "primary"}>
                        {submitted ? "Update Feedback" : "Submit Feedback"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assignments?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              No mentee assignments yet. Contact your organizer to get assigned.
            </p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
