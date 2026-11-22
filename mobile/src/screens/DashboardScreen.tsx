import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';
import { apiRequest } from '../api/client';
import { cacheGet, cacheSet } from '../utils/storage';

import type { CampusRoute } from '../types/navigation';

interface DashboardProps {
  onNavigate: (screen: CampusRoute) => void;
}

export const DashboardScreen: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const primaryRole = user?.roles?.[0]?.role || (user?.email?.startsWith('faculty') ? 'faculty' : user?.email?.startsWith('admin') ? 'administrator' : 'student');

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (primaryRole === 'administrator') {
    return <AdminDashboardView user={user} profile={profile} onNavigate={onNavigate} refreshing={refreshing} onRefresh={onRefresh} />;
  }

  if (primaryRole === 'faculty') {
    return <FacultyDashboardView user={user} profile={profile} onNavigate={onNavigate} refreshing={refreshing} onRefresh={onRefresh} />;
  }

  return <StudentDashboardView user={user} profile={profile} onNavigate={onNavigate} refreshing={refreshing} onRefresh={onRefresh} />;
};

// ============================================================================
// 1. STUDENT DASHBOARD
// ============================================================================
function StudentDashboardView({ user, profile, onNavigate, refreshing, onRefresh }: any) {
  const [todayClasses] = useState([
    { id: '1', time: '09:00 - 10:00', code: 'CSE-301', title: 'Database Management Systems', room: 'CV Raman Block Lab 3', faculty: 'Dr. S. Sharma' },
    { id: '2', time: '11:15 - 12:15', code: 'CSE-303', title: 'Operating Systems', room: 'Saraswati Block Room 204', faculty: 'Prof. K. Verma' },
    { id: '3', time: '14:00 - 16:00', code: 'CSE-307', title: 'Computer Networks Practical', room: 'Networking Lab', faculty: 'Er. A. Malik' },
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      {/* Student Profile Card */}
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greetingText}>Student Portal</Text>
          <Text style={styles.userName}>{user?.displayName || 'Rahul Sharma'}</Text>
          <View style={styles.roleRow}>
            <Badge label="STUDENT" variant="primary" size="sm" />
            <Text style={styles.rollNumberText}>Roll: {profile?.rollNumber || '23001001001'}</Text>
          </View>
          <Text style={styles.deptSubText}>B.Tech Computer Science • 5th Semester</Text>
        </View>

        <TouchableOpacity
          style={styles.idCardPill}
          activeOpacity={0.8}
          onPress={() => onNavigate('digital-id')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color={THEME.colors.primary} />
          <Text style={styles.idCardPillText}>My ID</Text>
        </TouchableOpacity>
      </View>

      {/* Student Metrics */}
      <View style={styles.metricsRow}>
        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.success }]}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Attendance</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.success }]}>84.8%</Text>
          <Text style={styles.metricSub}>31/36 sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.accent }]}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Assignments</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.accent }]}>2 Due</Text>
          <Text style={styles.metricSub}>Deadline Friday</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.info }]}
          onPress={() => onNavigate('tickets')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Complaints</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.info }]}>1 Active</Text>
          <Text style={styles.metricSub}>In progress</Text>
        </TouchableOpacity>
      </View>

      {/* Student Quick Services */}
      <Text style={styles.sectionTitle}>Campus Quick Services</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('digital-id')}>
          <View style={[styles.gridIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#4338CA" />
          </View>
          <Text style={styles.gridItemTitle}>Digital ID</Text>
          <Text style={styles.gridItemDesc}>Gate QR Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('bus')}>
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="bus-clock" size={24} color="#B45309" />
          </View>
          <Text style={styles.gridItemTitle}>Campus Bus</Text>
          <Text style={styles.gridItemDesc}>GPS Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('map')}>
          <View style={[styles.gridIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color="#0369A1" />
          </View>
          <Text style={styles.gridItemTitle}>Explorer</Text>
          <Text style={styles.gridItemDesc}>Campus Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('ai')}>
          <View style={[styles.gridIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#7E22CE" />
          </View>
          <Text style={styles.gridItemTitle}>DCRUSTbot</Text>
          <Text style={styles.gridItemDesc}>AI Assistant</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.scheduleHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Lectures</Text>
        <TouchableOpacity onPress={() => onNavigate('academics')}>
          <Text style={styles.seeAllText}>Full Week →</Text>
        </TouchableOpacity>
      </View>

      {todayClasses.map(item => (
        <Card key={item.id} style={styles.classCard}>
          <View style={styles.classTimeCol}>
            <Text style={styles.classTimeText}>{item.time.split(' - ')[0]}</Text>
            <Text style={styles.classTimeSub}>{item.time.split(' - ')[1]}</Text>
          </View>
          <View style={styles.classDetailsCol}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseCode}>{item.code}</Text>
              <Badge label="Scheduled" variant="success" size="sm" />
            </View>
            <Text style={styles.courseName}>{item.title}</Text>
            <Text style={styles.classLocation}>📍 {item.room} • {item.faculty}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// 2. FACULTY / TEACHER DASHBOARD
// ============================================================================
function FacultyDashboardView({ user, profile, onNavigate, refreshing, onRefresh }: any) {
  const [teachingSchedule] = useState([
    { id: 'f1', time: '09:00 - 10:00 AM', code: 'CSE-301', course: 'Database Management Systems', section: 'Batch A (64 Students)', room: 'CV Raman Block Lab 3', status: 'attendance_pending' },
    { id: 'f2', time: '11:15 - 12:15 PM', code: 'CSE-301', course: 'DBMS Advanced Query Theory', section: 'Batch B (58 Students)', room: 'Aryabhata Hall 1', status: 'completed' },
    { id: 'f3', time: '02:00 - 04:00 PM', code: 'CSE-311', course: 'DBMS Relational Project Lab', section: 'Batch A1 (32 Students)', room: 'Systems Lab 2', status: 'upcoming' },
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      {/* Faculty Profile Banner */}
      <View style={[styles.welcomeBanner, { backgroundColor: '#1E3A8A' }]}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greetingText}>Faculty & Instructor Portal</Text>
          <Text style={styles.userName}>{user?.displayName || 'Dr. Suresh Sharma'}</Text>
          <View style={styles.roleRow}>
            <Badge label="FACULTY" variant="warning" size="sm" />
            <Text style={styles.rollNumberText}>Emp ID: {profile?.employeeId || 'EMP-CSE-012'}</Text>
          </View>
          <Text style={styles.deptSubText}>Associate Professor • Dept of Computer Science & Engineering</Text>
          <Text style={styles.deptSubText}>Office: CV Raman Science Block Room 302</Text>
        </View>

        <View style={styles.facultyBadgeBox}>
          <MaterialCommunityIcons name="school" size={32} color="#FBBF24" />
        </View>
      </View>

      {/* Faculty Teaching Action Metrics */}
      <View style={styles.metricsRow}>
        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.danger }]}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Roll Call</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.danger }]}>1 Pending</Text>
          <Text style={styles.metricSub}>CSE-301 Batch A</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.accent }]}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>To Grade</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.accent }]}>14 Papers</Text>
          <Text style={styles.metricSub}>SQL Normalization</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: THEME.colors.info }]}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Corrections</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.info }]}>2 Claims</Text>
          <Text style={styles.metricSub}>Medical/Sports OD</Text>
        </TouchableOpacity>
      </View>

      {/* Faculty Quick Tools */}
      <Text style={styles.sectionTitle}>Instructor Tools & Actions</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.gridItem, { borderColor: '#FED7AA' }]}
          onPress={() => onNavigate('academics')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FFEDD5' }]}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={26} color="#C2410C" />
          </View>
          <Text style={styles.gridItemTitle}>Take Roll Call</Text>
          <Text style={styles.gridItemDesc}>Mark Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridItem, { borderColor: '#BBF7D0' }]}
          onPress={() => onNavigate('academics')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="file-check-outline" size={26} color="#15803D" />
          </View>
          <Text style={styles.gridItemTitle}>Grade Papers</Text>
          <Text style={styles.gridItemDesc}>Review Homework</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridItem, { borderColor: '#E9D5FF' }]}
          onPress={() => onNavigate('academics')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="account-clock-outline" size={26} color="#7E22CE" />
          </View>
          <Text style={styles.gridItemTitle}>Corrections</Text>
          <Text style={styles.gridItemDesc}>Approve Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridItem, { borderColor: '#BAE6FD' }]}
          onPress={() => onNavigate('notices')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={26} color="#0369A1" />
          </View>
          <Text style={styles.gridItemTitle}>Class Notice</Text>
          <Text style={styles.gridItemDesc}>Send Circular</Text>
        </TouchableOpacity>
      </View>

      {/* Assigned Teaching Schedule */}
      <View style={styles.scheduleHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Assigned Lectures</Text>
        <TouchableOpacity onPress={() => onNavigate('academics')}>
          <Text style={styles.seeAllText}>Teaching Plan →</Text>
        </TouchableOpacity>
      </View>

      {teachingSchedule.map(item => (
        <Card key={item.id} style={styles.facultyClassCard}>
          <View style={styles.facultyClassTop}>
            <View>
              <Text style={styles.facultyClassTime}>🕒 {item.time}</Text>
              <Text style={styles.facultyCourseTitle}>{item.code}: {item.course}</Text>
            </View>
            <Badge
              label={item.status === 'attendance_pending' ? 'NEEDS ROLL CALL' : item.status === 'completed' ? 'SUBMITTED' : 'UPCOMING'}
              variant={item.status === 'attendance_pending' ? 'danger' : item.status === 'completed' ? 'success' : 'info'}
              size="sm"
            />
          </View>

          <View style={styles.facultyClassMetaRow}>
            <Text style={styles.facultyMetaText}>👥 {item.section}</Text>
            <Text style={styles.facultyMetaText}>📍 {item.room}</Text>
          </View>

          {item.status === 'attendance_pending' && (
            <Button
              title="Record Attendance Now"
              onPress={() => onNavigate('academics')}
              size="sm"
              style={{ marginTop: 10 }}
            />
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// 3. ADMINISTRATOR CONSOLE DASHBOARD
// ============================================================================
function AdminDashboardView({ user, profile, onNavigate, refreshing, onRefresh }: any) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      {/* Admin Command Console Banner */}
      <View style={[styles.welcomeBanner, { backgroundColor: '#0F172A', borderLeftWidth: 6, borderLeftColor: '#F59E0B' }]}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greetingText}>Campus Administration & System Control</Text>
          <Text style={styles.userName}>{user?.displayName || 'Campus Administrator'}</Text>
          <View style={styles.roleRow}>
            <Badge label="SUPER ADMIN" variant="warning" size="sm" />
            <Text style={styles.rollNumberText}>Scope: University Global</Text>
          </View>
          <Text style={styles.deptSubText}>Deenbandhu Chhotu Ram University Operations Centre</Text>
        </View>

        <View style={styles.facultyBadgeBox}>
          <MaterialCommunityIcons name="shield-account" size={36} color="#F59E0B" />
        </View>
      </View>

      {/* University Key Operating Metrics */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: '#6366F1' }]}>
          <Text style={styles.metricLabel}>Users</Text>
          <Text style={[styles.metricValue, { color: '#6366F1' }]}>1,420</Text>
          <Text style={styles.metricSub}>125 Faculty • 1.2k Students</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.metricLabel}>Classes Today</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>48 Held</Text>
          <Text style={styles.metricSub}>98.2% Conducted</Text>
        </View>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#EF4444' }]}
          onPress={() => onNavigate('tickets')}
          activeOpacity={0.8}
        >
          <Text style={styles.metricLabel}>Tickets</Text>
          <Text style={[styles.metricValue, { color: '#EF4444' }]}>8 Open</Text>
          <Text style={styles.metricSub}>2 Urgent Issues</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Action Center */}
      <Text style={styles.sectionTitle}>Administrative Command Center</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('admin-users')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
            <MaterialCommunityIcons name="account-cog-outline" size={26} color="#6D28D9" />
          </View>
          <Text style={styles.gridItemTitle}>User Accounts</Text>
          <Text style={styles.gridItemDesc}>Provision & Roles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('tickets')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="wrench-clock-outline" size={26} color="#B91C1C" />
          </View>
          <Text style={styles.gridItemTitle}>Complaints</Text>
          <Text style={styles.gridItemDesc}>Dispatch & Close</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('notices')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="broadcast" size={26} color="#B45309" />
          </View>
          <Text style={styles.gridItemTitle}>Broadcast</Text>
          <Text style={styles.gridItemDesc}>Push Circular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('bus')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#CCFBF1' }]}>
            <MaterialCommunityIcons name="bus-multiple" size={26} color="#0F766E" />
          </View>
          <Text style={styles.gridItemTitle}>IoT & Fleet</Text>
          <Text style={styles.gridItemDesc}>Bus Telemetry</Text>
        </TouchableOpacity>
      </View>

      {/* Recent System Audit Events */}
      <Text style={styles.sectionTitle}>Live Campus Security Audit Trail</Text>
      <Card style={{ padding: 14, marginBottom: 20 }}>
        <View style={styles.auditItem}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#059669" />
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={styles.auditAction}>user.authenticated</Text>
            <Text style={styles.auditDetails}>admin@dcrustm.org authorized with Global Scope</Text>
          </View>
          <Text style={styles.auditTime}>Just now</Text>
        </View>

        <View style={styles.auditItem}>
          <MaterialCommunityIcons name="clipboard-check" size={16} color="#2563EB" />
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={styles.auditAction}>attendance.recorded</Text>
            <Text style={styles.auditDetails}>Dr. S. Sharma recorded CSE-301 Section B (58 students)</Text>
          </View>
          <Text style={styles.auditTime}>11:30 AM</Text>
        </View>

        <View style={styles.auditItem}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#D97706" />
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={styles.auditAction}>ticket.escalated</Text>
            <Text style={styles.auditDetails}>Hostel 4 Room 204 Fan Repair marked Medium priority</Text>
          </View>
          <Text style={styles.auditTime}>10:15 AM</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.card,
  },
  bannerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  rollNumberText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  deptSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  idCardPill: {
    backgroundColor: THEME.colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idCardPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  facultyBadgeBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    borderLeftWidth: 4,
    ...THEME.shadows.card,
  },
  metricLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: THEME.spacing.lg,
  },
  gridItem: {
    width: '48%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  gridIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  gridItemDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  seeAllText: {
    fontSize: 12,
    color: THEME.colors.info,
    fontWeight: '600',
  },
  classCard: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  classTimeCol: {
    width: 75,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
    paddingRight: 8,
    justifyContent: 'center',
  },
  classTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  classTimeSub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  classDetailsCol: {
    flex: 1,
    paddingLeft: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 2,
  },
  classLocation: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  facultyClassCard: {
    marginBottom: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  facultyClassTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  facultyClassTime: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  facultyCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 2,
  },
  facultyClassMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  facultyMetaText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  auditDetails: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  auditTime: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
});
