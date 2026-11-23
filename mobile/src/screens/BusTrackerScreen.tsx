import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';
import { apiRequest } from '../api/client';

export const BusTrackerScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'campus' | 'sonipat'>('campus');

  const routesData = {
    campus: {
      id: 'r_shuttle',
      name: 'Internal Campus Circular Shuttle',
      busNo: 'HR-10-AT-4412 (Bus #01)',
      driver: 'Rajesh Kumar (Duty Mobile: +91 94160 22341)',
      speed: 18,
      lastUpdated: '12 seconds ago',
      isStale: false,
      occupancy: 'Moderate (Seats Available)',
      stops: [
        { name: 'Main Campus Gate & Bus Stand', status: 'passed', time: '09:40 AM' },
        { name: 'Administrative & Exam Block', status: 'passed', time: '09:45 AM' },
        { name: 'C.V. Raman Science Block', status: 'current', time: '09:50 AM' },
        { name: 'Boys & Girls Hostels Complex', status: 'next', eta: '3 mins' },
        { name: 'University Sports Complex', status: 'upcoming', eta: '7 mins' },
        { name: 'Central University Library', status: 'upcoming', eta: '12 mins' },
      ],
    },
    sonipat: {
      id: 'r_sonipat',
      name: 'Sonipat City & Metro Feeder Route',
      busNo: 'HR-10-AT-7889 (Bus #04)',
      driver: 'Sukhbir Singh (Duty Mobile: +91 98120 44512)',
      speed: 42,
      lastUpdated: '45 seconds ago',
      isStale: false,
      occupancy: 'Standing Only',
      stops: [
        { name: 'Sonipat Railway Station', status: 'passed', time: '09:15 AM' },
        { name: 'Subhash Chowk City Stand', status: 'passed', time: '09:30 AM' },
        { name: 'Murthal Toll Plaza Junction', status: 'current', time: '09:48 AM' },
        { name: 'DCRUST University Main Gate', status: 'next', eta: '6 mins' },
      ],
    },
  };

  const activeBus = routesData[selectedRoute];

  const onRefresh = async () => {
    setRefreshing(true);
    // Poll API endpoint if live
    await apiRequest('/iot-bus/locations').catch(() => null);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      <Text style={styles.heading}>Live Campus Bus & Shuttle Tracking</Text>
      <Text style={styles.subHeading}>
        IoT GPS Telemetry feeds with live stop progression & schedule ETAs
      </Text>

      {/* Route Switcher Tabs */}
      <View style={styles.routeSelector}>
        <TouchableOpacity
          style={[styles.routeBtn, selectedRoute === 'campus' && styles.routeBtnActive]}
          onPress={() => setSelectedRoute('campus')}
        >
          <MaterialCommunityIcons
            name="bus"
            size={18}
            color={selectedRoute === 'campus' ? '#FFF' : THEME.colors.text}
          />
          <Text style={[styles.routeBtnText, selectedRoute === 'campus' && styles.routeBtnTextActive]}>
            Campus Shuttle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.routeBtn, selectedRoute === 'sonipat' && styles.routeBtnActive]}
          onPress={() => setSelectedRoute('sonipat')}
        >
          <MaterialCommunityIcons
            name="bus-double-decker"
            size={18}
            color={selectedRoute === 'sonipat' ? '#FFF' : THEME.colors.text}
          />
          <Text style={[styles.routeBtnText, selectedRoute === 'sonipat' && styles.routeBtnTextActive]}>
            Sonipat Feeder
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Vehicle Telemetry Card */}
      <Card style={styles.telemetryCard}>
        <View style={styles.busHeader}>
          <View>
            <Text style={styles.busNumber}>{activeBus.busNo}</Text>
            <Text style={styles.routeName}>{activeBus.name}</Text>
          </View>
          <Badge
            label={activeBus.isStale ? 'TELEMETRY STALE' : 'LIVE GPS ACTIVE'}
            variant={activeBus.isStale ? 'warning' : 'success'}
            size="sm"
          />
        </View>

        <View style={styles.driverRow}>
          <MaterialCommunityIcons name="account-circle" size={16} color={THEME.colors.textSecondary} />
          <Text style={styles.driverText}>{activeBus.driver}</Text>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Speed</Text>
            <Text style={styles.statValue}>{activeBus.speed} km/h</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Occupancy</Text>
            <Text style={styles.statValue}>{activeBus.occupancy.split(' ')[0]}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Last Ping</Text>
            <Text style={styles.statValue}>{activeBus.lastUpdated}</Text>
          </View>
        </View>
      </Card>

      {/* Interactive Stop Progression Timeline */}
      <Text style={styles.sectionHeading}>Route Stop Progression</Text>
      <Card style={styles.timelineCard}>
        {activeBus.stops.map((stop, index) => {
          const isPassed = stop.status === 'passed';
          const isCurrent = stop.status === 'current';
          const isNext = stop.status === 'next';

          return (
            <View key={index} style={styles.timelineItem}>
              {/* Vertical connector line */}
              {index < activeBus.stops.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    isPassed ? styles.connectorPassed : styles.connectorPending,
                  ]}
                />
              )}

              {/* Stop Node Dot / Bus Icon */}
              <View
                style={[
                  styles.nodeDot,
                  isPassed && styles.nodePassed,
                  isCurrent && styles.nodeCurrent,
                  !isPassed && !isCurrent && styles.nodePending,
                ]}
              >
                {isCurrent ? (
                  <MaterialCommunityIcons name="bus" size={14} color="#FFF" />
                ) : isPassed ? (
                  <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                ) : (
                  <View style={styles.innerDot} />
                )}
              </View>

              {/* Stop Info */}
              <View style={styles.stopInfoCol}>
                <View style={styles.stopNameRow}>
                  <Text
                    style={[
                      styles.stopName,
                      isCurrent && styles.stopNameCurrent,
                      isPassed && styles.stopNamePassed,
                    ]}
                  >
                    {stop.name}
                  </Text>
                  {isCurrent && <Badge label="AT STOP" variant="primary" size="sm" />}
                  {isNext && <Badge label={`ETA ${stop.eta}`} variant="warning" size="sm" />}
                </View>

                {stop.time && <Text style={styles.stopTime}>Departed at {stop.time}</Text>}
                {stop.eta && !isNext && <Text style={styles.stopTime}>Approx. {stop.eta}</Text>}
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  subHeading: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: THEME.spacing.md,
  },
  routeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  routeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
  },
  routeBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  routeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  routeBtnTextActive: {
    color: '#FFF',
  },
  telemetryCard: {
    marginBottom: THEME.spacing.md,
    padding: 16,
    borderTopWidth: 4,
    borderTopColor: THEME.colors.accent,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  routeName: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  driverText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  timelineCard: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 22,
    left: 11,
    width: 2,
    bottom: -6,
    zIndex: 1,
  },
  connectorPassed: {
    backgroundColor: THEME.colors.success,
  },
  connectorPending: {
    backgroundColor: '#E2E8F0',
  },
  nodeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: 12,
  },
  nodePassed: {
    backgroundColor: THEME.colors.success,
  },
  nodeCurrent: {
    backgroundColor: THEME.colors.primary,
  },
  nodePending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  stopInfoCol: {
    flex: 1,
    paddingTop: 2,
  },
  stopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  stopNameCurrent: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  stopNamePassed: {
    color: THEME.colors.textSecondary,
  },
  stopTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
