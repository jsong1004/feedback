"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

export default function OrganizerEventsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    feedbackFormId: "",
  });

  const { data: events, isLoading, refetch } = trpc.event.getMyEvents.useQuery();
  const { data: forms } = trpc.feedbackForm.getAll.useQuery();

  const createMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      addToast("Event created successfully", "success");
      setShowCreateDialog(false);
      setFormData({ name: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", feedbackFormId: "" });
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to create event", "error");
    },
  });

  const updateMutation = trpc.event.update.useMutation({
    onSuccess: () => {
      addToast("Event updated successfully", "success");
      setShowEditDialog(false);
      setEditingEventId(null);
      setFormData({ name: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", feedbackFormId: "" });
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to update event", "error");
    },
  });

  const deleteMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      addToast("Event deleted successfully", "success");
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to delete event", "error");
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);

    await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      feedbackFormId: formData.feedbackFormId,
    });
  };

  const handleEdit = (event: any) => {
    setEditingEventId(event.id);

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    setFormData({
      name: event.name,
      description: event.description || "",
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5), // HH:MM format
      endDate: endDate.toISOString().split('T')[0],
      endTime: endDate.toTimeString().slice(0, 5), // HH:MM format
      feedbackFormId: event.feedbackForm.id,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;

    // Combine date and time
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);

    await updateMutation.mutateAsync({
      id: editingEventId,
      name: formData.name,
      description: formData.description || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout requiredRoles={["organizer", "admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout requiredRoles={["organizer", "admin"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <Button onClick={() => setShowCreateDialog(true)}>Create Event</Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Start:</span>
                  <span className="font-medium">
                    {new Date(event.startDate).toLocaleDateString()} {new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End:</span>
                  <span className="font-medium">
                    {new Date(event.endDate).toLocaleDateString()} {new Date(event.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Form:</span>
                  <span className="font-medium text-blue-600">
                    {event.feedbackForm.name}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assignments:</span>
                  <span className="font-medium">{event._count.menteeAssignments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submissions:</span>
                  <span className="font-medium">{event._count.feedbackSubmissions}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/organizer/events/${event.id}/assignments`)}
                >
                  Manage Assignments
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(event)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(event.id, event.name)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events?.events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No events yet. Create your first event!</p>
          </div>
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create New Event"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Q1 2025 Mentorship Program"
          />

          <Textarea
            id="description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the event"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="startDate"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              id="startTime"
              label="Start Time (24h)"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="14:30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="endDate"
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
            <Input
              id="endTime"
              label="End Time (24h)"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              placeholder="16:00"
              required
            />
          </div>

          <Select
            id="feedbackFormId"
            label="Feedback Form"
            value={formData.feedbackFormId}
            onChange={(e) => setFormData({ ...formData, feedbackFormId: e.target.value })}
            options={
              forms?.map((form) => ({
                value: form.id,
                label: form.name,
              })) || []
            }
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Event
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEventId(null);
          setFormData({ name: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", feedbackFormId: "" });
        }}
        title="Edit Event"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            id="edit-name"
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Q1 2025 Mentorship Program"
          />

          <Textarea
            id="edit-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the event"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="edit-startDate"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              id="edit-startTime"
              label="Start Time (24h)"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="14:30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="edit-endDate"
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
            <Input
              id="edit-endTime"
              label="End Time (24h)"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              placeholder="16:00"
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Current Form</p>
            <p className="text-sm text-gray-500 mt-1">
              {forms?.find((f) => f.id === formData.feedbackFormId)?.name || "Unknown"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Note: Feedback form cannot be changed after event creation
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditDialog(false);
                setEditingEventId(null);
                setFormData({ name: "", description: "", startDate: "", startTime: "", endDate: "", endTime: "", feedbackFormId: "" });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Event
            </Button>
          </div>
        </form>
      </Dialog>
    </ProtectedLayout>
  );
}
