import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { TailoredResume, ResumeProfile } from "../../types";

// Standard styling for ATS-friendly PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#000000",
  },
  header: {
    marginBottom: 15,
    textAlign: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: "#333333",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  contactItem: {
    marginRight: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#EAEAEA",
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  summary: {
    marginBottom: 10,
    textAlign: "justify",
  },
  experienceItem: {
    marginBottom: 10,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  company: {
    fontWeight: "bold",
  },
  title: {
    fontStyle: "italic",
  },
  dates: {
    fontSize: 9,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 10,
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    textAlign: "justify",
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillGroup: {
    width: "100%",
    marginBottom: 4,
  }
});

interface TailoredResumePDFProps {
  originalProfile: ResumeProfile;
  tailoredResume: TailoredResume;
}

export function TailoredResumePDF({ originalProfile, tailoredResume }: TailoredResumePDFProps) {
  const { contact, education, certifications, projects } = originalProfile;
  // Hard filter to prevent AI overlap bugs between courses and certifications
  const courses = (originalProfile.courses || []).filter(c => !(certifications || []).includes(c));
  
  // Format contact info
  const contactParts = [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.linkedin,
    contact?.github
  ].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{contact?.name || "Candidate"}</Text>
          <View style={styles.contact}>
            {contactParts.map((part, i) => (
              <Text key={i} style={styles.contactItem}>
                {part}{i < contactParts.length - 1 ? "  |  " : ""}
              </Text>
            ))}
          </View>
        </View>

        {/* Summary */}
        {tailoredResume.tailoredSummary && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{tailoredResume.tailoredSummary}</Text>
          </View>
        )}

        {/* Skills */}
        {tailoredResume.tailoredSkills && tailoredResume.tailoredSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={{ textAlign: "justify", lineHeight: 1.5 }}>
              {tailoredResume.tailoredSkills.join(", ")}
            </Text>
          </View>
        )}

        {/* Experience */}
        {tailoredResume.tailoredExperience && tailoredResume.tailoredExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {tailoredResume.tailoredExperience.map((job, idx) => {
              // Find matching original job for dates
              const originalJob = originalProfile.experience?.find(
                (e) => e.company === job.company && e.title === job.title
              );
              
              return (
                <View key={idx} style={styles.experienceItem} wrap={false}>
                  <View style={styles.experienceHeader}>
                    <View>
                      <Text style={[styles.title, { fontStyle: "normal", fontWeight: "bold" }]}>{job.title}</Text>
                      <Text style={[styles.company, { fontWeight: "normal", fontStyle: "italic" }]}>{job.company}</Text>
                    </View>
                    <View>
                      <Text style={styles.dates}>
                        {originalJob?.startDate} - {originalJob?.endDate}
                      </Text>
                    </View>
                  </View>
                  
                  {job.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet.tailored}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project, idx) => (
              <View key={idx} style={styles.experienceItem} wrap={false}>
                <Text style={styles.company}>{project.name}</Text>
                {project.description && <Text style={{ marginBottom: 2, textAlign: "justify" }}>{project.description}</Text>}
                {project.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.experienceItem} wrap={false}>
                <View style={styles.experienceHeader}>
                  <View>
                    <Text style={[styles.title, { fontStyle: "normal", fontWeight: "bold" }]}>{edu.degree}</Text>
                    <Text style={[styles.company, { fontWeight: "normal", fontStyle: "italic" }]}>{edu.institution}</Text>
                  </View>
                  <View>
                    <Text style={styles.dates}>{edu.graduationDate}</Text>
                  </View>
                </View>
                {/* CGPA and Domain Bullet */}
                {(edu.cgpa || edu.field) && (
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>
                      {[
                        edu.cgpa ? `CGPA: ${edu.cgpa}` : null,
                        edu.field ? `Domain: ${edu.field}` : null
                      ].filter(Boolean).join(" | ")}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Courses */}
        {courses && courses.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Courses</Text>
            {courses.map((course, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{course}</Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
}
