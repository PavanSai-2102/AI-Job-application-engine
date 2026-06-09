"use client";

import { useEffect, useRef } from "react";
import { useTailoringSession } from "@/context/TailoringSessionContext";

export function TailorInitializer({ 
  resumeText, 
  jdText, 
  applicationId 
}: { 
  resumeText: string; 
  jdText: string; 
  applicationId: string | null; 
}) {
  const { dispatch } = useTailoringSession();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!initialized.current && (resumeText || jdText || applicationId)) {
      dispatch({ 
        type: "SET_INPUTS", 
        payload: { resumeText, jdText, applicationId } 
      });
      initialized.current = true;
    }
  }, [resumeText, jdText, applicationId, dispatch]);
  
  return null;
}
