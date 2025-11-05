"use client";

import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUploadDialog } from "@/components/forms/ImageUploadDialog";

type Question = {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "rating";
  label: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
};

export default function OrganizerFormsPage() {
  const { addToast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data: forms, isLoading, refetch } = trpc.feedbackForm.getMyForms.useQuery();

  const createMutation = trpc.feedbackForm.create.useMutation({
    onSuccess: () => {
      addToast("Feedback form created successfully", "success");
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      setQuestions([]);
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to create form", "error");
    },
  });

  const updateMutation = trpc.feedbackForm.update.useMutation({
    onSuccess: () => {
      addToast("Feedback form updated successfully", "success");
      setShowEditDialog(false);
      setEditingFormId(null);
      setFormData({ name: "", description: "" });
      setQuestions([]);
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to update form", "error");
    },
  });

  const deleteMutation = trpc.feedbackForm.delete.useMutation({
    onSuccess: () => {
      addToast("Feedback form deleted successfully", "success");
      refetch();
    },
    onError: (error) => {
      addToast(error.message || "Failed to delete form", "error");
    },
  });

  const extractFromImageMutation = trpc.feedbackForm.extractFromImage.useMutation({
    onSuccess: (data) => {
      addToast(`Successfully extracted ${data.count} questions from image!`, "success");
      setQuestions(data.questions as Question[]);
      setShowImageUploadDialog(false);
      setShowCreateDialog(true);
    },
    onError: (error) => {
      addToast(error.message || "Failed to extract questions from image", "error");
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      addToast("Please add at least one question", "error");
      return;
    }

    await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      questions,
    });
  };

  const addQuestion = () => {
    setEditingQuestion({
      id: `q${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    });
  };

  const saveQuestion = (question: Question) => {
    if (questions.find((q) => q.id === question.id)) {
      setQuestions(questions.map((q) => (q.id === question.id ? question : q)));
    } else {
      setQuestions([...questions, question]);
    }
    setEditingQuestion(null);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleEdit = (form: any) => {
    setEditingFormId(form.id);
    setFormData({
      name: form.name,
      description: form.description || "",
    });
    setQuestions(form.questions as Question[]);
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormId) return;

    if (questions.length === 0) {
      addToast("Please add at least one question", "error");
      return;
    }

    await updateMutation.mutateAsync({
      id: editingFormId,
      name: formData.name,
      description: formData.description || undefined,
      questions,
    });
  };

  const handleDelete = async (id: string, name: string, hasSubmissions: number) => {
    if (hasSubmissions > 0) {
      addToast("Cannot delete form that has existing submissions", "error");
      return;
    }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleImageUpload = async (imageData: string) => {
    await extractFromImageMutation.mutateAsync({ imageData });
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
          <h1 className="text-3xl font-bold text-gray-900">Feedback Forms</h1>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowImageUploadDialog(true)}
            >
              Import from Image
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>Create Form</Button>
          </div>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {forms?.forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                  {form.description && (
                    <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                  )}
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span>{(form.questions as any[]).length} questions</span>
                    <span>Used in {form._count.events} events</span>
                    <span>{form._count.submissions} submissions</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(form)}
                    disabled={form._count.submissions > 0}
                    title={form._count.submissions > 0 ? "Cannot edit form with existing submissions" : "Edit form"}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(form.id, form.name, form._count.submissions)}
                    disabled={form._count.events > 0}
                    title={form._count.events > 0 ? "Cannot delete form used in events" : "Delete form"}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {forms?.forms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              No feedback forms yet. Create your first form!
            </p>
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create Feedback Form"
        size="lg"
        disableClickOutside={!!editingQuestion}
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <Input
            id="name"
            label="Form Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="General Mentorship Feedback"
          />

          <Textarea
            id="description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this form"
            rows={2}
          />

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Questions</label>
              <Button type="button" size="sm" onClick={addQuestion}>
                Add Question
              </Button>
            </div>

            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded border"
                >
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question.label}</p>
                    <p className="text-xs text-gray-500">
                      Type: {question.type}
                      {question.required && " • Required"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingQuestion(question)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Form
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingFormId(null);
          setFormData({ name: "", description: "" });
          setQuestions([]);
        }}
        title="Edit Feedback Form"
        size="lg"
        disableClickOutside={!!editingQuestion}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <Input
            id="edit-name"
            label="Form Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="General Mentorship Feedback"
          />

          <Textarea
            id="edit-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this form"
            rows={2}
          />

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Questions</label>
              <Button type="button" size="sm" onClick={addQuestion}>
                Add Question
              </Button>
            </div>

            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded border"
                >
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question.label}</p>
                    <p className="text-xs text-gray-500">
                      Type: {question.type}
                      {question.required && " • Required"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingQuestion(question)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditDialog(false);
                setEditingFormId(null);
                setFormData({ name: "", description: "" });
                setQuestions([]);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Form
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        onUpload={handleImageUpload}
        isUploading={extractFromImageMutation.isPending}
      />
    </ProtectedLayout>
  );
}

function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(question);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onClose={onCancel} title="Edit Question" size="md" zIndex={60}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          id="type"
          label="Question Type"
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as any })
          }
          options={[
            { value: "text", label: "Short Text" },
            { value: "textarea", label: "Long Text" },
            { value: "select", label: "Dropdown" },
            { value: "radio", label: "Multiple Choice" },
            { value: "rating", label: "Rating Scale" },
          ]}
        />

        <Input
          id="label"
          label="Question Label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          required
          placeholder="How would you rate..."
        />

        <Checkbox
          id="required"
          label="Required question"
          checked={formData.required}
          onChange={(e) =>
            setFormData({ ...formData, required: e.target.checked })
          }
        />

        {(formData.type === "select" || formData.type === "radio") && (
          <Textarea
            id="options"
            label="Options (one per line)"
            value={formData.options?.join("\n") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                options: e.target.value.split("\n").filter((o) => o.trim()),
              })
            }
            rows={4}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        )}

        {formData.type === "rating" && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="minRating"
              label="Minimum"
              type="number"
              value={formData.minRating || 1}
              onChange={(e) =>
                setFormData({ ...formData, minRating: parseInt(e.target.value) })
              }
              min={1}
            />
            <Input
              id="maxRating"
              label="Maximum"
              type="number"
              value={formData.maxRating || 5}
              onChange={(e) =>
                setFormData({ ...formData, maxRating: parseInt(e.target.value) })
              }
              max={10}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Question</Button>
        </div>
      </form>
    </Dialog>
  );
}
