import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Svg, { Path, Circle } from 'react-native-svg';

import HomeScreen from './screens/HomeScreen';
import VehicleRegistrationScreen from './screens/VehicleRegistrationScreen';
import QRCodeScreen from './screens/QRCodeScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PaymentScreen from './screens/PaymentScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import StickerDesignScreen from './screens/StickerDesignScreen';
import PhoneAuthScreen from './screens/PhoneAuthScreen';
import OrdersScreen from './screens/OrdersScreen';
import ActivateStickerScreen from './screens/ActivateStickerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const BACKEND = 'https://api.vahanping.com';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '83f0d288-277a-4d76-a82a-ba6a7ddbf014'
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('vahanping-alerts', {
      name: 'VahanPing Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }
  return token.data;
}

const HomeTabIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const AddTabIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

const AlertTabIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const StickerTabIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M7 7h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
);

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#9D65F5',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Vehicles', tabBarIcon: ({ color }) => <HomeTabIcon color={color} size={22} /> }} />
      <Tab.Screen name="Register" component={VehicleRegistrationScreen} options={{ tabBarLabel: 'Register', tabBarIcon: ({ color }) => <AddTabIcon color={color} size={22} /> }} />
      <Tab.Screen name="Activate" component={ActivateStickerScreen} options={{ tabBarLabel: 'Activate', tabBarIcon: ({ color }) => <StickerTabIcon color={color} size={22} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts', tabBarIcon: ({ color }) => <AlertTabIcon color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const init = async () => {
      const onboarding = await AsyncStorage.getItem('onboarding_done');
      const authDone = await AsyncStorage.getItem('auth_done');

      if (onboarding !== 'true') {
        setInitialRoute('Onboarding');
      } else if (authDone !== 'true') {
        setInitialRoute('PhoneAuth');
      } else {
        setInitialRoute('MainTabs');
      }
    };
    init();

    registerForPushNotificationsAsync().then(async token => {
      if (token) {
        await AsyncStorage.setItem('expo_push_token', token);
        // Sync push token with retry
        const syncToken = async (retries = 3) => {
          try {
            const stored = await AsyncStorage.getItem('vehicles');
            if (!stored) return;
            const vehicles = JSON.parse(stored);
            for (const vehicle of vehicles) {
              const res = await fetch(`${BACKEND}/api/v1/push-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qr_token: vehicle.token, push_token: token })
              });
              if (!res.ok && retries > 0) setTimeout(() => syncToken(retries - 1), 10000);
            }
          } catch (e) {
            if (retries > 0) setTimeout(() => syncToken(retries - 1), 10000);
          }
        };
        syncToken();
      }
    });

    // Save notification when received (app in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(async notification => {
      try {
        const stored = await AsyncStorage.getItem('vahanping_notifications');
        const notifs = stored ? JSON.parse(stored) : [];
        const newNotif = {
          id: Date.now().toString(),
          title: notification.request.content.title || 'VahanPing Alert',
          message: notification.request.content.body || '',
          time: new Date().toISOString(),
          read: false,
        };
        const updated = [newNotif, ...notifs].slice(0, 50);
        await AsyncStorage.setItem('vahanping_notifications', JSON.stringify(updated));
        // Auto navigate to Alerts tab when notification arrives in foreground
        if (navigationRef.isReady()) {
          navigationRef.navigate('MainTabs', { screen: 'Notifications' });
        }
      } catch (e) { console.log('Save notification error:', e); }
    });

    // Save + navigate when notification tapped
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      try {
        const content = response.notification.request.content;
        const stored = await AsyncStorage.getItem('vahanping_notifications');
        const notifs = stored ? JSON.parse(stored) : [];
        const newNotif = {
          id: Date.now().toString(),
          title: content.title || 'VahanPing Alert',
          message: content.body || '',
          time: new Date().toISOString(),
          read: false,
        };
        const exists = notifs.find(n => n.message === newNotif.message && Date.now() - new Date(n.time).getTime() < 10000);
        if (!exists) {
          const updated = [newNotif, ...notifs].slice(0, 50);
          await AsyncStorage.setItem('vahanping_notifications', JSON.stringify(updated));
        }
      } catch (e) { console.log('Save on tap error:', e); }

      setTimeout(() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('MainTabs', { screen: 'Notifications' });
        }
      }, 100);
    });

    // Handle app opened from killed state via notification
    Notifications.getLastNotificationResponseAsync().then(async response => {
      if (response) {
        try {
          const content = response.notification.request.content;
          const stored = await AsyncStorage.getItem('vahanping_notifications');
          const notifs = stored ? JSON.parse(stored) : [];
          const newNotif = {
            id: Date.now().toString(),
            title: content.title || 'VahanPing Alert',
            message: content.body || '',
            time: new Date().toISOString(),
            read: false,
          };
          const exists = notifs.find(n => n.message === newNotif.message && Date.now() - new Date(n.time).getTime() < 30000);
          if (!exists) {
            const updated = [newNotif, ...notifs].slice(0, 50);
            await AsyncStorage.setItem('vahanping_notifications', JSON.stringify(updated));
          }
        } catch (e) {}
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('MainTabs', { screen: 'Notifications' });
          }
        }, 500);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (initialRoute === null) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="StickerDesign" component={StickerDesignScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="ActivateSticker" component={ActivateStickerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
