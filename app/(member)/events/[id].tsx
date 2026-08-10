import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../../lib/api';
import { useProfile } from '../../../lib/hooks/useProfile';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../../components/ui/ErrorScreen';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';
const GOLD = '#C9972E';

function renderFormattedDescription(description?: string, eventTitle?: string, eventDate?: string, chiefGuest?: string) {
  if (!description) return <Text className="text-slate-500 italic">No description provided.</Text>;

  let text = description;
  text = text.replace(/\{\{MAJLIS_TITLE\}\}/g, eventTitle || '');
  text = text.replace(/\{\{EVENT_TITLE\}\}/g, eventTitle || '');
  text = text.replace(/\{\{ANNIVERSARY_TITLE\}\}/g, eventTitle || '');
  text = text.replace(/\{\{UROOS_NUMBER\}\}/g, 'ഉറൂസ് മുബാറക്');
  text = text.replace(/\{\{VENUE_NAME\}\}/g, 'മഹല്ല് ജുമാ മസ്ജിദ് അങ്കണം');
  text = text.replace(/\{\{TIME_SLOT\}\}/g, eventDate ? dayjs(eventDate).format('hh:mm A') : 'മഗ്‌രിബ് നമസ്കാരാനന്തരം');
  text = text.replace(/\{\{CHIEF_GUEST\}\}/g, chiefGuest || 'മഹല്ല് ഖതീബ് / ഭാരവാഹികൾ');
  text = text.replace(/\{\{KEYNOTE_SPEAKER_DAY1\}\}/g, 'മുഖ്യ പ്രഭാഷകർ');
  text = text.replace(/\{\{CHIEF_GUEST_DAY2\}\}/g, 'സയ്യിദ് ബാഫഖി തങ്ങൾ');
  text = text.replace(/\{\{GUEST_SINGER\}\}/g, 'ഇസ്ലാമിക് ഗായകർ');
  text = text.replace(/\{\{CONVENER_NAME\}\}/g, 'കൺവീനർ');
  text = text.replace(/\{\{DATES_RANGE\}\}/g, eventDate ? dayjs(eventDate).format('DD/MM/YYYY') : '');
  text = text.replace(/\{\{[^}]+\}\}/g, '').trim();

  const lines = text.split('\n');

  return (
    <View className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);

        return (
          <Text key={idx} className="text-slate-700 text-sm leading-6">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={pIdx} className="font-extrabold text-slate-900">
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part.replace(/\*\*/g, '');
            })}
          </Text>
        );
      })}
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  
  const [registering, setRegistering] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mobile', 'events', id],
    queryFn: async () => {
      const res = await apiClient.get(`/mobile/events?type=upcoming`); 
      const events = res.data.data;
      const found = events.find((e: any) => e._id === id);
      
      if (!found) {
        const pastRes = await apiClient.get(`/mobile/events?type=past`);
        return pastRes.data.data.find((e: any) => e._id === id);
      }
      return found;
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorScreen message="Event not found." onRetry={refetch} />;

  const isRegistered = data.registrations?.some((r: any) => r.memberId === profile?.member?._id);
  const isPast = dayjs(data.date).isBefore(dayjs());
  const isFull = data.capacity && data.registrations?.length >= data.capacity;

  const handleRegister = async () => {
    if (!profile?.member?._id) return;
    
    Alert.alert(
      "Confirm Registration",
      `Register for ${data.title}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setRegistering(true);
            try {
              await apiClient.post(`/events/${id}/register`, { memberId: profile.member._id });
              Alert.alert("Success", "You have successfully registered for this event.");
              refetch();
            } catch (error: any) {
              Alert.alert("Error", error.response?.data?.message || "Failed to register");
            } finally {
              setRegistering(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: CREAM }}>
      <ScrollView className="flex-1" bounces={false} showsVerticalScrollIndicator={false}>
        {/* Banner Image Container */}
        <View className="w-full bg-slate-950 relative items-center justify-center overflow-hidden" style={{ minHeight: 280, maxHeight: 360 }}>
          {data.banner?.url ? (
            <>
              <Image 
                source={{ uri: data.banner.url }} 
                className="absolute inset-0 w-full h-full opacity-35" 
                blurRadius={25}
                resizeMode="cover" 
              />
              <Image 
                source={{ uri: data.banner.url }} 
                className="w-full h-72" 
                resizeMode="contain" 
              />
            </>
          ) : (
            <View className="w-full h-64 bg-emerald-950 items-center justify-center">
              <Ionicons name="calendar" size={64} color="#34d399" style={{ opacity: 0.4 }} />
            </View>
          )}
          
          {/* Back Button Overlay */}
          <TouchableOpacity 
            className="absolute left-5 w-10 h-10 rounded-full bg-black/40 items-center justify-center z-10"
            style={{ top: Math.max(insets.top, 12) }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="p-6 -mt-8 bg-white rounded-t-[32px]" style={{ minHeight: 500, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 }}>
          {data.isPaid && (
            <View className="bg-amber-100 px-3 py-1 rounded-full self-start mb-3">
              <Text className="text-amber-600 text-[10px] font-extrabold uppercase tracking-wider">Paid Event • ₹{data.fee}</Text>
            </View>
          )}
          
          <Text className="text-slate-900 text-2xl font-extrabold mb-5 leading-tight">{data.title}</Text>

          <View className="space-y-4 mb-8">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-[14px] bg-emerald-50 items-center justify-center mr-4">
                <Ionicons name="calendar-outline" size={20} color={TEAL} />
              </View>
              <View>
                <Text className="text-slate-900 font-extrabold">{dayjs(data.date).format('dddd, DD MMMM YYYY')}</Text>
                <Text className="text-slate-500 font-bold text-xs mt-0.5">{dayjs(data.date).format('hh:mm A')}</Text>
              </View>
            </View>

            {data.venue && (
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-[14px] bg-blue-50 items-center justify-center mr-4">
                  <Ionicons name="location-outline" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-extrabold">Venue</Text>
                  <Text className="text-slate-500 font-bold text-xs mt-0.5 leading-relaxed">{data.venue}</Text>
                </View>
              </View>
            )}
          </View>

          <Text className="text-slate-900 text-lg font-extrabold mb-3">About Event</Text>
          <View className="mb-8">
            {renderFormattedDescription(data.description, data.title, data.date, data.chiefGuest)}
          </View>
        </View>
      </ScrollView>iew>

      {/* Registration Bottom Bar */}
      <View 
        className="bg-white border-t border-slate-100 p-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 20), shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 10 }}
      >
        {isPast ? (
          <View className="bg-slate-100 py-4 rounded-2xl items-center">
            <Text className="text-slate-500 font-extrabold">Event has ended</Text>
          </View>
        ) : isRegistered ? (
          <View className="bg-emerald-50 border border-emerald-200 py-4 rounded-2xl items-center flex-row justify-center">
            <Ionicons name="checkmark-circle" size={20} color={TEAL} />
            <Text className="text-emerald-700 font-extrabold ml-2">You are registered</Text>
          </View>
        ) : isFull ? (
          <View className="bg-rose-50 border border-rose-200 py-4 rounded-2xl items-center">
            <Text className="text-rose-600 font-extrabold">Registration Full</Text>
          </View>
        ) : (
          <TouchableOpacity 
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: GOLD }}
            onPress={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-extrabold text-base">Register Now</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
