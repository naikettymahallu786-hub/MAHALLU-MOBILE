import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentProfile, useStudentHomework } from '../../lib/hooks/useStudentData';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import dayjs from 'dayjs';
import { colors, gradients, shadows, radius } from '../../lib/theme';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useStudentProfile();
  const { data: homework, isLoading: hwLoading } = useStudentHomework();

  if (profileLoading) return <LoadingScreen message="Loading student dashboard..." />;

  const pendingHomework = homework?.filter((hw: any) => !hw.mySubmission && dayjs().isBefore(hw.dueDate)) || [];

  const handleRefresh = () => {
    refetchProfile();
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Image
          source={require('../../assets/images/islamic_pattern.jpg')}
          style={styles.patternOverlay}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Avatar
                uri={profile?.memberId?.photo?.url}
                name={profile?.memberId?.name || 'Student'}
                size={44}
                showRing
                ringColor={colors.gold.base}
              />
              <View style={styles.headerText}>
                <Text style={styles.madrasaName}>{profile?.madrasaId?.name}</Text>
                <Text style={styles.studentGreeting} numberOfLines={1}>
                  Hi, {profile?.memberId?.name?.split(' ')[0] || 'Student'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.notifButton}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={profileLoading} onRefresh={handleRefresh} tintColor={colors.teal.base} />}
      >
        {/* Student ID Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.idCardWrapper}>
          <LinearGradient
            colors={gradients.headerCompact}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.idCard}
          >
            {/* Pattern overlay on card */}
            <Image
              source={require('../../assets/images/islamic_pattern.jpg')}
              style={styles.idCardPattern}
              resizeMode="cover"
            />
            <View style={styles.idCardContent}>
              <View>
                <Text style={styles.idLabel}>Student ID</Text>
                <Text style={styles.idValue}>{profile?.admissionNo}</Text>
              </View>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{profile?.classId?.name}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <StatCard
              icon="checkmark-circle"
              value={`${profile?.attendancePercent || 0}%`}
              label="Attendance"
              color={colors.blue.base}
              gradientColors={[colors.blue.base, '#2563EB']}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              icon="document-text"
              value={pendingHomework.length.toString()}
              label="Pending HW"
              color={pendingHomework.length > 0 ? colors.amber.base : colors.emerald.base}
              gradientColors={pendingHomework.length > 0 ? [colors.amber.base, '#D97706'] : [colors.emerald.base, '#059669']}
            />
          </View>
        </Animated.View>

        {/* Pending Homework Alert */}
        {pendingHomework.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.hwSection}>
            <SectionHeader
              title="Action Required"
              actionLabel="View All"
              onAction={() => router.push('/(student)/academics')}
            />
            <View style={styles.hwList}>
              {pendingHomework.slice(0, 2).map((hw: any) => (
                <TouchableOpacity
                  key={hw._id}
                  activeOpacity={0.8}
                  style={styles.hwCard}
                  onPress={() => router.push(`/(student)/homework/${hw._id}`)}
                >
                  <LinearGradient
                    colors={[colors.gold.base, colors.gold.light]}
                    style={styles.hwAccent}
                  />
                  <View style={styles.hwContent}>
                    <View style={styles.hwDueRow}>
                      <Ionicons name="time-outline" size={13} color={colors.gold.base} />
                      <Text style={styles.hwDueText}>
                        Due {dayjs(hw.dueDate).fromNow()}
                      </Text>
                    </View>
                    <Text style={styles.hwTitle} numberOfLines={1}>{hw.title}</Text>
                    <Text style={styles.hwSubject}>{hw.subject}</Text>
                  </View>
                  <View style={styles.hwChevron}>
                    <Ionicons name="chevron-forward" size={18} color={colors.slate[400]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            <QuickActionItem
              icon="calendar"
              label="Timetable"
              gradient={[colors.purple.base, '#7C3AED']}
              onPress={() => router.push('/(student)/schedule')}
            />
            <QuickActionItem
              icon="book"
              label="Subjects"
              gradient={[colors.emerald.base, '#059669']}
              onPress={() => router.push('/(student)/academics')}
            />
            <QuickActionItem
              icon="podium"
              label="Results"
              gradient={[colors.blue.base, '#2563EB']}
              onPress={() => router.push('/(student)/academics')}
            />
            <QuickActionItem
              icon="id-card"
              label="ID Card"
              gradient={[colors.rose.base, '#E11D48']}
              onPress={() => router.push('/(student)/more')}
            />
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function QuickActionItem({ icon, label, gradient, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.actionItem}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionIcon}
      >
        <Ionicons name={icon} size={22} color={colors.white} />
      </LinearGradient>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  madrasaName: {
    fontSize: 11,
    fontWeight: '700',
    color: `${colors.gold.light}90`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentGreeting: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.white,
    marginTop: 1,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Student ID Card
  idCardWrapper: {
    marginTop: -16,
    marginBottom: 20,
  },
  idCard: {
    borderRadius: radius.xl,
    padding: 20,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  idCardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  idCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: `${colors.gold.light}80`,
    marginBottom: 4,
  },
  idValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  classBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  classBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  // Homework
  hwSection: {
    marginBottom: 4,
  },
  hwList: {
    marginTop: 8,
    gap: 10,
  },
  hwCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.teal.dark}06`,
    ...shadows.card,
  },
  hwAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  hwContent: {
    flex: 1,
    marginRight: 12,
  },
  hwDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hwDueText: {
    fontWeight: '800',
    fontSize: 11,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.gold.dark,
  },
  hwTitle: {
    color: colors.slate[800],
    fontWeight: '700',
    fontSize: 14,
  },
  hwSubject: {
    color: colors.slate[500],
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  hwChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 16,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.slate[600],
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});