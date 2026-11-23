import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';

export const AcademicsScreen: React.FC = () => {
  const { user } = useAuth();
  const primaryRole = user?.roles?.[0]?.role || (user?.email?.startsWith('faculty') ? 'faculty' : 'student');

  if (primaryRole === 'faculty') {
    return <FacultyAcademicsView />;
  }

  return <StudentAcademicsView />;
};

// ============================================================================
// FACULTY / INSTRUCTOR ACADEMIC VIEW
// ============================================================================
function FacultyAcademicsView() {
  const [activeTab, setActiveTab] = useState<'rollcall' | 'grading' | 'corrections'>('rollcall');

  // Roll call student roster state
  const [studentsList, setStudentsList] = useState([
    { id: '1', roll: '23001001001', name: 'Rahul Sharma', status: 'present' },
    { id: '2', roll: '23001001002', name: 'Priya Verma', status: 'present' },
    { id: '3', roll: '23001001003', name: 'Amit Malik', status: 'absent' },
    { id: '4', roll: '23001001004', name: 'Sneha Patel', status: 'present' },
    { id: '5', roll: '23001001005', name: 'Karan Singh', status: 'excused' },
    { id: '6', roll: '23001001006', name: 'Divya Hooda', status: 'present' },
  ]);

  // Grading modal state
  const [gradingModal, setGradingModal] = useState<any | null>(null);
  const [givenScore, setGivenScore] = useState('18');
  const [feedback, setFeedback] = useState('Excellent schema normalization and indexing.');

  // Student submissions to grade
  const [submissions, setSubmissions] = useState([
    {
      id: 'sub1',
      studentName: 'Rahul Sharma',
      roll: '23001001001',
      assignment: 'SQL Normalization & BCNF Proof',
      submittedAt: 'Yesterday, 04:30 PM',
      maxScore: 20,
      currentScore: null,
      status: 'pending_review',
    },
    {
      id: 'sub2',
      studentName: 'Priya Verma',
      roll: '23001001002',
      assignment: 'SQL Normalization & BCNF Proof',
      submittedAt: '21 Nov, 11:20 AM',
      maxScore: 20,
      currentScore: 19,
      status: 'graded',
    },
    {
      id: 'sub3',
      studentName: 'Amit Malik',
      roll: '23001001003',
      assignment: 'Operating System Round Robin Simulation',
      submittedAt: '20 Nov, 09:15 PM',
      maxScore: 25,
      currentScore: null,
      status: 'pending_review',
    },
  ]);

  // Student Attendance Correction Claims
  const [correctionClaims, setCorrectionClaims] = useState([
    {
      id: 'c1',
      studentName: 'Rahul Sharma',
      roll: '23001001001',
      subject: 'CSE-301 DBMS',
      date: '18 Nov 2026 (09:00 AM)',
      reason: 'Was representing DCRUST at State Level Inter-University Hackathon with sports/OD sanction from Dean Student Welfare.',
      status: 'pending',
    },
    {
      id: 'c2',
      studentName: 'Amit Malik',
      roll: '23001001003',
      subject: 'CSE-301 DBMS',
      date: '15 Nov 2026 (11:15 AM)',
      reason: 'Biometric fingerprint reader timed out during class session entrance.',
      status: 'pending',
    },
  ]);

  const toggleStatus = (id: string) => {
    setStudentsList(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const next = s.status === 'present' ? 'absent' : s.status === 'absent' ? 'excused' : 'present';
        return { ...s, status: next };
      })
    );
  };

  const submitAttendance = () => {
    const presentCount = studentsList.filter(s => s.status === 'present').length;
    Alert.alert(
      'Attendance Submitted',
      `Class attendance recorded for CSE-301 Batch A.\n${presentCount} Present, ${studentsList.length - presentCount} Absent/Excused.\nRecords synced to examination ledger.`
    );
  };

  const saveGrade = () => {
    if (!gradingModal) return;
    setSubmissions(prev =>
      prev.map(s => (s.id === gradingModal.id ? { ...s, currentScore: Number(givenScore), status: 'graded' } : s))
    );
    Alert.alert('Grade Published', `Score ${givenScore}/${gradingModal.maxScore} published to student portal for ${gradingModal.studentName}.`);
    setGradingModal(null);
  };

  const handleCorrection = (id: string, action: 'approve' | 'reject') => {
    setCorrectionClaims(prev => prev.filter(c => c.id !== id));
    Alert.alert(
      action === 'approve' ? 'Correction Approved' : 'Claim Rejected',
      action === 'approve'
        ? 'Student attendance record updated to Present and recalculated.'
        : 'Student notified of rejected correction claim.'
    );
  };

  const presentCount = studentsList.filter(s => s.status === 'present').length;

  return (
    <View style={styles.container}>
      {/* Faculty Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rollcall' && styles.tabItemActive]}
          onPress={() => setActiveTab('rollcall')}
        >
          <MaterialCommunityIcons name="clipboard-check" size={18} color={activeTab === 'rollcall' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'rollcall' && styles.tabTextActive]}>Roll Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'grading' && styles.tabItemActive]}
          onPress={() => setActiveTab('grading')}
        >
          <MaterialCommunityIcons name="file-check-outline" size={18} color={activeTab === 'grading' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'grading' && styles.tabTextActive]}>Grading</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'corrections' && styles.tabItemActive]}
          onPress={() => setActiveTab('corrections')}
        >
          <MaterialCommunityIcons name="account-clock" size={18} color={activeTab === 'corrections' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'corrections' && styles.tabTextActive]}>Claims ({correctionClaims.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* TAB 1: MARK CLASS ROLL CALL */}
        {activeTab === 'rollcall' && (
          <View>
            <View style={styles.sessionSelectBanner}>
              <View>
                <Text style={styles.sessionTitle}>CSE-301: Database Management</Text>
                <Text style={styles.sessionSub}>Batch A • CV Raman Block Lab 3 • 09:00 AM</Text>
              </View>
              <Badge label={`${presentCount}/${studentsList.length} Present`} variant="success" />
            </View>

            <Text style={styles.dayHeading}>Student Attendance Roster (Tap row to toggle)</Text>

            {studentsList.map(s => {
              const isPresent = s.status === 'present';
              const isAbsent = s.status === 'absent';
              return (
                <TouchableOpacity key={s.id} activeOpacity={0.8} onPress={() => toggleStatus(s.id)}>
                  <Card style={[styles.rosterCard, isAbsent && styles.rosterCardAbsent]}>
                    <View style={styles.rosterLeft}>
                      <Text style={styles.rosterRoll}>{s.roll}</Text>
                      <Text style={styles.rosterName}>{s.name}</Text>
                    </View>

                    <View style={[styles.statusPill, isPresent ? styles.pillPresent : isAbsent ? styles.pillAbsent : styles.pillExcused]}>
                      <MaterialCommunityIcons
                        name={isPresent ? 'check-circle' : isAbsent ? 'close-circle' : 'clock-alert'}
                        size={16}
                        color={isPresent ? '#059669' : isAbsent ? '#DC2626' : '#D97706'}
                      />
                      <Text style={[styles.statusPillText, { color: isPresent ? '#065F46' : isAbsent ? '#991B1B' : '#92400E' }]}>
                        {s.status.toUpperCase()}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}

            <Button
              title="Submit & Lock Class Attendance"
              onPress={submitAttendance}
              size="lg"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* TAB 2: GRADING & SUBMISSIONS */}
        {activeTab === 'grading' && (
          <View>
            <Text style={styles.dayHeading}>Pending Assignment Submissions</Text>

            {submissions.map(sub => (
              <Card key={sub.id} style={styles.subCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.subStudentName}>{sub.studentName}</Text>
                    <Text style={styles.subRoll}>Roll: {sub.roll}</Text>
                  </View>
                  <Badge
                    label={sub.status === 'graded' ? `Graded: ${sub.currentScore}/${sub.maxScore}` : 'Pending Review'}
                    variant={sub.status === 'graded' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>

                <Text style={styles.subAssignTitle}>{sub.assignment}</Text>
                <Text style={styles.subTime}>Submitted: {sub.submittedAt}</Text>

                <Button
                  title={sub.status === 'graded' ? 'Edit Score' : 'Review & Enter Score'}
                  onPress={() => {
                    setGradingModal(sub);
                    setGivenScore(sub.currentScore ? String(sub.currentScore) : '18');
                  }}
                  size="sm"
                  variant={sub.status === 'graded' ? 'outline' : 'primary'}
                  style={{ marginTop: 10 }}
                />
              </Card>
            ))}
          </View>
        )}

        {/* TAB 3: ATTENDANCE CORRECTION CLAIMS */}
        {activeTab === 'corrections' && (
          <View>
            <Text style={styles.dayHeading}>Student Attendance Correction Requests</Text>

            {correctionClaims.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="check-all" size={48} color="#059669" />
                <Text style={styles.emptyText}>All student attendance claims have been resolved!</Text>
              </View>
            ) : (
              correctionClaims.map(c => (
                <Card key={c.id} style={styles.claimCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.subStudentName}>{c.studentName} ({c.roll})</Text>
                    <Badge label="CLAIM SUBMITTED" variant="warning" size="sm" />
                  </View>
                  <Text style={styles.claimSubject}>Subject: {c.subject} • Session: {c.date}</Text>
                  <Text style={styles.claimReason}>Justification: "{c.reason}"</Text>

                  <View style={styles.claimBtnRow}>
                    <Button
                      title="Reject"
                      variant="outline"
                      size="sm"
                      onPress={() => handleCorrection(c.id, 'reject')}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Approve & Mark Present"
                      size="sm"
                      onPress={() => handleCorrection(c.id, 'approve')}
                      style={{ flex: 2 }}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Grade Entry Modal */}
      <Modal visible={gradingModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Grade Student Submission</Text>
            <Text style={styles.modalSub}>{gradingModal?.studentName} • {gradingModal?.assignment}</Text>

            <Text style={styles.inputLabel}>Enter Score (Max {gradingModal?.maxScore} Points)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={givenScore}
              onChangeText={setGivenScore}
            />

            <Text style={styles.inputLabel}>Instructor Feedback Comment</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={feedback}
              onChangeText={setFeedback}
              multiline
            />

            <View style={styles.claimBtnRow}>
              <Button title="Cancel" variant="outline" onPress={() => setGradingModal(null)} style={{ flex: 1 }} />
              <Button title="Save & Publish Grade" onPress={saveGrade} style={{ flex: 1.5 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// STUDENT ACADEMIC VIEW (Timetable, My Attendance %, My Assignments)
// ============================================================================
function StudentAcademicsView() {
  const [activeTab, setActiveTab] = useState<'timetable' | 'attendance' | 'assignments'>('timetable');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionSubject, setCorrectionSubject] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const timetableData: Record<string, any[]> = {
    Monday: [
      { id: '1', time: '09:00 - 10:00', code: 'CSE-301', title: 'Database Management Systems', room: 'CV Raman Block Lab 3', faculty: 'Dr. S. Sharma' },
      { id: '2', time: '10:00 - 11:00', code: 'CSE-305', title: 'Theory of Computation', room: 'Saraswati Block 102', faculty: 'Dr. Neha Malik' },
      { id: '3', time: '11:15 - 12:15', code: 'CSE-303', title: 'Operating Systems', room: 'Saraswati Block 204', faculty: 'Prof. K. Verma' },
      { id: '4', time: '14:00 - 16:00', code: 'CSE-307', title: 'Networks Practical', room: 'Networking Lab', faculty: 'Er. A. Malik' },
    ],
    Tuesday: [
      { id: '5', time: '09:00 - 10:00', code: 'CSE-303', title: 'Operating Systems', room: 'Saraswati Block 204', faculty: 'Prof. K. Verma' },
      { id: '6', time: '10:00 - 11:00', code: 'CSE-309', title: 'Software Engineering', room: 'Aryabhata Hall 1', faculty: 'Dr. R. Hooda' },
    ],
    Wednesday: [
      { id: '7', time: '09:00 - 11:00', code: 'CSE-311', title: 'DBMS Project Lab', room: 'Computing Lab 2', faculty: 'Dr. S. Sharma' },
      { id: '8', time: '11:15 - 12:15', code: 'CSE-305', title: 'Theory of Computation', room: 'Saraswati Block 102', faculty: 'Dr. Neha Malik' },
    ],
    Thursday: [
      { id: '9', time: '10:00 - 11:00', code: 'CSE-301', title: 'Database Management Systems', room: 'CV Raman Block 201', faculty: 'Dr. S. Sharma' },
    ],
    Friday: [
      { id: '10', time: '09:00 - 10:00', code: 'CSE-305', title: 'Theory of Computation', room: 'Saraswati Block 102', faculty: 'Dr. Neha Malik' },
    ],
  };

  const attendanceData = [
    { code: 'CSE-301', name: 'Database Management Systems', attended: 24, total: 26, pct: 92 },
    { code: 'CSE-303', name: 'Operating Systems', attended: 21, total: 28, pct: 75 },
    { code: 'CSE-305', name: 'Theory of Computation', attended: 16, total: 24, pct: 67 },
    { code: 'CSE-307', name: 'Computer Networks Practical', attended: 12, total: 12, pct: 100 },
    { code: 'CSE-309', name: 'Software Engineering', attended: 20, total: 22, pct: 91 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'timetable' && styles.tabItemActive]}
          onPress={() => setActiveTab('timetable')}
        >
          <MaterialCommunityIcons name="calendar-clock" size={18} color={activeTab === 'timetable' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'timetable' && styles.tabTextActive]}>Timetable</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'attendance' && styles.tabItemActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color={activeTab === 'attendance' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'assignments' && styles.tabItemActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <MaterialCommunityIcons name="file-document-edit-outline" size={18} color={activeTab === 'assignments' ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.tabTextActive]}>Assignments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'timetable' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, selectedDay === day && styles.dayPillActive]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayPillText, selectedDay === day && styles.dayPillTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.dayHeading}>{selectedDay}'s Classes</Text>

            {(timetableData[selectedDay] || []).map(item => (
              <Card key={item.id} style={styles.timetableCard}>
                <View style={styles.timeBadgeCol}>
                  <Text style={styles.startTime}>{item.time.split(' - ')[0]}</Text>
                  <Text style={styles.endTime}>{item.time.split(' - ')[1]}</Text>
                </View>
                <View style={styles.courseInfoCol}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Badge label="Confirmed" variant="success" size="sm" />
                  </View>
                  <Text style={styles.titleText}>{item.title}</Text>
                  <Text style={styles.metaText}>📍 {item.room} • {item.faculty}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            <View style={styles.attendanceBanner}>
              <View>
                <Text style={styles.bannerLabel}>OVERALL CAMPUS ATTENDANCE</Text>
                <Text style={styles.bannerPct}>84.8%</Text>
                <Text style={styles.bannerSub}>Minimum 75% required for university exam clearance</Text>
              </View>
              <Button title="Correction" onPress={() => setShowCorrectionModal(true)} size="sm" variant="secondary" />
            </View>

            <Text style={styles.dayHeading}>Course-wise Attendance</Text>

            {attendanceData.map((item, idx) => {
              const isShortage = item.pct < 75;
              return (
                <Card key={idx} style={styles.attendanceCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.codeText}>{item.code}</Text>
                      <Text style={styles.titleText}>{item.name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.pctNumber, { color: isShortage ? THEME.colors.danger : THEME.colors.success }]}>{item.pct}%</Text>
                      <Text style={styles.attCount}>{item.attended}/{item.total} held</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${item.pct}%`, backgroundColor: isShortage ? THEME.colors.danger : THEME.colors.success }]} />
                  </View>

                  {isShortage && (
                    <Text style={styles.shortageText}>⚠️ Attendance below university cutoff (75%). Action required.</Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {activeTab === 'assignments' && (
          <View>
            <Text style={styles.dayHeading}>Course Work & Submissions</Text>
            <Card style={styles.subCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.codeText}>CSE-301 DBMS</Text>
                <Badge label="DUE TOMORROW" variant="danger" size="sm" />
              </View>
              <Text style={styles.subAssignTitle}>SQL Normalization and Transaction Locks</Text>
              <Text style={styles.subTime}>Due: Tomorrow, 11:59 PM • Max: 20 pts</Text>
              <Button title="Submit Assignment" onPress={() => Alert.alert('Upload Assignment', 'Document upload dialog enabled.')} size="sm" style={{ marginTop: 10 }} />
            </Card>

            <Card style={styles.subCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.codeText}>CSE-303 OS</Text>
                <Badge label="EVALUATED: 19/20" variant="success" size="sm" />
              </View>
              <Text style={styles.subAssignTitle}>Round Robin CPU Scheduling Simulator</Text>
              <Text style={styles.subTime}>Feedback: "Excellent implementation of context switches."</Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Student Correction Modal */}
      <Modal visible={showCorrectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Attendance Correction</Text>
            <Text style={styles.modalSub}>Claims are routed directly to your subject teacher.</Text>

            <Text style={styles.inputLabel}>Subject Code / Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. CSE-305 Theory of Computation" value={correctionSubject} onChangeText={setCorrectionSubject} />

            <Text style={styles.inputLabel}>Reason / Proof</Text>
            <TextInput style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]} placeholder="Reason (medical, hackathon OD...)" value={correctionReason} onChangeText={setCorrectionReason} multiline />

            <View style={styles.claimBtnRow}>
              <Button title="Cancel" variant="outline" onPress={() => setShowCorrectionModal(false)} style={{ flex: 1 }} />
              <Button title="Submit to Teacher" onPress={() => { Alert.alert('Claim Submitted', 'Sent to instructor.'); setShowCorrectionModal(false); }} style={{ flex: 1.5 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: THEME.colors.primary,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  sessionSelectBanner: {
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  sessionSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  dayHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  rosterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  rosterCardAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rosterLeft: {
    flex: 1,
  },
  rosterRoll: {
    fontSize: 11,
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  pillPresent: {
    backgroundColor: '#DCFCE7',
  },
  pillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  pillExcused: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subCard: {
    marginBottom: 10,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  subRoll: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  subAssignTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 6,
  },
  subTime: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  claimCard: {
    marginBottom: 10,
    padding: 14,
  },
  claimSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.accent,
    marginTop: 4,
  },
  claimReason: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  claimBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  daysScroll: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  dayPillTextActive: {
    color: '#FFF',
  },
  timetableCard: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  timeBadgeCol: {
    width: 75,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
    paddingRight: 8,
    justifyContent: 'center',
  },
  startTime: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  endTime: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  courseInfoCol: {
    flex: 1,
    paddingLeft: 12,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  attendanceBanner: {
    backgroundColor: '#0F172A',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  bannerLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerPct: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  bannerSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
    maxWidth: 200,
  },
  attendanceCard: {
    marginBottom: 10,
    padding: 14,
  },
  pctNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  attCount: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  shortageText: {
    fontSize: 11,
    color: THEME.colors.danger,
    fontWeight: '600',
    marginTop: 6,
  },
});
