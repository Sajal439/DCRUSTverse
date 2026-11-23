import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';
import { apiRequest } from '../api/client';
import { cacheGet, cacheSet } from '../utils/storage';

export const NoticesScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNotice, setActiveNotice] = useState<any | null>(null);

  const sampleNotices = [
    {
      id: 'n1',
      title: 'End-Term Semester Examination Form Submission Guidelines',
      content:
        'All regular and re-appear students of B.Tech, M.Tech, and MCA are hereby notified that the examination registration portal is active. Verify all internal assessment marks and course codes before the final deadline of 10th December 2026. Hall tickets will be issued solely through the Digital ID section.',
      category: 'academic',
      isUrgent: true,
      publishedAt: '22 Nov 2026, 10:30 AM',
      author: 'Office of the Controller of Examinations',
    },
    {
      id: 'n2',
      title: 'Campus Placement Drive: TCS Digital & Innovator Profiles',
      content:
        'Training and Placement Cell announces registration for the upcoming TCS on-campus recruitment drive. Eligibility: B.Tech CSE, ECE, EE with minimum CGPA 7.0 and no active backlogs. Upload updated resumes in the Placements section before Friday.',
      category: 'placement',
      isUrgent: false,
      publishedAt: '21 Nov 2026, 04:00 PM',
      author: 'Training & Placement Office',
    },
    {
      id: 'n3',
      title: 'Annual Technical Festival: Technova 2026 Call for Coordinators',
      content:
        'The University Student Technical Council is inviting applications for event coordinators across 18 hackathons, robotics challenges, and coding competitions. Students from 2nd and 3rd year can submit expressions of interest through the Clubs portal.',
      category: 'event',
      isUrgent: false,
      publishedAt: '19 Nov 2026, 02:00 PM',
      author: 'Dean Student Welfare',
    },
    {
      id: 'n4',
      title: 'Hostel Mess Menu Revision and Committee Meeting',
      content:
        'A joint meeting of all hostel mess representatives and wardens will take place at the Guest House conference room this Wednesday to finalize the winter mess menu.',
      category: 'administrative',
      isUrgent: false,
      publishedAt: '18 Nov 2026, 11:00 AM',
      author: 'Chief Warden Office',
    },
  ];

  const [notices, setNotices] = useState(sampleNotices);

  useEffect(() => {
    async function loadNotices() {
      const cached = await cacheGet<any[]>('notices_cache');
      if (cached?.data) setNotices(cached.data);

      const live = await apiRequest<any[]>('/notices').catch(() => null);
      if (live && Array.isArray(live)) {
        setNotices(live);
        await cacheSet('notices_cache', live);
      }
    }
    loadNotices();
  }, []);

  const categories = [
    { key: 'all', label: 'All Notices' },
    { key: 'academic', label: 'Academic' },
    { key: 'placement', label: 'Placements' },
    { key: 'event', label: 'Events' },
    { key: 'administrative', label: 'Admin' },
  ];

  const filteredNotices = notices.filter(n => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search circulars, exams, events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.pill, selectedCategory === c.key && styles.pillActive]}
            onPress={() => setSelectedCategory(c.key)}
          >
            <Text style={[styles.pillText, selectedCategory === c.key && styles.pillTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notices List */}
      <ScrollView contentContainerStyle={styles.content}>
        {filteredNotices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={48} color={THEME.colors.textMuted} />
            <Text style={styles.emptyText}>No circulars found matching criteria.</Text>
          </View>
        ) : (
          filteredNotices.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setActiveNotice(item)}
            >
              <Card style={[styles.noticeCard, item.isUrgent ? styles.urgentNoticeCard : undefined]}>
                <View style={styles.cardHeader}>
                  <Badge
                    label={item.isUrgent ? 'URGENT' : item.category}
                    variant={item.isUrgent ? 'danger' : 'primary'}
                    size="sm"
                  />
                  <Text style={styles.publishDate}>{item.publishedAt}</Text>
                </View>
                <Text style={styles.noticeTitle}>{item.title}</Text>
                <Text style={styles.noticeSnippet} numberOfLines={2}>
                  {item.content}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.authorText}>Issued by: {item.author}</Text>
                  <Text style={styles.readMoreText}>Read Circular →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Full Notice Modal */}
      <Modal visible={activeNotice !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Badge
                label={activeNotice?.category || 'CAMPUS'}
                variant={activeNotice?.isUrgent ? 'danger' : 'primary'}
              />
              <TouchableOpacity onPress={() => setActiveNotice(null)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>{activeNotice?.title}</Text>
            <Text style={styles.modalDate}>Published: {activeNotice?.publishedAt}</Text>
            <Text style={styles.modalAuthor}>Issued by: {activeNotice?.author}</Text>

            <ScrollView style={styles.modalContentScroll}>
              <Text style={styles.modalBodyText}>{activeNotice?.content}</Text>
            </ScrollView>

            <Button
              title="Close Notice"
              onPress={() => setActiveNotice(null)}
              variant="outline"
              style={{ marginTop: 12 }}
            />
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
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text,
  },
  pillsScroll: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    marginVertical: 10,
    maxHeight: 40,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  pillTextActive: {
    color: '#FFF',
  },
  content: {
    padding: THEME.spacing.md,
    paddingTop: 4,
    paddingBottom: 40,
  },
  noticeCard: {
    marginBottom: 12,
    padding: 14,
  },
  urgentNoticeCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.danger,
    backgroundColor: '#FFFDFD',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  publishDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  noticeSnippet: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
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
  authorText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
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
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  modalAuthor: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  modalContentScroll: {
    maxHeight: 250,
  },
  modalBodyText: {
    fontSize: 13,
    color: THEME.colors.text,
    lineHeight: 22,
  },
});
