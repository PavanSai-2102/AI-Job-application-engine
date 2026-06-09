"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  GapAnalysis,
  TailoringRun,
} from "../types";

export type SessionStatus =
  | "idle"
  | "parsing"
  | "scoring"
  | "tailoring"
  | "done"
  | "error";

export interface TailoringSessionState {
  applicationId?: string | null;
  resumeText: string;
  jdText: string;
  parsedResume: ResumeProfile | null;
  parsedJD: JobDescriptionProfile | null;
  originalScore: MatchScore | null;
  tailoredResume: TailoredResume | null;
  tailoredScore: MatchScore | null;
  gapAnalysis: GapAnalysis | null;
  status: SessionStatus;
  errorMessage: string | null;
}

const initialState: TailoringSessionState = {
  applicationId: null,
  resumeText: "",
  jdText: "",
  parsedResume: null,
  parsedJD: null,
  originalScore: null,
  tailoredResume: null,
  tailoredScore: null,
  gapAnalysis: null,
  status: "idle",
  errorMessage: null,
};

type Action =
  | { type: "SET_INPUTS"; payload: { resumeText: string; jdText: string; applicationId?: string | null } }
  | {
      type: "SET_PARSED";
      payload: { resume: ResumeProfile; jd: JobDescriptionProfile };
    }
  | { type: "SET_ORIGINAL_SCORE"; payload: MatchScore }
  | {
      type: "SET_TAILORED";
      payload: {
        tailoredResume: TailoredResume;
        tailoredScore: MatchScore;
        gapAnalysis: GapAnalysis;
      };
    }
  | { type: "SET_STATUS"; payload: SessionStatus }
  | { type: "SET_ERROR"; payload: string }
  | { type: "LOAD_RUN"; payload: TailoringRun }
  | { type: "RESET" };

function sessionReducer(
  state: TailoringSessionState,
  action: Action
): TailoringSessionState {
  switch (action.type) {
    case "SET_INPUTS":
      return {
        ...state,
        resumeText: action.payload.resumeText,
        jdText: action.payload.jdText,
        applicationId: action.payload.applicationId ?? state.applicationId,
      };
    case "SET_PARSED":
      return {
        ...state,
        parsedResume: action.payload.resume,
        parsedJD: action.payload.jd,
      };
    case "SET_ORIGINAL_SCORE":
      return {
        ...state,
        originalScore: action.payload,
      };
    case "SET_TAILORED":
      return {
        ...state,
        tailoredResume: action.payload.tailoredResume,
        tailoredScore: action.payload.tailoredScore,
        gapAnalysis: action.payload.gapAnalysis,
      };
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
        errorMessage: action.payload === "error" ? state.errorMessage : null,
      };
    case "SET_ERROR":
      return {
        ...state,
        status: "error",
        errorMessage: action.payload,
      };
    case "LOAD_RUN":
      return {
        resumeText: action.payload.resumeRaw,
        jdText: action.payload.jdRaw,
        parsedResume: action.payload.parsedResume,
        parsedJD: action.payload.parsedJD,
        originalScore: action.payload.originalScore,
        tailoredResume: action.payload.tailoredResume,
        tailoredScore: action.payload.tailoredScore,
        gapAnalysis: action.payload.gapAnalysis,
        status: "done",
        errorMessage: null,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface TailoringSessionContextProps {
  state: TailoringSessionState;
  dispatch: React.Dispatch<Action>;
}

const TailoringSessionContext = createContext<
  TailoringSessionContextProps | undefined
>(undefined);

export function TailoringSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  return (
    <TailoringSessionContext.Provider value={{ state, dispatch }}>
      {children}
    </TailoringSessionContext.Provider>
  );
}

export function useTailoringSession() {
  const context = useContext(TailoringSessionContext);
  if (context === undefined) {
    throw new Error(
      "useTailoringSession must be used within a TailoringSessionProvider"
    );
  }
  return context;
}
