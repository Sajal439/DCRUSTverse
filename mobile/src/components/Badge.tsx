import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../styles/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  return (
    <View style={[styles.container, styles[variant], size === 'sm' && styles.small]}>
      <Text style={[styles.text, textStyles[variant], size === 'sm' && styles.smallText]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primary: {
    backgroundColor: '#E0E7FF',
  },
  success: {
    backgroundColor: THEME.colors.successBg,
  },
  warning: {
    backgroundColor: THEME.colors.warningBg,
  },
  danger: {
    backgroundColor: THEME.colors.dangerBg,
  },
  info: {
    backgroundColor: THEME.colors.infoBg,
  },
  neutral: {
    backgroundColor: '#F1F5F9',
  },
  text: {
    ...THEME.typography.badge,
  },
  smallText: {
    fontSize: 9,
  },
});

const textStyles = StyleSheet.create({
  primary: { color: '#3730A3' },
  success: { color: '#065F46' },
  warning: { color: '#92400E' },
  danger: { color: '#991B1B' },
  info: { color: '#075985' },
  neutral: { color: '#475569' },
});
