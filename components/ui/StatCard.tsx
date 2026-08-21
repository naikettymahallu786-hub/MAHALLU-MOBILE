import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, radius } from '../../lib/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
  gradientColors?: readonly [string, string];
}

export function StatCard({
  icon,
  value,
  label,
  color = colors.teal.base,
  gradientColors,
}: StatCardProps) {
  const iconGradient = gradientColors || [color, `${color}90`];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={iconGradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={icon} size={18} color={colors.white} />
      </LinearGradient>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>

      {/* Decorative corner accent */}
      <View style={[styles.cornerAccent, { backgroundColor: `${color}08` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    flex: 1,
    minWidth: 140,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.teal.dark}06`,
    ...shadows.card,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  label: {
    color: colors.slate[500],
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  cornerAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
