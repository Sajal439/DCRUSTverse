import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  isOffline?: boolean;
  onLogout?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'DCRUSTverse',
  subtitle = 'Deenbandhu Chhotu Ram University',
  isOffline = false,
  onLogout,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="cloud-off-outline" size={16} color="#FFF" />
          <Text style={styles.offlineText}>Offline Mode — Showing Cached Campus Data</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="school" size={24} color={THEME.colors.accent} />
          </View>
          <View style={styles.titles}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {onOpenNotifications && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onOpenNotifications}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={THEME.colors.text} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {onLogout && (
            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 8 }]}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  offlineBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm + 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: THEME.colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
