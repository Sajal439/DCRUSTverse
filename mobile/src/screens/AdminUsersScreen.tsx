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
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';

export const AdminUsersScreen: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newDept, setNewDept] = useState('dept_cse');

  const [usersList, setUsersList] = useState([
    { id: '1', name: 'Rahul Sharma', email: 'student@dcrustm.org', role: 'student', identifier: 'Roll: 23001001001', dept: 'Computer Science', status: 'active' },
    { id: '2', name: 'Dr. Suresh Sharma', email: 'faculty@dcrustm.org', role: 'faculty', identifier: 'Emp: EMP-CSE-012', dept: 'Computer Science', status: 'active' },
    { id: '3', name: 'Prof. K. Verma', email: 'kverma@dcrustm.org', role: 'department_head', identifier: 'Emp: EMP-CSE-001', dept: 'Computer Science', status: 'active' },
    { id: '4', name: 'Dr. R. K. Malik', email: 'warden_bh4@dcrustm.org', role: 'hostel_warden', identifier: 'Hostel: BH-4 Kedar', dept: 'Chief Warden Office', status: 'active' },
    { id: '5', name: 'Mrs. Sunita Devi', email: 'library_desk@dcrustm.org', role: 'librarian', identifier: 'Desk: Circulation', dept: 'Central Library', status: 'active' },
    { id: '6', name: 'Amit Malik', email: 'amit@dcrustm.org', role: 'student', identifier: 'Roll: 23001001003', dept: 'Computer Science', status: 'disabled' },
  ]);

  const toggleUserStatus = (id: string) => {
    setUsersList(prev =>
      prev.map(u => {
        if (u.id !== id) return u;
        const next = u.status === 'active' ? 'disabled' : 'active';
        Alert.alert('Status Changed', `${u.name}'s campus account is now ${next.toUpperCase()}.`);
        return { ...u, status: next };
      })
    );
  };

  const handleProvision = () => {
    if (!newEmail || !newName) {
      Alert.alert('Required', 'Please enter email and full name.');
      return;
    }
    const created = {
      id: `u_${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      identifier: newRole === 'student' ? 'Roll: 23001001099' : 'Emp: EMP-NEW-01',
      dept: 'Computer Science',
      status: 'active',
    };
    setUsersList(prev => [created, ...prev]);
    Alert.alert('Account Provisioned', `Verified campus account provisioned for ${newName} with ${newRole.toUpperCase()} authority.`);
    setShowProvisionModal(false);
    setNewEmail('');
    setNewName('');
  };

  const roles = [
    { key: 'all', label: 'All Users' },
    { key: 'student', label: 'Students' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'department_head', label: 'HODs' },
    { key: 'hostel_warden', label: 'Wardens' },
    { key: 'librarian', label: 'Librarians' },
  ];

  const filtered = usersList.filter(u => {
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.identifier.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Campus User Management</Text>
          <Text style={styles.headerSub}>Manage accounts, scoped roles, and account state</Text>
        </View>
        <Button title="+ Add User" onPress={() => setShowProvisionModal(true)} size="sm" />
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, roll, email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Role Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesScroll}>
        {roles.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[styles.rolePill, selectedRole === r.key && styles.rolePillActive]}
            onPress={() => setSelectedRole(r.key)}
          >
            <Text style={[styles.rolePillText, selectedRole === r.key && styles.rolePillTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.listHeading}>Registered Accounts ({filtered.length})</Text>

        {filtered.map(u => {
          const isActive = u.status === 'active';
          return (
            <Card key={u.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <Badge
                  label={u.role.replace('_', ' ')}
                  variant={u.role === 'student' ? 'primary' : u.role === 'faculty' ? 'warning' : 'info'}
                  size="sm"
                />
              </View>

              <View style={styles.userMetaRow}>
                <Text style={styles.userMeta}>{u.identifier}</Text>
                <Text style={styles.userMeta}>🏢 {u.dept}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.statusText, { color: isActive ? '#065F46' : '#991B1B' }]}>
                    {isActive ? 'ACTIVE ACCOUNT' : 'DEACTIVATED'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: isActive ? '#FEF2F2' : '#ECFDF5' }]}
                  onPress={() => toggleUserStatus(u.id)}
                >
                  <Text style={[styles.toggleBtnText, { color: isActive ? '#DC2626' : '#059669' }]}>
                    {isActive ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Provision User Modal */}
      <Modal visible={showProvisionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Provision New Campus Account</Text>
            <Text style={styles.modalSub}>Creates verified identity with role boundary assignments</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Ankit Sharma" value={newName} onChangeText={setNewName} />

            <Text style={styles.inputLabel}>University Email</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. ankit@dcrustm.org" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.inputLabel}>Select Campus Role</Text>
            <View style={styles.roleBtnRow}>
              {['student', 'faculty', 'hostel_warden', 'librarian'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.modalRolePill, newRole === r && styles.modalRolePillActive]}
                  onPress={() => setNewRole(r)}
                >
                  <Text style={[styles.modalRoleText, newRole === r && styles.modalRoleTextActive]}>
                    {r.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <Button title="Cancel" variant="outline" onPress={() => setShowProvisionModal(false)} style={{ flex: 1 }} />
              <Button title="Provision Account" onPress={handleProvision} style={{ flex: 1.5 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topHeader: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text,
  },
  rolesScroll: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    marginVertical: 10,
    maxHeight: 40,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 6,
  },
  rolePillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  rolePillTextActive: {
    color: '#FFF',
  },
  content: {
    padding: THEME.spacing.md,
    paddingTop: 4,
    paddingBottom: 40,
  },
  listHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 8,
  },
  userCard: {
    marginBottom: 10,
    padding: 14,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  userEmail: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  userMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  userMeta: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  roleBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  modalRolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalRolePillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  modalRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalRoleTextActive: {
    color: '#FFF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
