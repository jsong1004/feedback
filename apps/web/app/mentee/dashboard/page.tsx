"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Question = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
};

export default function MenteeDashboardPage() {
  const [eventFilter, setEventFilter] = useState("");
  const [mentorFilter, setMentorFilter] = useState("");
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);

  const { data: submissions, isLoading } =
    trpc.feedbackSubmission.getSubmissionsForMentee.useQuery({
      eventId: eventFilter || undefined,
      mentorId: mentorFilter || undefined,
    });

  const { data: submissionDetail } = trpc.feedbackSubmission.getSubmissionById.useQuery(
    { id: viewingSubmission || "" },
    { enabled: !!viewingSubmission }
  );

  // Get unique events and mentors for filters
  const events = submissions?.reduce((acc, sub) => {
    if (!acc.find((e) => e.id === sub.event.id)) {
      acc.push(sub.event);
    }
    return acc;
  }, [] as any[]);

  const mentors = submissions?.reduce((acc, sub) => {
    if (!acc.find((m) => m.id === sub.mentor.id)) {
      acc.push(sub.mentor);
    }
    return acc;
  }, [] as any[]);

  if (isLoading) {
    return (
      <ProtectedLayout requiredRoles={["mentee", "admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout requiredRoles={["mentee", "admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Feedback</h1>
          <p className="text-gray-600 mt-2">
            View feedback received from your mentors
          </p>
        </div>

        {/* Filters */}
        {(events?.length || mentors?.length) ? (
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="event-filter"
              label="Filter by Event"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              options={[
                { value: "", label: "All Events" },
                ...(events?.map((event) => ({
                  value: event.id,
                  label: event.name,
                })) || []),
              ]}
            />
            <Select
              id="mentor-filter"
              label="Filter by Mentor"
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              options={[
                { value: "", label: "All Mentors" },
                ...(mentors?.map((mentor) => ({
                  value: mentor.id,
                  label: mentor.name || mentor.email,
                })) || []),
              ]}
            />
          </div>
        ) : null}

        {/* Feedback List */}
        <div className="space-y-4">
          {submissions?.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Feedback from {submission.mentor.name || submission.mentor.email}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Event: {submission.event.name}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Submitted:</span>
                      <span className="font-medium">
                        {new Date(submission.submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Event Period:</span>
                      <span className="font-medium">
                        {new Date(submission.event.startDate).toLocaleDateString()} -{" "}
                        {new Date(submission.event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Button onClick={() => setViewingSubmission(submission.id)}>
                    View Feedback
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {submissions?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              No feedback received yet. Your mentors will submit feedback soon!
            </p>
          </div>
        )}
      </div>

      {/* View Feedback Dialog */}
      {submissionDetail && (
        <Dialog
          open={!!viewingSubmission}
          onClose={() => setViewingSubmission(null)}
          title="Feedback Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="pb-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {submissionDetail.feedbackForm.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                From: {submissionDetail.mentor.name || submissionDetail.mentor.email}
              </p>
              <p className="text-sm text-gray-600">
                Event: {submissionDetail.event.name}
              </p>
              <p className="text-sm text-gray-600">
                Submitted: {new Date(submissionDetail.submissionDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-6">
              {(submissionDetail.feedbackForm.questions as Question[]).map((question, index) => {
                const answer = (submissionDetail.answers as Record<string, any>)[question.id];

                return (
                  <div key={question.id} className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {index + 1}. {question.label}
                    </p>
                    <div className="pl-6">
                      {question.type === "rating" && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600">{answer}</span>
                          <span className="text-sm text-gray-500">
                            / {question.maxRating}
                          </span>
                        </div>
                      )}
                      {question.type !== "rating" && (
                        <p className="text-gray-700">{answer || "(No answer provided)"}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setViewingSubmission(null)}>Close</Button>
            </div>
          </div>
        </Dialog>
      )}
    </ProtectedLayout>
  );
}
