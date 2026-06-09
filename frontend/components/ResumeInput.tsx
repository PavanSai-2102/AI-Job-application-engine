"use client";

import React, { useState, useRef } from "react";
import { useTailoringSession } from "../context/TailoringSessionContext";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Upload, FileUp, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export function ResumeInput() {
  const { state, dispatch } = useTailoringSession();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: "SET_INPUTS",
      payload: { resumeText: e.target.value, jdText: state.jdText },
    });
    // Clear the uploaded file name if user manually edits
    if (uploadedFileName) setUploadedFileName(null);
  };

  const handleFileUpload = async (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please upload a PDF or DOCX file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 5MB." });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      dispatch({
        type: "SET_INPUTS",
        payload: { resumeText: data.text, jdText: state.jdText },
      });
      setUploadedFileName(file.name);
      toast.success("Resume parsed successfully!", { description: `Extracted text from ${file.name}` });
    } catch (error: any) {
      toast.error("Failed to parse resume", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadSample = async () => {
    try {
      const res = await fetch("/sample/sample-resume.txt");
      const text = await res.text();
      dispatch({
        type: "SET_INPUTS",
        payload: { resumeText: text, jdText: state.jdText },
      });
      setUploadedFileName(null);
      toast.success("Sample resume loaded");
    } catch (error) {
      toast.error("Failed to load sample resume");
    }
  };

  const handleClearFile = () => {
    dispatch({
      type: "SET_INPUTS",
      payload: { resumeText: "", jdText: state.jdText },
    });
    setUploadedFileName(null);
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Your Resume</label>
        <Button variant="ghost" size="sm" onClick={handleLoadSample}>
          Load Sample
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Upload Button — always visible */}
      {/* Upload Button / File indicator */}
      {uploadedFileName ? (
        <div className="w-full h-auto py-3 px-4 border-dashed border-2 border-primary/40 bg-primary/5 rounded-md flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-primary font-medium text-sm">{uploadedFileName}</span>
          <button
            type="button"
            className="ml-auto p-1 hover:bg-destructive/10 rounded-sm transition-colors"
            onClick={handleClearFile}
            aria-label="Remove uploaded file"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-auto py-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
          onClick={triggerFileDialog}
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Parsing file...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload PDF or DOCX</span>
            </div>
          )}
        </Button>
      )}

      {/* Drag & Drop zone around the textarea */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? "border-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(var(--primary-rgb,59,130,246),0.05)]"
            : "border-transparent"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm">
            <FileUp className="h-10 w-10 text-primary mb-2 animate-bounce" />
            <p className="text-sm font-medium text-primary">Drop your resume here</p>
          </div>
        )}

        <Textarea
          placeholder="Or paste your resume text here..."
          className="min-h-[300px] font-mono text-sm resize-y border-muted"
          value={state.resumeText}
          onChange={handleTextChange}
          maxLength={15000}
        />
      </div>

      <div className="text-xs text-muted-foreground text-right">
        {state.resumeText.length} / 10,000 characters
      </div>
    </div>
  );
}
