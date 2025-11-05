"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

type Question = {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "rating";
  label: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
};

export default function SubmitFeedbackPage({
  params,
}: {
  params: { eventId: string; menteeId: string };
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const { data: event, isLoading } = trpc.event.getById.useQuery({
    id: params.eventId,
  });

  const { data: form } = trpc.feedbackForm.getById.useQuery(
    { id: event?.feedbackFormId || "" },
    { enabled: !!event?.feedbackFormId }
  );

  const submitMutation = trpc.feedbackSubmission.submit.useMutation({
    onSuccess: () => {
      addToast("Feedback submitted successfully!", "success");
      router.push("/mentor/dashboard");
    },
    onError: (error) => {
      addToast(error.message || "Failed to submit feedback", "error");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitMutation.mutateAsync({
      menteeId: params.menteeId,
      eventId: params.eventId,
      answers,
    });
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  if (isLoading || !event || !form) {
    return (
      <ProtectedLayout requiredRoles={["mentor", "organizer", "admin"]}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </ProtectedLayout>
    );
  }

  const questions = form.questions as Question[];

  return (
    <ProtectedLayout requiredRoles={["mentor", "organizer", "admin"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="text-gray-600 mt-2">Event: {event.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{form.name}</h2>
            {form.description && (
              <p className="text-sm text-gray-600 mt-1">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <QuestionRenderer
                  question={question}
                  index={index}
                  value={answers[question.id]}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submitMutation.isPending}>
                Submit Feedback
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function QuestionRenderer({
  question,
  index,
  value,
  onChange,
}: {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
}) {
  const id = `question-${question.id}`;
  const label = `${index + 1}. ${question.label}`;

  switch (question.type) {
    case "text":
      return (
        <Input
          id={id}
          label={label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      );

    case "textarea":
      return (
        <Textarea
          id={id}
          label={label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          rows={4}
        />
      );

    case "select":
      return (
        <Select
          id={id}
          label={label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          options={
            question.options?.map((opt) => ({ value: opt, label: opt })) || []
          }
          required={question.required}
        />
      );

    case "radio":
      return (
        <RadioGroup
          id={id}
          label={label}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={
            question.options?.map((opt) => ({ value: opt, label: opt })) || []
          }
          required={question.required}
        />
      );

    case "rating":
      return (
        <RatingInput
          id={id}
          label={label}
          value={value}
          onChange={onChange}
          min={question.minRating || 1}
          max={question.maxRating || 5}
          required={question.required}
        />
      );

    default:
      return null;
  }
}

function RatingInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  required,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2 items-center">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-lg border-2 font-semibold transition-colors ${
              value === rating
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {min} = Lowest, {max} = Highest
      </p>
    </div>
  );
}
