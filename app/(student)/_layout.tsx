import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/ui/TabBar';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

export default function StudentLayout() {
  const { language } = useLanguageStore();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation, descriptors }) => {
        const routes = state.routes;
        const activeRoute = routes[state.index].name;

        const tabs = [
          { name: 'home', label: t('tabHome', language), icon: 'home-outline' as any, iconFocused: 'home' as any },
          { name: 'academics', label: t('tabAcademics', language), icon: 'book-outline' as any, iconFocused: 'book' as any },
          { name: 'schedule', label: t('tabSchedule', language), icon: 'time-outline' as any, iconFocused: 'time' as any },
          { name: 'more', label: t('tabMore', language), icon: 'menu-outline' as any, iconFocused: 'menu' as any },
        ];

        const activeDescriptor = descriptors[routes[state.index].key];
        const tabBarStyle = activeDescriptor.options.tabBarStyle as any;
        if (tabBarStyle?.display === 'none') return null;

        return (
          <TabBar
            tabs={tabs}
            activeTab={activeRoute}
            onTabPress={(name) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: routes.find(r => r.name === name)?.key || '',
                canPreventDefault: true,
              });

              if (!event.defaultPrevented) {
                navigation.navigate(name);
              }
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="academics" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="more" />
      
      {/* Hidden from tab bar */}
      <Tabs.Screen name="homework/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="exams/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
