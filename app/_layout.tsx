import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AppStateProvider } from "@/state/AppStateProvider";
import { FiltersProvider } from "@/state/FiltersProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FinancialsProvider } from "@/state/FinancialsProvider";
import { CasinoStrategyProvider } from "@/state/CasinoStrategyProvider";
import { SimpleAnalyticsProvider } from "@/state/SimpleAnalyticsProvider";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { UserProvider } from "@/state/UserProvider";
import { CruiseStoreProvider } from "@/state/CruiseStore";
import { CelebrityProvider } from "@/state/CelebrityProvider";
import { LoyaltyProvider } from "@/state/LoyaltyProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

const rootStyles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: "modal",
          title: "Modal"
        }} 
      />
      <Stack.Screen 
        name="day-agenda" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="offer-details" 
        options={{ 
          presentation: "modal",
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={rootStyles.gestureHandler}>
        <ErrorBoundary>
          <UserProvider>
            <CruiseStoreProvider>
              <AppStateProvider>
                <FiltersProvider>
                  <FinancialsProvider>
                    <CasinoStrategyProvider>
                      <SimpleAnalyticsProvider>
                        <LoyaltyProvider>
                          <CelebrityProvider>
                            {showSplash && (
                              <WelcomeSplash 
                                onAnimationComplete={handleSplashComplete}
                                duration={2000}
                              />
                            )}
                            <RootLayoutNav />
                          </CelebrityProvider>
                        </LoyaltyProvider>
                      </SimpleAnalyticsProvider>
                    </CasinoStrategyProvider>
                  </FinancialsProvider>
                </FiltersProvider>
              </AppStateProvider>
            </CruiseStoreProvider>
          </UserProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
