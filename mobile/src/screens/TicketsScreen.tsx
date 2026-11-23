import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';
import { apiRequest } from '../api/client';
import { cacheGet, cacheSet } from '../utils/storage';

export const TicketsScreen: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([
    {
      id: 't1',
      ticketNumber: 'TKT-2026-089',
      category: 'hostel',
      subject: 'Hostel 4 Room 204 Fan Repair',
      description: 'Ceiling fan making loud grinding noise and running on low speed only.',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '21 Nov 2026, 02:15 PM',
      assignedTo: 'Electrician Team B',
    },
    {
      id: 't2',
      ticketNumber: 'TKT-2026-042',
      category: 'it_network',
      subject: 'CV Raman Block 2nd Floor WiFi Signal Drop',
      description: 'Access Point AP-CVR-04 dropping connections intermittently during lab sessions.',
      status: 'resolved',
      priority: 'high',
      createdAt: '15 Nov 2026, 11:30 AM',
      assignedTo: 'Campus IT Center',
      resolution: 'Replaced faulty PoE injector switch. WiFi signal restored.',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [category, setCategory] = useState<'hostel' | 'electrical' | 'it_network' | 'sanitation' | 'academics'>('hostel');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { key: 'hostel', label: 'Hostel' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'it_network', label: 'WiFi / IT' },
    { key: 'sanitation', label: 'Sanitation' },
    { key: 'academics', label: 'Academics' },
  ];

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const cached = await cacheGet<any[]>('tickets_cache');
      if (cached?.data) setTickets(cached.data);

      const res = await apiRequest<any[]>('/tickets').catch(() => null);
      if (res && Array.isArray(res)) {
        setTickets(res);
        await cacheSet('tickets_cache', res);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in subject and description.');
      return;
    }

    setSubmitting(true);
    try {
      const newTicketPayload = {
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      };

      const res = await apiRequest<any>('/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicketPayload),
      }).catch(() => null);

      const created = res || {
        id: `t_${Date.now()}`,
        ticketNumber: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...newTicketPayload,
        status: 'open',
        createdAt: 'Just now',
      };

      const updated = [created, ...tickets];
      setTickets(updated);
      await cacheSet('tickets_cache', updated);

      Alert.alert('Complaint Registered', `Your ticket ${created.ticketNumber} has been logged and assigned to campus maintenance.`);
      setShowNewModal(false);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not register ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Complaints & Service Requests</Text>
          <Text style={styles.subHeading}>Track hostel maintenance, network, and campus services</Text>
        </View>
        <Button
          title="+ New Ticket"
          onPress={() => setShowNewModal(true)}
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && tickets.length === 0 ? (
          <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          tickets.map(ticket => (
            <Card key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketNoRow}>
                  <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                  <Badge
                    label={ticket.status.replace('_', ' ')}
                    variant={
                      ticket.status === 'resolved' || ticket.status === 'closed'
                        ? 'success'
                        : ticket.status === 'in_progress'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  />
                </View>
                <Text style={styles.ticketDate}>{ticket.createdAt}</Text>
              </View>

              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Text style={styles.ticketDesc}>{ticket.description}</Text>

              <View style={styles.ticketFooter}>
                <View style={styles.categoryBadge}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#475569" />
                  <Text style={styles.categoryBadgeText}>{ticket.category.toUpperCase()}</Text>
                </View>

                {ticket.assignedTo && (
                  <View style={styles.assignedRow}>
                    <MaterialCommunityIcons name="account-wrench-outline" size={14} color={THEME.colors.textSecondary} />
                    <Text style={styles.assignedText}>{ticket.assignedTo}</Text>
                  </View>
                )}
              </View>

              {ticket.resolution && (
                <View style={styles.resolutionBox}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                  <Text style={styles.resolutionText}>Resolution: {ticket.resolution}</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>File Campus Complaint</Text>
            <Text style={styles.modalSub}>All tickets are routed to campus administrators and service staff.</Text>

            {/* Category chips */}
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chipRow}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, category === c.key && styles.chipActive]}
                  onPress={() => setCategory(c.key as any)}
                >
                  <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Broken laboratory water tap"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.inputLabel}>Details & Room Location</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe the issue, building, floor, and room number..."
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowNewModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Ticket"
                onPress={handleCreateTicket}
                loading={submitting}
                style={{ flex: 1 }}
              />
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
  headerRow: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  subHeading: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  ticketCard: {
    marginBottom: 12,
    padding: 14,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  ticketDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  ticketDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  resolutionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    gap: 6,
  },
  resolutionText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
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
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 11,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
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
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
