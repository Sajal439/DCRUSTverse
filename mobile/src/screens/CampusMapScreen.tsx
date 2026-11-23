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

export const CampusMapScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const buildings = [
    {
      id: 'b1',
      code: 'CVR',
      name: 'Sir C.V. Raman Science & Computing Block',
      category: 'academic',
      hours: '08:00 AM - 07:00 PM',
      accessible: true,
      facilities: ['Computer Science Labs', 'High Performance Computing Cluster', 'Robotics Lab', 'Smart Classrooms'],
      floors: 4,
      coordinates: '28.9868° N, 77.0682° E',
      description: 'Main academic center for Computer Science & Engineering, Information Technology, and Physics departments.',
    },
    {
      id: 'b2',
      code: 'LIB',
      name: 'Central University Library',
      category: 'library',
      hours: '08:00 AM - 10:00 PM (Reading Room 24x7)',
      accessible: true,
      facilities: ['Digital Learning Resource Center', 'Research Journal Section', 'Over 1.5 Lakh Volumes', 'Quiet Study Cabins'],
      floors: 3,
      coordinates: '28.9875° N, 77.0674° E',
      description: 'State-of-the-art university central library with automated RFID issue/return kiosks and digital library repositories.',
    },
    {
      id: 'b3',
      code: 'SAR',
      name: 'Saraswati Academic Block',
      category: 'academic',
      hours: '08:30 AM - 05:30 PM',
      accessible: true,
      facilities: ['Electronics & Comm. Labs', 'Electrical Engineering Machines Lab', 'Seminar Hall 1'],
      floors: 3,
      coordinates: '28.9860° N, 77.0690° E',
      description: 'Houses Electrical and Electronics departments alongside central smart lecture halls.',
    },
    {
      id: 'b4',
      code: 'ADM',
      name: 'Administrative & Registrar Block',
      category: 'administrative',
      hours: '09:00 AM - 05:00 PM (Mon-Fri)',
      accessible: true,
      facilities: ['Registrar Office', 'Examination Branch', 'Dean Academic Affairs', 'Accounts & Fees Desk'],
      floors: 2,
      coordinates: '28.9852° N, 77.0665° E',
      description: 'Central administration, verification, exam clearance, and fee submission counters.',
    },
    {
      id: 'b5',
      code: 'BH4',
      name: 'Boys Hostel 4 (Kedar Bhawan)',
      category: 'hostel',
      hours: 'Gate closes 10:00 PM',
      accessible: false,
      facilities: ['Student Mess', 'Gymnasium', 'Badminton Court', 'Common Reading Room'],
      floors: 4,
      coordinates: '28.9890° N, 77.0710° E',
      description: 'Senior boys residential hall accommodating 320 students with dedicated dining and high-speed LAN.',
    },
    {
      id: 'b6',
      code: 'SPT',
      name: 'University Sports Complex & Stadium',
      category: 'sports',
      hours: '06:00 AM - 08:30 PM',
      accessible: true,
      facilities: ['Olympic Track', 'Indoor Basketball Arena', 'Cricket Ground', 'Table Tennis Hall'],
      floors: 1,
      coordinates: '28.9840° N, 77.0725° E',
      description: 'Comprehensive sporting arena hosting inter-university championships and daily recreation.',
    },
  ];

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'academic', label: 'Academic' },
    { key: 'library', label: 'Library' },
    { key: 'hostel', label: 'Hostels' },
    { key: 'administrative', label: 'Admin' },
    { key: 'sports', label: 'Sports' },
  ];

  const filteredBuildings = buildings.filter(b => {
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.facilities.some(f => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const simulateQrScan = (code: string) => {
    setScannerOpen(false);
    const found = buildings.find(b => b.code === code) || buildings[0];
    setSelectedBuilding(found);
    Alert.alert('QR Verified', `Scanned location pass for ${found.name}. Displaying navigation details.`);
  };

  return (
    <View style={styles.container}>
      {/* Top Controls: Search + Simulated QR Scan Button */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search block, lab, hostel..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFF" />
          <Text style={styles.scanBtnText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
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

      {/* Buildings List */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeading}>
          Campus Buildings ({filteredBuildings.length})
        </Text>

        {filteredBuildings.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => setSelectedBuilding(item)}
          >
            <Card style={styles.buildingCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={styles.bName}>{item.name}</Text>
                  <Text style={styles.bHours}>Hours: {item.hours}</Text>
                </View>
                {item.accessible && (
                  <MaterialCommunityIcons name="wheelchair-accessibility" size={20} color={THEME.colors.success} />
                )}
              </View>

              <Text style={styles.bDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.facilitiesRow}>
                {item.facilities.slice(0, 2).map((fac, i) => (
                  <View key={i} style={styles.facilityChip}>
                    <Text style={styles.facilityChipText}>• {fac}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Building Details Modal */}
      <Modal visible={selectedBuilding !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{selectedBuilding?.code}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBuilding(null)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.detailTitle}>{selectedBuilding?.name}</Text>
            <Text style={styles.detailCoords}>GPS: {selectedBuilding?.coordinates}</Text>

            <View style={styles.detailMetaRow}>
              <Badge label={selectedBuilding?.category || 'CAMPUS'} variant="primary" />
              {selectedBuilding?.accessible ? (
                <Badge label="WHEELCHAIR ACCESSIBLE" variant="success" />
              ) : (
                <Badge label="STAIRWAY ACCESS ONLY" variant="warning" />
              )}
            </View>

            <Text style={styles.detailDesc}>{selectedBuilding?.description}</Text>

            <Text style={styles.facilitiesHeader}>Facilities & Labs:</Text>
            <View style={styles.facilitiesList}>
              {selectedBuilding?.facilities.map((f: string, idx: number) => (
                <View key={idx} style={styles.facilityItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={THEME.colors.success} />
                  <Text style={styles.facilityItemText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailFooterBtnRow}>
              <Button
                title="Get Walking Route"
                onPress={() => {
                  Alert.alert('Campus Navigation', `Optimal paved walking route to ${selectedBuilding?.code} generated (approx 4 min walk from main gate).`);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Close"
                variant="outline"
                onPress={() => setSelectedBuilding(null)}
                style={{ width: 80 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Simulated QR Scanner Modal */}
      <Modal visible={scannerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.detailTitle}>Scan Building QR Code</Text>
            <Text style={styles.detailDesc}>
              Point camera at any building entrance or room doorway marker to retrieve official hours and access policies.
            </Text>

            <View style={styles.cameraBox}>
              <MaterialCommunityIcons name="camera-iris" size={60} color={THEME.colors.primary} />
              <Text style={styles.scanTargetText}>Align QR Code Inside Camera Frame</Text>
            </View>

            <Text style={styles.facilitiesHeader}>Simulate Scanning Building Door:</Text>
            <View style={styles.simButtonsRow}>
              <Button title="Scan C.V. Raman Block" onPress={() => simulateQrScan('CVR')} size="sm" />
              <Button title="Scan Central Library" onPress={() => simulateQrScan('LIB')} size="sm" variant="secondary" />
            </View>

            <Button
              title="Cancel Scanner"
              variant="outline"
              onPress={() => setScannerOpen(false)}
              style={{ marginTop: 16 }}
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
  topBar: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    gap: 10,
    backgroundColor: THEME.colors.surface,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text,
  },
  scanBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
  },
  scanBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    maxHeight: 50,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: THEME.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  buildingCard: {
    marginBottom: 10,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  bName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  bHours: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  bDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facilityChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityChipText: {
    fontSize: 10,
    color: '#475569',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBadgeText: {
    color: '#3730A3',
    fontWeight: '800',
    fontSize: 13,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  detailCoords: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailDesc: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  facilitiesHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  facilitiesList: {
    marginBottom: 16,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  facilityItemText: {
    fontSize: 12,
    color: THEME.colors.text,
  },
  detailFooterBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBox: {
    height: 180,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  scanTargetText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
