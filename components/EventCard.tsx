import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { colors, shadows, radius } from '../lib/theme';

interface EventCardProps {
  title: string;
  date: string;
  venue?: string;
  bannerUri?: string;
  isPaid?: boolean;
  onPress: () => void;
}

export function EventCard({ title, date, venue, bannerUri, isPaid, onPress }: EventCardProps) {
  const eventDate = dayjs(date);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      {/* Banner */}
      {bannerUri ? (
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: bannerUri }}
            style={styles.bannerBg}
            blurRadius={20}
            resizeMode="cover"
          />
          <Image
            source={{ uri: bannerUri }}
            style={styles.bannerMain}
            resizeMode="contain"
          />
          {/* Gradient overlay for depth */}
          <LinearGradient
            colors={['transparent', 'rgba(6,46,40,0.5)']}
            style={styles.bannerOverlay}
          />
          {/* Floating date badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeMonth}>{eventDate.format('MMM')}</Text>
            <Text style={styles.dateBadgeDay}>{eventDate.format('DD')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderBanner}>
          <LinearGradient
            colors={[colors.teal.lighter, colors.teal.ghost]}
            style={styles.placeholderGradient}
          >
            <View style={styles.placeholderIconRing}>
              <Ionicons name="calendar" size={28} color={colors.teal.base} />
            </View>
          </LinearGradient>
          {/* Date badge for placeholder too */}
          <View style={[styles.dateBadge, { bottom: 8, left: 8 }]}>
            <Text style={styles.dateBadgeMonth}>{eventDate.format('MMM')}</Text>
            <Text style={styles.dateBadgeDay}>{eventDate.format('DD')}</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {isPaid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>PAID</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.slate[400]} />
          <Text style={styles.metaText}>{eventDate.format('hh:mm A')}</Text>

          {venue && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="location-outline" size={13} color={colors.slate[400]} />
              <Text style={[styles.metaText, { flex: 1 }]} numberOfLines={1}>
                {venue}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.teal.dark}06`,
    ...shadows.elevated,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.slate[900],
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  bannerMain: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  dateBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dateBadgeMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.teal.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBadgeDay: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.teal.dark,
    marginTop: -2,
  },
  placeholderBanner: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  placeholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.teal.base}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.slate[900],
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
    lineHeight: 21,
  },
  paidBadge: {
    backgroundColor: colors.gold.lighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidText: {
    color: colors.gold.dark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    color: colors.slate[500],
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.slate[300],
    marginRight: 8,
  },
});
