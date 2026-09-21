import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
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

/** Seconds -> m:ss, for the progress labels. */
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    isLoading,
    isBuffering,
    error,
    retry,
    seekTo,
    duration,
    next,
    previous,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    upcoming,
    queueContext,
    jumpTo,
    removeFromQueue,
    canPlayCurrent,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [view, setView] = useState<'player' | 'lyrics'>('player');
  const [showQueue, setShowQueue] = useState(false);
  const [showSource, setShowSource] = useState(false);
  /** Track whose "add to playlist" sheet is open. */
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const busy = isLoading || isBuffering;

  return (
    <View style={styles.container}>
      {/* Background artwork blur */}
      <Image
        source={{ uri: currentTrack.albumImageUrl }}
        style={StyleSheet.absoluteFill}
        blurRadius={100}
      />
      <LinearGradient
        colors={['rgba(5, 7, 7, 0.4)', COLORS.background]}
        locations={[0, 0.7]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + SIZES.md }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <ChevronDown color={COLORS.text.primary} size={28} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSub}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {queueContext || 'Aurix'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setAddingTrack(currentTrack)}
          >
            <ListPlus color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
        </View>

        {/* Player <-> Lyrics swap. Aurix keeps progress + transport controls
            fixed below this regardless of which view is showing. */}
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
                <Heart
                  color={liked ? COLORS.accent.green : COLORS.text.primary}
                  fill={liked ? COLORS.accent.green : 'transparent'}
                  size={28}
                />
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
            <LyricsView track={currentTrack} duration={duration} onSeek={seekTo} />
          </View>
        )}

        {/* Progress. SeekBar owns its own measurement, gesture handling and
            position subscription, so this screen no longer re-renders on every
            playback tick. Always visible, regardless of view. */}
        <SeekBar onSeek={seekTo} />

        {/* Error state -- never leaves the player stuck */}
        {error && (
          <TouchableOpacity activeOpacity={0.8} onPress={retry} style={styles.errorBanner}>
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            <Text style={styles.errorHint}>Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Main Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleShuffle}>
            <Shuffle color={shuffle ? COLORS.accent.green : COLORS.text.secondary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={previous}>
            <SkipBack color={COLORS.text.primary} size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            {busy ? (
              <ActivityIndicator color={COLORS.background} />
            ) : isPlaying ? (
              <Pause color={COLORS.background} size={32} fill={COLORS.background} />
            ) : (
              <Play color={COLORS.background} size={32} fill={COLORS.background} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={next}>
            <SkipForward color={COLORS.text.primary} size={32} />
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleRepeat}>
            {repeat === 'one' ? (
              <Repeat1 color={COLORS.accent.green} size={24} />
            ) : (
              <Repeat
                color={repeat === 'all' ? COLORS.accent.green : COLORS.text.secondary}
                size={24}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Secondary row — Lyrics / Queue / Source, matching Aurix's
            Lyrics/Queue/Sleep row. NOTE has no sleep timer, so the third
            slot stays Source (multi-backend picker), a real NOTE feature
            Aurix doesn't have — dropped rather than faked. */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setView((v) => (v === 'lyrics' ? 'player' : 'lyrics'))}
          >
            <Mic2 color={view === 'lyrics' ? COLORS.accent.green : COLORS.text.secondary} size={20} />
            <Text style={[styles.secondaryLabel, view === 'lyrics' && styles.secondaryLabelActive]}>
              Lyrics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowQueue(true)}>
            <ListMusic color={COLORS.text.secondary} size={20} />
            <Text style={styles.secondaryLabel}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSource(true)}>
            <MonitorSpeaker
              color={canPlayCurrent ? COLORS.text.secondary : COLORS.accent.red}
              size={20}
            />
            <Text style={styles.secondaryLabel}>Source</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Queue sheet */}
      {showQueue && (
        <View style={styles.queueOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowQueue(false)} />
          <View style={styles.queueSheet}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitleHeading}>Up Next</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <X color={COLORS.text.secondary} size={20} />
              </TouchableOpacity>
            </View>
            {upcoming.length === 0 ? (
              <Text style={styles.lyricsText}>Nothing queued.</Text>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: SIZES.lg }}>
                {upcoming.map((track) => (
                  <View key={track.id} style={styles.queueRow}>
                    <TouchableOpacity
                      style={styles.queueRowMain}
                      onPress={() => {
                        jumpTo(track.id);
                        setShowQueue(false);
                      }}
                    >
                      <Text style={styles.queueTrackTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.queueArtist} numberOfLines={1}>
                        {track.artist.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromQueue(track.id)}>
                      <X color={COLORS.text.muted} size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />

      <PlaybackSourceSheet visible={showSource} onClose={() => setShowSource(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  headerIcon: {
    padding: SIZES.xs,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  artworkContainer: {
    width: width - SIZES.lg * 2,
    height: width - SIZES.lg * 2,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    alignSelf: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    marginBottom: SIZES.xl,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  textInfo: {
    flex: 1,
    paddingRight: SIZES.md,
  },
  trackTitle: {
    fontFamily: FONTS.medium,
    fontSize: 24,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  trackArtist: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  lyricsWrap: {
    flex: 1,
    marginBottom: SIZES.md,
  },
  lyricsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  lyricsThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    opacity: 0.7,
  },
  lyricsHeaderTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  lyricsHeaderArtist: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.sm,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: SIZES.xs,
  },
  secondaryLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
  },
  secondaryLabelActive: {
    color: COLORS.accent.green,
  },
  lyricsText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: COLORS.accent.redGlow,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.accent.red,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  errorHint: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  queueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  queueSheet: {
    maxHeight: '60%',
    backgroundColor: COLORS.surfaceRaised,
    borderTopLeftRadius: SIZES.radius.lg,
    borderTopRightRadius: SIZES.radius.lg,
    padding: SIZES.lg,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  queueTitleHeading: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.text.primary,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  queueRowMain: {
    flex: 1,
    paddingRight: SIZES.sm,
  },
  queueTrackTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  queueArtist: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 1,
  },
});
