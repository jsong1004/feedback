"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type ImageUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpload: (imageData: string) => Promise<void>;
  isUploading: boolean;
};

export function ImageUploadDialog({
  open,
  onClose,
  onUpload,
  isUploading,
}: ImageUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);

    if (acceptedFiles.length === 0) {
      setError("No valid image file selected");
      return;
    }

    const file = acceptedFiles[0];

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setError("Image size must be less than 4MB. Please compress your image.");
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
    };

    reader.onerror = () => {
      setError("Failed to read image file");
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    multiple: false,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!preview) return;

    try {
      setError(null);
      await onUpload(preview);
      // Reset state on success
      setPreview(null);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setPreview(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Import Form from Image" size="lg">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📸 How to use AI Form Recognition
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Upload a clear photo or scan of your paper form</li>
            <li>• AI will automatically detect questions and their types</li>
            <li>• Review and edit extracted questions before saving</li>
            <li>• Supported: text, multiple choice, ratings, and more</li>
          </ul>
        </div>

        {/* Upload Area */}
        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-6xl">📄</div>
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  Drop your form image here...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-700">
                    Drag & drop your form image here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse files</p>
                </>
              )}
              <p className="text-xs text-gray-400">
                PNG or JPEG • Max 4MB • Best with clear, well-lit images
              </p>
            </div>
          </div>
        ) : (
          // Preview Area
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <img
                src={preview}
                alt="Form preview"
                className="max-w-full max-h-96 mx-auto rounded shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>✓ Image loaded successfully</span>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isUploading}
              >
                Choose different image
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error:</span> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <Spinner size="lg" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  AI is analyzing your form...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This may take 5-10 seconds. Please wait.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!preview || isUploading}
            isLoading={isUploading}
          >
            {isUploading ? "Processing..." : "Extract Questions"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
