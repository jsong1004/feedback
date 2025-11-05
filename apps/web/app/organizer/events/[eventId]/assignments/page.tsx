"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

type AssignmentInput = {
  menteeEmail: string;
  mentorEmail: string;
};

export default function EventAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const eventId = params.eventId as string;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentInput[]>([
    { menteeEmail: "", mentorEmail: "" },
  ]);

  const { data: event, isLoading: eventLoading } = trpc.event.getById.useQuery({
    id: eventId,
  });

  const {
    data: existingAssignments,
    isLoading: assignmentsLoading,
    refetch,
  } = trpc.menteeAssignment.getAssignmentsForEvent.useQuery({
    eventId,
  });

  const bulkAssignMutation = trpc.menteeAssignment.bulkAssign.useMutation({
    onSuccess: (data) => {
      if (data.successCount > 0) {
        addToast(
          `Successfully created ${data.successCount} assignment(s)`,
          "success"
        );
      }
      if (data.errorCount > 0) {
        addToast(
          `${data.errorCount} assignment(s) failed. Check details.`,
          "error"
        );
      }
      setShowCreateDialog(false);
      setAssignments([{ menteeEmail: "", mentorEmail: "" }]);
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to create assignments", "error");
    },
  });

  const removeAssignmentMutation =
    trpc.menteeAssignment.removeAssignment.useMutation({
      onSuccess: () => {
        addToast("Assignment removed successfully", "success");
        refetch();
      },
      onError: (error) => {
        addToast(error.message || "Failed to remove assignment", "error");
      },
    });

  const handleAddRow = () => {
    setAssignments([...assignments, { menteeEmail: "", mentorEmail: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    index: number,
    field: "menteeEmail" | "mentorEmail",
    value: string
  ) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields are filled
    const validAssignments = assignments.filter(
      (a) => a.menteeEmail.trim() && a.mentorEmail.trim()
    );

    if (validAssignments.length === 0) {
      addToast("Please add at least one assignment", "error");
      return;
    }

    await bulkAssignMutation.mutateAsync({
      eventId,
      assignments: validAssignments,
    });
  };

  const handleRemoveAssignment = async (id: string, menteeName: string) => {
    if (confirm(`Remove assignment for ${menteeName}?`)) {
      await removeAssignmentMutation.mutateAsync({ id });
    }
  };

  if (eventLoading || assignmentsLoading) {
    return (
      <ProtectedLayout requiredRoles={["organizer", "admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  if (!event) {
    return (
      <ProtectedLayout requiredRoles={["organizer", "admin"]}>
        <div className="text-center py-12">
          <p className="text-gray-500">Event not found</p>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout requiredRoles={["organizer", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/organizer/events")}
              className="mb-2"
            >
              ← Back to Events
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Assignments
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {event.name} • {new Date(event.startDate).toLocaleDateString()} -{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Assignments
          </Button>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Assignments ({existingAssignments?.length || 0})
            </h2>
          </div>

          {existingAssignments && existingAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {existingAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.mentee.name || assignment.mentee.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.mentee.email}
                        </div>
                        {assignment.mentee.companyName && (
                          <div className="text-xs text-gray-400">
                            {assignment.mentee.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.mentor.name || assignment.mentor.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.mentor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleRemoveAssignment(
                              assignment.id,
                              assignment.mentee.name || assignment.mentee.email
                            )
                          }
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                No assignments yet. Create your first assignment!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Assignments Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create Assignments"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              How it works:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter email addresses for mentees and their mentors</li>
              <li>• New users will receive an invitation to sign in</li>
              <li>• Existing users will receive a notification</li>
              <li>• Multiple mentors can be assigned to one mentee</li>
            </ul>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="col-span-5">
                  <Input
                    id={`mentee-${index}`}
                    label={index === 0 ? "Mentee Email" : undefined}
                    type="email"
                    placeholder="mentee@example.com"
                    value={assignment.menteeEmail}
                    onChange={(e) =>
                      handleInputChange(index, "menteeEmail", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    id={`mentor-${index}`}
                    label={index === 0 ? "Mentor Email" : undefined}
                    type="email"
                    placeholder="mentor@example.com"
                    value={assignment.mentorEmail}
                    onChange={(e) =>
                      handleInputChange(index, "mentorEmail", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  {assignments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(index)}
                      className="mt-6"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddRow}
            className="w-full"
          >
            + Add Another Assignment
          </Button>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={bulkAssignMutation.isPending}>
              Create & Send Notifications
            </Button>
          </div>
        </form>
      </Dialog>
    </ProtectedLayout>
  );
}
