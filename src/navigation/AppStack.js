import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton, Badge } from 'react-native-paper';
import { COLORS } from '../config/constants';
import NotificationDropdown from '../components/NotificationDropdown';

// Home
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';

// Discover
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import PlaceDetailScreen from '../screens/discover/PlaceDetailScreen';
import MapExploreScreen from '../screens/discover/MapExploreScreen';

// Events
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';

// Planner
import ItineraryListScreen from '../screens/planner/ItineraryListScreen';
import ItineraryDetailScreen from '../screens/planner/ItineraryDetailScreen';

// Social
import FeedScreen from '../screens/social/FeedScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';
import ShareQRScreen from '../screens/social/ShareQRScreen';

// Chat
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';

// Profile
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import PreferencesScreen from '../screens/profile/PreferencesScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Reviews
import WriteReviewScreen from '../screens/reviews/WriteReviewScreen';
import ReviewListScreen from '../screens/reviews/ReviewListScreen';

// Notifications
import NotificationScreen from '../screens/notifications/NotificationScreen';

// Admin
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManageEventsScreen from '../screens/admin/ManageEventsScreen';
import ManageReviewsScreen from '../screens/admin/ManageReviewsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack({ navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          title: 'ExploreEase',
          headerRight: () => <NotificationBell navigation={navigation} />,
        }} 
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: 'Place Details' }} />
      <Stack.Screen name="ReviewList" component={ReviewListScreen} options={{ title: 'Reviews' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write Review' }} />
      <Stack.Screen name="MapExplore" component={MapExploreScreen} options={{ title: 'Map' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

function DiscoverStack({ navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DiscoverMain" 
        component={DiscoverScreen} 
        options={{ 
          title: 'Discover',
          headerRight: () => <NotificationBell navigation={navigation} />,
        }} 
      />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: 'Place Details' }} />
      <Stack.Screen name="MapExplore" component={MapExploreScreen} options={{ title: 'Map' }} />
      <Stack.Screen name="ReviewList" component={ReviewListScreen} options={{ title: 'Reviews' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write Review' }} />
    </Stack.Navigator>
  );
}

function EventStack({ navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EventList" 
        component={EventListScreen} 
        options={{ 
          title: 'Events',
          headerRight: () => <NotificationBell navigation={navigation} />,
        }} 
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
    </Stack.Navigator>
  );
}

function PlannerStack({ navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ItineraryList" 
        component={ItineraryListScreen} 
        options={{ 
          title: 'My Plans',
          headerRight: () => <NotificationBell navigation={navigation} />,
        }} 
      />
      <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen} options={{ title: 'Itinerary' }} />
    </Stack.Navigator>
  );
}

function ProfileStack({ navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MyProfile" 
        component={MyProfileScreen} 
        options={{ 
          title: 'My Profile',
          headerRight: () => <NotificationBell navigation={navigation} />,
        }} 
      />
      <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: 'Preferences' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: 'Social Feed' }} />
      <Stack.Screen name="ShareQR" component={ShareQRScreen} options={{ title: 'Share QR' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users' }} />
      <Stack.Screen name="ManageEvents" component={ManageEventsScreen} options={{ title: 'Manage Events' }} />
      <Stack.Screen name="ManageReviews" component={ManageReviewsScreen} options={{ title: 'Manage Reviews' }} />
    </Stack.Navigator>
  );
}

const getTabIcon = (routeName) => {
  switch (routeName) {
    case 'Home': return 'home';
    case 'Discover': return 'compass';
    case 'Events': return 'calendar';
    case 'Planner': return 'map-marker-path';
    case 'Profile': return 'account';
    default: return 'circle';
  }
};

function NotificationBell({ navigation }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <IconButton 
        icon="bell" 
        iconColor={COLORS.primary}
        size={24}
        onPress={() => setShowDropdown(true)}
      />
      <NotificationDropdown 
        visible={showDropdown}
        onDismiss={() => setShowDropdown(false)}
        onSeeAll={() => {
          setShowDropdown(false);
          navigation.navigate('Notifications');
        }}
      />
    </>
  );
}

export default function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <IconButton icon={getTabIcon(route.name)} iconColor={color} size={size} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Events" component={EventStack} />
      <Tab.Screen name="Planner" component={PlannerStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
