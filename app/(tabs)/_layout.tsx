import { Tabs } from "expo-router";
import { 
  Tag, 
  CalendarClock, 
  Ship, 
  PartyPopper, 
  TrendingUp, 
  Settings
} from "lucide-react-native";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="(overview)"
      screenOptions={{
        tabBarActiveTintColor: COLORS.aquaAccent,
        tabBarInactiveTintColor: 'rgba(184, 212, 232, 0.5))',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['rgba(10, 30, 46, 0.92)', 'rgba(15, 58, 82, 0.95)']}
                style={StyleSheet.absoluteFill}
              />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidTabBar]} />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 4,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(overview)"
        options={{
          title: "Offers",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Tag color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scheduling"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <CalendarClock color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="booked"
        options={{
          title: "Booked",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ship color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <PartyPopper color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TrendingUp color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Settings color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  androidTabBar: {
    backgroundColor: COLORS.navyDeep,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 208, 225, 0.15)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
    opacity: 1,
  },
});
