import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Clock, Pencil, Check, X, Hammer, Info, Activity, Package } from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Header } from '../components/common/Header';
import { ListRow } from '../components/common/ListRow';
import { FlowerMark } from '../components/common/FlowerMark';
import { Gender } from '../services/LibraryService';
import { useLibrary } from '../hooks/useLibrary';

type StackParams = { History: undefined };

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unspecified', label: 'Prefer not to say' },
];

const REPO_URL = 'https://github.com/byhayush-commits/Aurix2.0';
const IG_URL = 'https://www.instagram.com/vivac_ayu';

// Hardcoded per explicit instruction -- not derived from app.json/expoConfig.
// Update these two lines manually at release time.
const APP_VERSION = '17.7.0';
const APP_BUILD = '069';

// Real installed versions, read from package.json / the native gradle file at
// the time this was written -- NewPipe Extractor's version is never guessed;
// it's the exact string pinned in modules/note-native's build.gradle.
const DEPENDENCIES: { name: string; version: string }[] = [
  { name: 'Expo', version: '57.0.22' },
  { name: 'React', version: '19.2.3' },
  { name: 'React Native', version: '0.86.3' },
  { name: 'React Navigation', version: '7.3.18' },
  { name: 'React Native Reanimated', version: '4.5.1' },
  { name: 'Expo Audio', version: '57.0.5' },
  { name: 'NewPipe Extractor', version: 'v0.26.5' },
];

/** Inline Instagram glyph (lucide dropped brand icons) — used only in the follow capsule. */
const InstagramGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="5.5" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={2} />
    <Circle cx="17.1" cy="6.9" r="1.3" fill={color} />
  </Svg>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
  const { profile, saveProfile, history, liked } = useLibrary();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@aurix_profile_pic').then((uri) => {
      if (uri) setProfileImageUri(uri);
    });
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfileImageUri(uri);
        await AsyncStorage.setItem('@aurix_profile_pic', uri);
      }
    } catch (e) {
      console.error('Image picker error', e);
    }
  };

  const commitName = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed !== profile.name) saveProfile({ name: trimmed });
  }, [name, profile.name, saveProfile]);

  /** Header icon = one unambiguous save-and-exit action while editing. */
  const handleHeaderIconPress = useCallback(() => {
    if (editing) {
      commitName();
      setEditing(false);
    } else {
      setEditing(true);
    }
  }, [editing, commitName]);

  const open = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  }, []);

  const initial = (profile.name || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + SIZES.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Profile"
          rightIcon={
            editing ? (
              <Check color={COLORS.accent.green} size={22} />
            ) : (
              <Pencil color={COLORS.text.primary} size={20} />
            )
          }
          onRightPress={handleHeaderIconPress}
        />

        {/* ---- identity ---- */}
        <View style={styles.identityRow}>
          <TouchableOpacity onPress={editing ? pickImage : undefined} style={styles.avatar}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
            {editing && (
              <View style={styles.cameraBadge}>
                <Pencil color="#fff" size={10} />
              </View>
            )}
          </TouchableOpacity>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleHeaderIconPress}
              placeholder="Your name"
              placeholderTextColor={COLORS.text.muted}
              returnKeyType="done"
              maxLength={40}
              autoFocus
            />
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile.name || 'No name set'}</Text>
              <Text style={styles.nameKicker}>LOCAL PROFILE</Text>
            </View>
          )}
        </View>

        {editing && (
          <>
            <View style={styles.pillRow}>
              {GENDERS.map((option) => {
                const active = profile.gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pill, active && styles.pillActive]}
                    activeOpacity={0.8}
                    onPress={() => saveProfile({ gender: option.value })}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.saveCapsule} activeOpacity={0.85} onPress={handleHeaderIconPress}>
              <Check color={COLORS.background} size={16} />
              <Text style={styles.saveCapsuleText}>Save changes</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ---- stats ---- */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statValue}>{liked.length}</Text>
              <Heart color={COLORS.accent.green} size={16} />
            </View>
            <Text style={styles.statLabel}>Liked Songs</Text>
          </View>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('History')}
          >
            <View style={styles.statTop}>
              <Text style={styles.statValue}>{history.length}</Text>
              <Clock color={COLORS.accent.green} size={16} />
            </View>
            <Text style={styles.statLabel}>Listening History</Text>
          </TouchableOpacity>
        </View>

        {/* ---- about ---- */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.group}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <View style={[styles.aboutRow, styles.aboutDivider]}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>{APP_BUILD}</Text>
          </View>
          <ListRow label="Source code" onPress={() => open(REPO_URL)} showDivider={false} />
        </View>

        {/* ---- development ---- */}
        <Text style={styles.sectionLabel}>DEVELOPMENT</Text>
        <View style={styles.group}>
          <ListRow
            icon={<Hammer color={COLORS.text.primary} size={20} />}
            label="Builder"
            onPress={() => setShowBuilder((v) => !v)}
            showDivider={showBuilder}
          />
          {showBuilder && (
            <View style={styles.builderCard}>
              <TouchableOpacity
                style={styles.builderClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => setShowBuilder(false)}
              >
                <X color={COLORS.text.secondary} size={18} />
              </TouchableOpacity>

              <View style={styles.builderRow}>
                <FlowerMark size={64} />
                <View style={styles.builderInfo}>
                  <Text style={styles.builderName}>Ayush</Text>
                  <Text style={styles.builderHandle}>@vivac_ayu</Text>
                </View>
              </View>

              <View style={styles.builderDivider} />

              <TouchableOpacity
                style={styles.followCapsule}
                activeOpacity={0.8}
                onPress={() => open(IG_URL)}
              >
                <InstagramGlyph size={18} />
                <Text style={styles.followText}>Tap to Follow</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ---- technical ---- */}
        <Text style={styles.sectionLabel}>TECHNICAL</Text>
        <View style={styles.group}>
          <ListRow
            icon={<Info color={COLORS.text.primary} size={20} />}
            label="System Information"
            onPress={() => setShowSystemInfo((v) => !v)}
            showDivider={showSystemInfo}
          />
          {showSystemInfo && (
            <View style={styles.infoBlock}>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>Platform</Text>
                <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>App version</Text>
                <Text style={styles.infoValue}>{APP_VERSION} ({APP_BUILD})</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>JS engine</Text>
                <Text style={styles.infoValue}>Hermes</Text>
              </View>
            </View>
          )}

          <ListRow
            icon={<Activity color={COLORS.text.primary} size={20} />}
            label="Diagnostics"
            onPress={() => setShowDiagnostics((v) => !v)}
            showDivider={showDiagnostics}
          />
          {showDiagnostics && (
            <View style={styles.infoBlock}>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>Audio engine</Text>
                <Text style={styles.infoValue}>expo-audio</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>Stream extraction</Text>
                <Text style={styles.infoValue}>NewPipe Extractor v0.26.5</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoKey}>Native module</Text>
                <Text style={styles.infoValue}>note-native</Text>
              </View>
            </View>
          )}

          <ListRow
            icon={<Package color={COLORS.text.primary} size={20} />}
            label="Open Source Libraries"
            onPress={() => setShowDependencies((v) => !v)}
            showDivider={showDependencies}
          />
          {showDependencies && (
            <View style={styles.infoBlock}>
              {DEPENDENCIES.map((dep) => (
                <View key={dep.name} style={styles.infoLine}>
                  <Text style={styles.infoKey}>{dep.name}</Text>
                  <Text style={styles.infoValue}>{dep.version}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ---- support ---- */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.group}>
          <ListRow label="Help & Support" onPress={() => open(REPO_URL + '/issues')} />
          <ListRow label="Report a Bug" onPress={() => open(REPO_URL + '/issues/new')} showDivider={false} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 34 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarInitial: { fontFamily: FONTS.extrabold, fontSize: 26, color: COLORS.text.primary },
  name: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text.primary },
  nameKicker: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.text.muted,
    marginTop: 3,
  },
  nameInput: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text.primary,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  pill: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.surfaceLight,
  },
  pillActive: { backgroundColor: COLORS.accent.green, borderColor: COLORS.accent.green },
  pillText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text.secondary },
  pillTextActive: { color: COLORS.text.primary },
  saveCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.accent.green,
    borderRadius: SIZES.radius.pill,
    paddingVertical: SIZES.sm + 2,
  },
  saveCapsuleText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.background },

  statsRow: {
    flexDirection: 'row',
    gap: SIZES.smd,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: { fontFamily: FONTS.extrabold, fontSize: 26, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text.secondary },

  sectionLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.text.muted,
    marginBottom: SIZES.sm,
    marginHorizontal: SIZES.md,
  },
  group: {
    marginHorizontal: SIZES.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.xl,
    overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  aboutDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.hairline },
  aboutLabel: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text.secondary },
  aboutValue: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text.primary },

  infoBlock: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xs,
    paddingBottom: SIZES.smd,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoKey: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text.secondary },
  infoValue: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text.primary },

  /* ---- builder card (inline expand, image-exact) ---- */
  builderCard: {
    marginHorizontal: SIZES.md,
    marginTop: SIZES.xs,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(250, 45, 85, 0.35)',
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  builderClose: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    padding: SIZES.xs,
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.lg,
    paddingTop: SIZES.sm,
  },
  builderInfo: { flex: 1 },
  builderName: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text.primary },
  builderHandle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  builderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(250, 45, 85, 0.35)',
    marginVertical: SIZES.lg,
  },
  followCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.smd,
    borderRadius: SIZES.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(250, 45, 85, 0.55)',
    backgroundColor: 'rgba(250, 45, 85, 0.08)',
    paddingVertical: SIZES.md - 2,
  },
  followText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text.primary },
});
