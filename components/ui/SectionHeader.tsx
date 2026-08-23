import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} style={styles.actionButton}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.gold.base,
    marginRight: 10,
  },
  title: {
    color: colors.slate[800],
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionButton: {
    backgroundColor: `${colors.teal.base}12`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionLabel: {
    color: colors.teal.base,
    fontSize: 12,
    fontWeight: '700',
  },
});
