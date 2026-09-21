import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { COLORS } from '../constants/theme';
import { useLibrary } from '../hooks/useLibrary';
import OnboardingScreen from '../screens/Onboarding';
import ProfileSetupScreen from '../screens/ProfileSetup';
import PlaylistDetailScreen from '../screens/PlaylistDetail';
import NowPlayingScreen from '../screens/NowPlaying';
import HistoryScreen from '../screens/History';
import PlaylistsListScreen from '../screens/PlaylistsList';
import ArtistsListScreen from '../screens/ArtistsList';
import AlbumsListScreen from '../screens/AlbumsList';
import SongsListScreen from '../screens/SongsList';
import DownloadedMusicScreen from '../screens/DownloadedMusic';

const Stack = createNativeStackNavigator();

const NoteTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    text: COLORS.text.primary,
  },
};

export const RootNavigator = () => {
  const { profile, isLoaded } = useLibrary();

  // Wait for persistence before choosing a route, otherwise a returning
  // user is flashed the onboarding screen for a frame.
  if (!isLoaded) return null;

  const initialRoute = profile.completed ? 'Main' : 'Onboarding';

  return (
    <NavigationContainer theme={NoteTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Playlist" component={PlaylistDetailScreen} />
        {/* Library menu destinations — pushed from the Library tab, not tabs themselves. */}
        <Stack.Screen name="PlaylistsList" component={PlaylistsListScreen} />
        <Stack.Screen name="ArtistsList" component={ArtistsListScreen} />
        <Stack.Screen name="AlbumsList" component={AlbumsListScreen} />
        <Stack.Screen name="SongsList" component={SongsListScreen} />
        <Stack.Screen name="DownloadedMusic" component={DownloadedMusicScreen} />
        {/* History left the tab bar (Profile replaced it) — still reachable
            from Library's "Recently Added" row and Profile's stat card. */}
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen 
          name="NowPlaying" 
          component={NowPlayingScreen} 
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
