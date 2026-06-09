import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TailoredResume, ResumeProfile, MatchScore, JobDescriptionProfile, GapAnalysis } from "../../types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#333333",
  },
  header: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  scoreGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  scoreBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginBottom: 10,
  },
  gapItem: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
  },
  gapHigh: { borderLeftColor: "#ef4444" },
  gapMedium: { borderLeftColor: "#f59e0b" },
  gapLow: { borderLeftColor: "#94a3b8" },
  gapName: {
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  gapAction: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#475569",
  },
  jobSection: {
    marginBottom: 15,
  },
  jobHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  bulletCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  bulletColHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 9,
    marginBottom: 4,
  },
  bulletMeta: {
    fontSize: 8,
    color: "#3b82f6",
    fontStyle: "italic",
  },
  footerText: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#888888",
  }
});

interface ComparisonPDFProps {
  originalScore: MatchScore;
  tailoredScore: MatchScore;
  tailoredResume: TailoredResume;
  jd: JobDescriptionProfile;
  gapAnalysis: GapAnalysis;
}

export function ComparisonPDF({
  originalScore,
  tailoredScore,
  tailoredResume,
  jd,
  gapAnalysis,
}: ComparisonPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tailoring Analysis Report</Text>
          <Text style={styles.subtitle}>Target Role: {jd.jobTitle} at {jd.company || "Unknown Company"}</Text>
        </View>

        {/* Scores */}
        <View style={styles.scoreGrid}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Original Match</Text>
            <Text style={styles.scoreValue}>{originalScore.overallScore}/100</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Tailored Match</Text>
            <Text style={styles.scoreValue}>{tailoredScore.overallScore}/100</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Skill Match</Text>
            <Text style={styles.scoreValue}>{tailoredScore.skillCoverageScore}/100</Text>
          </View>
        </View>

        {/* Gaps */}
        {gapAnalysis.gaps && gapAnalysis.gaps.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Identified Gaps</Text>
            {gapAnalysis.gaps.map((gap, i) => (
              <View 
                key={i} 
                style={[
                  styles.gapItem,
                  gap.importance === "high" ? styles.gapHigh : 
                  gap.importance === "medium" ? styles.gapMedium : styles.gapLow
                ]}
              >
                <Text style={styles.gapName}>{gap.name}</Text>
                <Text style={styles.gapAction}>Action: {gap.suggestedAction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bullet Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bullet Point Rewrites</Text>
          {tailoredResume.tailoredExperience?.map((job, idx) => (
            <View key={idx} style={styles.jobSection}>
              <Text style={styles.jobHeader}>{job.title} at {job.company}</Text>
              
              {job.bullets.map((bullet, bIdx) => (
                <View key={bIdx} style={styles.bulletRow} wrap={false}>
                  <View style={styles.bulletCol}>
                    <Text style={styles.bulletColHeader}>Original</Text>
                    <Text style={styles.bulletText}>{bullet.original}</Text>
                  </View>
                  <View style={styles.bulletCol}>
                    <Text style={styles.bulletColHeader}>Tailored</Text>
                    <Text style={styles.bulletText}>{bullet.tailored}</Text>
                    <Text style={styles.bulletMeta}>Reason: {bullet.changeReason}</Text>
                    {bullet.keywordsAddressed && bullet.keywordsAddressed.length > 0 && (
                      <Text style={styles.bulletMeta}>Keywords: {bullet.keywordsAddressed.join(", ")}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footerText} fixed>
          Generated by Resume Shapeshifter. Review all content before use. Ensure truthfulness of all tailored claims.
        </Text>
      </Page>
    </Document>
  );
}
