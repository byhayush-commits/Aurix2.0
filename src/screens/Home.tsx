import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Track } from '../core/types';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { MusicService } from '../services/MusicService';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { StatusBarScrim } from '../components/common/StatusBarScrim';
import { useNavigation } from '@react-navigation/native';
import { TrackRow } from '../components/lists/TrackRow';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';

const SECTIONS: { key: string; title: string; query: string; cardSize: number; radius: number }[] = [
  { key: 'loveSongs', title: 'Love Songs', query: 'best love songs playlist', cardSize: 128, radius: SIZES.radius.md },
  { key: 'quickPicks', title: 'Recently Played', query: 'trending songs this week', cardSize: 108, radius: SIZES.radius.sm },
  { key: 'popHits', title: 'Made For You', query: 'pop hits', cardSize: 210, radius: SIZES.radius.lg },
  { key: 'newReleases', title: 'New Releases', query: 'new music releases', cardSize: 150, radius: SIZES.radius.lg },
  { key: 'trending', title: 'Trending Now', query: 'top global chart songs', cardSize: 128, radius: SIZES.radius.md },
  { key: 'recommended', title: 'Recommended For You', query: 'chill mood playlist', cardSize: 128, radius: SIZES.radius.md },
];

const PlayingIndicator: React.FC = () => {
  const bar0 = useRef(new Animated.Value(4)).current;
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(4)).current;
  const bars = [bar0, bar1, bar2];

  useEffect(() => {
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(bar, { toValue: 12, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(bar, { toValue: 6, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(bar, { toValue: 10, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(bar, { toValue: 4, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View style={styles.playingIndicator}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[styles.playingBar, { height: bar }]} />
      ))}
    </View>
  );
};

const HomeCard: React.FC<{ track: Track; size: number; radius: number; showPlaying?: boolean; onPress: (track: Track) => void }> = memo(({ track, size, radius, showPlaying, onPress }) => (
  <TouchableOpacity style={{ width: size }} activeOpacity={0.85} onPress={() => onPress(track)}>
    <View style={[styles.cardImageWrap, { width: size, height: size, borderRadius: radius }]}>
      <Image source={{ uri: track.albumImageUrl }} style={styles.cardImage} />
      {showPlaying && <PlayingIndicator />}
    </View>
    <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
    <Text style={styles.cardSubtitle} numberOfLines={1}>{track.artist.name}</Text>
  </TouchableOpacity>
));
HomeCard.displayName = 'HomeCard';

const SkeletonCard: React.FC<{ size: number; radius: number }> = ({ size, radius }) => (
  <View style={{ width: size }}>
    <View style={[styles.skeletonBox, { width: size, height: size, borderRadius: radius }]} />
    <View style={[styles.skeletonLine, { width: '75%' }]} />
    <View style={[styles.skeletonLine, { width: '50%', marginTop: 4 }]} />
  </View>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { playTrack, currentTrack, isPlaying, togglePlayPause, isLoading, next } = usePlayer();
  const { recentlyPlayed } = useLibrary();

  const [sectionData, setSectionData] = useState<Record<string, Track[]>>({});
  const [loading, setLoading] = useState(true);
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const results = await Promise.all(
        SECTIONS.map((s) =>
          MusicService.search(s.query, { limit: 10 }).then((r) => r.tracks).catch(() => [] as Track[])
        )
      );
      if (cancelled) return;
      const map: Record<string, Track[]> = {};
      SECTIONS.forEach((s, i) => (map[s.key] = results[i]));
      setSectionData(map);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const playFrom = (tracks: Track[], label: string) => (track: Track) => playTrack(track, { tracks, label });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: SIZES.bottomInset }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + SIZES.lg }]}>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Bell color={COLORS.text.primary} size={23} style={{ marginTop: 10 }} />
          </TouchableOpacity>
        </View>

        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Listening</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
              {recentlyPlayed.slice(0, 10).map((track) => (
                <HomeCard key={track.id} track={track} size={168} radius={SIZES.radius.lg} showPlaying={isPlaying && currentTrack?.id === track.id} onPress={playFrom(recentlyPlayed, 'Continue Listening')} />
              ))}
            </ScrollView>
          </View>
        )}

        {SECTIONS.map((section, index) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {index < 3 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} size={section.cardSize} radius={section.radius} />)
                  : (sectionData[section.key] ?? []).map((track) => (
                      <HomeCard key={track.id} track={track} size={section.cardSize} radius={section.radius} onPress={playFrom(sectionData[section.key] ?? [], section.title)} />
                    ))}
              </ScrollView>
            ) : (
              <View style={styles.vlist}>
                {(sectionData[section.key] ?? []).slice(0, 7).map((track) => (
                   <TrackRow key={track.id} track={track} onPress={playFrom(sectionData[section.key] ?? [], section.title)} onMorePress={(t) => setAddingTrack(t)} />
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <StatusBarScrim />
      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />

      {currentTrack && (
        <MiniPlayer track={currentTrack} isPlaying={isPlaying} isLoading={isLoading} onPlayPause={togglePlayPause} onNext={next} onPress={() => navigation.navigate('NowPlaying' as never)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingBottom: SIZES.md, marginTop: SIZES.md },
  headerTitle: { fontFamily: FONTS.extrabold, fontSize: 34, color: COLORS.text.primary, letterSpacing: -0.5 },
  section: { marginTop: SIZES.xl },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text.primary, paddingHorizontal: SIZES.md, marginBottom: SIZES.smd },
  hscroll: { paddingHorizontal: SIZES.md, gap: SIZES.smd },
  vlist: { paddingHorizontal: SIZES.md },
  cardImageWrap: { backgroundColor: COLORS.surfaceLight, overflow: 'hidden', marginBottom: SIZES.sm, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text.primary },
  cardSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  playingIndicator: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 6 },
  playingBar: { width: 3, backgroundColor: '#fff', borderRadius: 2 },
  skeletonBox: { backgroundColor: COLORS.surfaceLight, marginBottom: SIZES.sm },
  skeletonLine: { height: 11, borderRadius: 4, backgroundColor: COLORS.surfaceLight },
});
