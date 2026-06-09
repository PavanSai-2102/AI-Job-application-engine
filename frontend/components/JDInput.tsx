"use client";

import React from "react";
import { useTailoringSession } from "../context/TailoringSessionContext";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

import { toast } from "sonner";

export function JDInput() {
  const { state, dispatch } = useTailoringSession();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: "SET_INPUTS",
      payload: { resumeText: state.resumeText, jdText: e.target.value },
    });
  };

  const handleLoadSample = async () => {
    try {
      const res = await fetch("/sample/sample-jd.txt");
      const text = await res.text();
      dispatch({
        type: "SET_INPUTS",
        payload: { resumeText: state.resumeText, jdText: text },
      });
      toast.success("Sample JD loaded");
    } catch (error) {
      toast.error("Failed to load sample JD");
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Job Description</label>
        <Button variant="ghost" size="sm" onClick={handleLoadSample}>
          Load Sample
        </Button>
      </div>
      
      <Textarea
        placeholder="Paste the target job description here..."
        className="flex-1 min-h-[300px] text-sm resize-none"
        value={state.jdText}
        onChange={handleTextChange}
        maxLength={10000}
      />
      
      <div className="text-xs text-muted-foreground text-right">
        {state.jdText.length} / 5,000 characters
      </div>
    </div>
  );
}
