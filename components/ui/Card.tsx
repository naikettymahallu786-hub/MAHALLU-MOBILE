import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, shadows, radius } from '../../lib/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'outlined';
  animated?: boolean;
  delay?: number;
}

export function Card({
  children,
  variant = 'default',
  animated = false,
  delay = 0,
  style,
  ...props
}: CardProps) {
  const variantStyle = variantStyles[variant];

  const content = (
    <View {...props} style={[styles.base, variantStyle, style] as any}>
      {variant === 'glass' && <View style={styles.glassShine as any} />}
      {children}
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInUp.delay(delay).springify().damping(18)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: 20,
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ translateX: 40 }, { translateY: -40 }],
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.teal.dark}08`,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: colors.white,
    borderWidth: 0,
    ...shadows.elevated,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.card,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.slate[200],
  },
});
