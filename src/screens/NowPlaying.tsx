import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Heart, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, MonitorSpeaker, ListMusic, ListPlus, Mic2, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { PlaybackSourceSheet } from '../components/player/PlaybackSourceSheet';
import { SeekBar } from '../components/player/SeekBar';
import { LyricsView } from '../components/player/LyricsView';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { Track } from '../core/types';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const EqBars: React.FC = () => {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(Animated.sequence([Animated.timing(bar1, {toValue: 14, duration: 400, useNativeDriver: false}), Animated.timing(bar1, {toValue: 6, duration: 400, useNativeDriver: false})])),
      Animated.loop(Animated.sequence([Animated.timing(bar2, {toValue: 6, duration: 300, useNativeDriver: false}), Animated.timing(bar2, {toValue: 16, duration: 300, useNativeDriver: false})])),
      Animated.loop(Animated.sequence([Animated.timing(bar3, {toValue: 12, duration: 500, useNativeDriver: false}), Animated.timing(bar3, {toValue: 4, duration: 500, useNativeDriver: false})]))
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={styles.queueEqBars}>
      <Animated.View style={[styles.queueEqBar, { height: bar1 }]} />
      <Animated.View style={[styles.queueEqBar, { height: bar2 }]} />
      <Animated.View style={[styles.queueEqBar, { height: bar3 }]} />
    </View>
  );
};

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currentTrack, isPlaying, togglePlayPause, isLoading, isBuffering, error, retry, seekTo, next, previous, shuffle, toggleShuffle, repeat, cycleRepeat, upcoming, jumpTo, removeFromQueue, canPlayCurrent } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const [view, setView] = useState<'player' | 'lyrics'>('player');
  const [showQueue, setShowQueue] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const busy = isLoading || isBuffering;

  return (
    <View style={styles.container}>
      {/* Dynamic blurred background */}
      <Image source={{ uri: currentTrack.albumImageUrl }} style={StyleSheet.absoluteFill} blurRadius={150} resizeMode="cover" />
      <LinearGradient colors={['rgba(0, 0, 0, 0.3)', 'rgba(10, 10, 10, 0.85)', COLORS.background]} locations={[0, 0.5, 0.9]} style={StyleSheet.absoluteFill} />

      <View style={[styles.content, { paddingTop: insets.top + SIZES.xl, paddingBottom: insets.bottom + SIZES.md }]}>

        {/* Decluttered Apple-style Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <ChevronDown color={COLORS.text.primary} size={28} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.headerIcon} onPress={() => setAddingTrack(currentTrack)}>
            <ListPlus color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
        </View>

        {view === 'player' ? (
          <>
            <View style={styles.artworkContainer}>
              <Image source={{ uri: currentTrack.albumImageUrl }} style={styles.artwork} />
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.textInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist.name}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleLike(currentTrack)}>
                <Heart color={liked ? COLORS.accent.green : COLORS.text.primary} fill={liked ? COLORS.accent.green : 'transparent'} size={28} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.lyricsWrap}>
            <View style={styles.lyricsHeaderRow}>
              <Image source={{ uri: currentTrack.albumImageUrl }} style={styles.lyricsThumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lyricsHeaderTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.lyricsHeaderArtist} numberOfLines={1}>{currentTrack.artist.name}</Text>
              </View>
            </View>
            <LyricsView track={currentTrack} duration={400} onSeek={seekTo} />
          </View>
        )}

        <SeekBar onSeek={seekTo} />

        {error && (
          <TouchableOpacity activeOpacity={0.8} onPress={retry} style={styles.errorBanner}>
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            <Text style={styles.errorHint}>Tap to retry</Text>
          </TouchableOpacity>
        )}

        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleShuffle}>
            <Shuffle color={shuffle ? COLORS.accent.green : COLORS.text.secondary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={previous}><SkipBack color={COLORS.text.primary} size={32} /></TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            {busy ? (<ActivityIndicator color={COLORS.background} />) : isPlaying ? (<Pause color={COLORS.background} size={32} fill={COLORS.background} />) : (<Play color={COLORS.background} size={32} fill={COLORS.background} />)}
          </TouchableOpacity>
          <TouchableOpacity onPress={next}><SkipForward color={COLORS.text.primary} size={32} /></TouchableOpacity>
          <TouchableOpacity onPress={cycleRepeat}>
            {repeat === 'one' ? (<Repeat1 color={COLORS.accent.green} size={24} />) : (<Repeat color={repeat === 'all' ? COLORS.accent.green : COLORS.text.secondary} size={24} />)}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setView((v) => (v === 'lyrics' ? 'player' : 'lyrics'))}>
            <Mic2 color={view === 'lyrics' ? COLORS.accent.green : COLORS.text.secondary} size={20} />
            <Text style={[styles.secondaryLabel, view === 'lyrics' && styles.secondaryLabelActive]}>Lyrics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowQueue(true)}>
            <ListMusic color={COLORS.text.secondary} size={20} />
            <Text style={styles.secondaryLabel}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSource(true)}>
            <MonitorSpeaker color={canPlayCurrent ? COLORS.text.secondary : COLORS.accent.red} size={20} />
            <Text style={styles.secondaryLabel}>Source</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exact Image 4 Queue Sheet */}
      {showQueue && (
        <View style={styles.queueOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowQueue(false)} />
          <View style={styles.queueSheet}>
            <View style={styles.grabber} />
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitleHeading}>Playing Next</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)} style={styles.queueCloseBtn}>
                <X color={COLORS.text.secondary} size={20} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: SIZES.lg }}>
              {currentTrack && (
                <View style={styles.queueCurrentRow}>
                  <Image source={{ uri: currentTrack.albumImageUrl }} style={styles.queueArtwork} />
                  <View style={styles.queueCurrentTextWrap}>
                    <Text style={styles.queueCurrentLabel}>NOW PLAYING</Text>
                    <Text style={styles.queueCurrentTitle} numberOfLines={1}>{currentTrack.title}</Text>
                    <Text style={styles.queueCurrentArtist} numberOfLines={1}>{currentTrack.artist.name}</Text>
                  </View>
                  {isPlaying && <EqBars />}
                </View>
              )}

              <View style={styles.queueDivider} />

              {upcoming.length === 0 ? (
                <Text style={styles.queueEmptyText}>Nothing queued.</Text>
              ) : (
                upcoming.map((track) => (
                  <TouchableOpacity key={track.id} style={styles.queueRow} onPress={() => { jumpTo(track.id); setShowQueue(false); }} activeOpacity={0.7}>
                    <Image source={{ uri: track.albumImageUrl }} style={styles.queueArtwork} />
                    <View style={styles.queueRowMain}>
                      <Text style={styles.queueTrackTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.queueArtist} numberOfLines={1}>{track.artist.name}</Text>
                    </View>
                    <View style={styles.queueDragHandle}>
                      <View style={styles.queueDragLine} />
                      <View style={styles.queueDragLine} />
                      <View style={styles.queueDragLine} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />
      <PlaybackSourceSheet visible={showSource} onClose={() => setShowSource(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SIZES.lg, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.lg },
  headerIcon: { padding: SIZES.xs },
  artworkContainer: { width: width - SIZES.lg * 2, height: width - SIZES.lg * 2, borderRadius: SIZES.radius.md, overflow: 'hidden', alignSelf: 'center', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, marginBottom: SIZES.xl },
  artwork: { width: '100%', height: '100%' },
  infoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.lg },
  textInfo: { flex: 1, paddingRight: SIZES.md },
  trackTitle: { fontFamily: FONTS.medium, fontSize: 24, color: COLORS.text.primary, marginBottom: 4 },
  trackArtist: { fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text.secondary },
  lyricsWrap: { flex: 1, marginBottom: SIZES.md },
  lyricsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingBottom: SIZES.sm },
  lyricsThumb: { width: 40, height: 40, borderRadius: 10, opacity: 0.7 },
  lyricsHeaderTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text.primary },
  lyricsHeaderArtist: { fontFamily: FONTS.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xl, paddingHorizontal: SIZES.sm },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.text.primary, justifyContent: 'center', alignItems: 'center' },
  bottomActions: { flexDirection: 'row', alignItems: 'center' },
  secondaryButton: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: SIZES.xs },
  secondaryLabel: { fontFamily: FONTS.semibold, fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  secondaryLabelActive: { color: COLORS.accent.green },
  errorBanner: { backgroundColor: COLORS.accent.redGlow, borderRadius: SIZES.radius.sm, borderWidth: 1, borderColor: COLORS.accent.red, padding: SIZES.sm, marginBottom: SIZES.md },
  errorText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text.primary },
  errorHint: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.text.secondary, marginTop: 2 },
  queueOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  queueSheet: { maxHeight: '70%', backgroundColor: COLORS.surfaceRaised, borderTopLeftRadius: SIZES.radius.lg, borderTopRightRadius: SIZES.radius.lg, padding: SIZES.lg },
  grabber: { width: 36, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: SIZES.md },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  queueTitleHeading: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text.primary },
  queueCloseBtn: { padding: SIZES.xs },
  queueCurrentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md },
  queueCurrentTextWrap: { flex: 1, marginRight: SIZES.md },
  queueCurrentLabel: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 1, color: COLORS.text.muted, marginBottom: 2 },
  queueCurrentTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.accent.green },
  queueCurrentArtist: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.accent.green, marginTop: 1 },
  queueEqBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  queueEqBar: { width: 3, backgroundColor: COLORS.accent.green, borderRadius: 1.5 },
  queueDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.hairline, marginBottom: SIZES.md },
  queueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm },
  queueRowMain: { flex: 1, paddingRight: SIZES.sm },
  queueArtwork: { width: 48, height: 48, borderRadius: SIZES.radius.sm, backgroundColor: COLORS.surfaceLight, marginRight: SIZES.md },
  queueTrackTitle: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  queueArtist: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text.secondary, marginTop: 1 },
  queueDragHandle: { paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  queueDragLine: { width: 14, height: 2, backgroundColor: COLORS.text.muted, marginBottom: 2, borderRadius: 1 },
  queueEmptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', marginTop: SIZES.lg },
});
