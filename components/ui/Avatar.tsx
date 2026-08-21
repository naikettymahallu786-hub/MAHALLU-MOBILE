import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../lib/theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  bgColor?: string;
  showRing?: boolean;
  ringColor?: string;
}

export function Avatar({
  uri,
  name,
  size = 44,
  bgColor,
  showRing = false,
  ringColor,
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fontSize = size < 32 ? 11 : size < 48 ? 14 : size < 64 ? 18 : 22;
  const ringSize = size + 6;

  const avatarContent = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
    />
  ) : (
    <LinearGradient
      colors={[colors.teal.dark, colors.teal.base]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.initialsContainer, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </LinearGradient>
  );

  if (showRing) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <LinearGradient
          colors={[ringColor || colors.gold.base, ringColor || colors.gold.light]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ring,
            { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
          ]}
        >
          {avatarContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {avatarContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.slate[200],
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
});
