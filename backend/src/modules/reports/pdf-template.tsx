import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#D97706',
  Medium: '#D97706',
  Low: '#16A34A',
}

function getCvssSeverity(score: number): { label: string; color: string } {
  if (score >= 9.0) return { label: 'Critical', color: SEVERITY_COLORS.Critical }
  if (score >= 7.0) return { label: 'High', color: SEVERITY_COLORS.High }
  if (score >= 4.0) return { label: 'Medium', color: SEVERITY_COLORS.Medium }
  return { label: 'Low', color: SEVERITY_COLORS.Low }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  cover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  coverMeta: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryBox: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelCard: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginBottom: 16,
    padding: 14,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginLeft: 10,
  },
  severityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metricBox: {
    width: '33%',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricValueMono: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#111827',
  },
  remediationBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 3,
    padding: 10,
    marginTop: 6,
  },
  remediationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  remediationText: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  performanceGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  perfBox: {
    width: '33%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
})

interface LevelReportData {
  level: {
    title: string
    vulnCategory: string
    owaspCategory: string
    mitreTechniqueId: string
    mitreTechniqueName: string
    cvssBaseVector: string
    cvssScore: number
    cweId: string
    cweTitle: string
    difficulty: string
    points: number
    remediation: string
  }
  progress: {
    attempts: number
    score: number
    bestTime: string | null
    startedAt: string | null
    completedAt: string | null
  }
  hintsUsed: Array<{
    hintId: string
    hintOrder: number
    penalty: number
    requestedAt: string
  }>
}

interface ReportData {
  totalScore: number
  totalTime: string
  levelsCompleted: number
  totalLevels: number
  averageCvss: number | string
  levelReports: LevelReportData[]
  userName?: string
  generatedAt?: string
}

export function ReportPdf({ data }: { data: ReportData }) {
  const generatedAt = data.generatedAt || new Date().toISOString().split('T')[0]
  const userName = data.userName || 'Trainee'

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverTitle}>SentinelChain</Text>
          <Text style={styles.coverSubtitle}>Security Assessment Report</Text>
          <View style={styles.divider} />
          <Text style={styles.coverMeta}>Prepared for: {userName}</Text>
          <Text style={styles.coverMeta}>Date: {generatedAt}</Text>
          <Text style={styles.coverMeta}>
            Classification: CONFIDENTIAL
          </Text>
          <View style={[styles.divider, { marginTop: 40 }]} />
          <Text style={[styles.coverMeta, { fontSize: 9, color: '#9CA3AF', marginTop: 10 }]}>
            This report documents the results of a gamified security assessment
            covering OWASP Top 10 vulnerability classes.
          </Text>
        </View>
      </Page>

      {/* Report Pages */}
      <Page size="A4" style={styles.page}>
        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.totalScore}</Text>
            <Text style={styles.summaryLabel}>Total Score</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.levelsCompleted}/{data.totalLevels}</Text>
            <Text style={styles.summaryLabel}>Levels Completed</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{data.averageCvss}</Text>
            <Text style={styles.summaryLabel}>Average CVSS</Text>
          </View>
        </View>
        <Text style={[styles.remediationText, { marginBottom: 20 }]}>
          This assessment validates knowledge of web security vulnerabilities and exploitation techniques. The trainee demonstrated proficiency in identifying and exploiting {data.levelsCompleted} vulnerability class(es) and understanding remediation approaches.
        </Text>

        {/* Vulnerability Details */}
        <Text style={styles.sectionTitle}>Vulnerability Assessment</Text>
        {data.levelReports.map((report, idx) => {
          const severity = getCvssSeverity(report.level.cvssScore)
          return (
            <View key={idx} style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelTitle}>{report.level.title}</Text>
                <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
                  <Text style={styles.severityText}>{severity.label}</Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>CVSS Score</Text>
                  <Text style={[styles.metricValue, { color: severity.color }]}>
                    {report.level.cvssScore}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>OWASP</Text>
                  <Text style={styles.metricValueMono}>{report.level.owaspCategory}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>CWE</Text>
                  <Text style={styles.metricValueMono}>{report.level.cweId}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>MITRE ATT&CK</Text>
                  <Text style={styles.metricValueMono}>{report.level.mitreTechniqueId}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>CWE Definition</Text>
                  <Text style={styles.metricValue}>{report.level.cweTitle}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>MITRE Technique</Text>
                  <Text style={styles.metricValue}>{report.level.mitreTechniqueName}</Text>
                </View>
              </View>

              <View style={styles.remediationBox}>
                <Text style={styles.remediationTitle}>Recommended Remediation</Text>
                <Text style={styles.remediationText}>{report.level.remediation}</Text>
              </View>

              <View style={styles.performanceGrid}>
                <View style={styles.perfBox}>
                  <Text style={styles.metricLabel}>Time Spent</Text>
                  <Text style={styles.metricValueMono}>{report.progress.bestTime || '\u2014'}</Text>
                </View>
                <View style={styles.perfBox}>
                  <Text style={styles.metricLabel}>Attempts</Text>
                  <Text style={styles.metricValueMono}>{report.progress.attempts}</Text>
                </View>
                <View style={styles.perfBox}>
                  <Text style={styles.metricLabel}>Hints Used</Text>
                  <Text style={styles.metricValueMono}>{report.hintsUsed.length}/3</Text>
                </View>
              </View>
            </View>
          )
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SentinelChain Security Assessment</Text>
          <Text style={styles.footerText}>Page 2</Text>
        </View>
      </Page>
    </Document>
  )
}
