import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Clock,
  Pencil,
  Check,
  ExternalLink,
  Hammer,
  AtSign,
  Info,
  Activity,
  Package,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
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
const GPL_URL = 'https://www.gnu.org/licenses/gpl-3.0.en.html';
const NEWPIPE_URL = 'https://github.com/TeamNewPipe/NewPipeExtractor';

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
  const { profile, saveProfile, history, liked } = useLibrary();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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

  // Explicit save: tapping the header icon while editing commits the name
  // AND closes edit mode in one, unambiguous action -- no more relying on
  // blur timing or having to tap the pencil a second time to "know" it saved.
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
            <Text style={styles.name}>{profile.name || 'No name set'}</Text>
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
            <TouchableOpacity style={styles.saveBar} activeOpacity={0.85} onPress={handleHeaderIconPress}>
              <Check color={COLORS.background} size={16} />
              <Text style={styles.saveBarText}>Save changes</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.statsRow}>
          <StatCard icon={<Heart color={COLORS.accent.green} size={20} />} value={liked.length} label="Liked Songs" />
          <TouchableOpacity style={styles.statTouchable} onPress={() => navigation.navigate('History')}>
            <StatCard
              icon={<Clock color={COLORS.accent.green} size={20} />}
              value={history.length}
              label="Listening History"
            />
          </TouchableOpacity>
        </View>

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

        <Text style={styles.sectionLabel}>DEVELOPMENT</Text>
        <View style={styles.group}>
          <ListRow
            icon={<Hammer color={COLORS.text.primary} size={20} />}
            label="Builder"
            onPress={() => setShowBuilder((v) => !v)}
            showDivider={false}
          />
          {showBuilder && (
            <View style={styles.builderCard}>
              <FlowerMark size={52} />
              <View style={styles.builderInfo}>
                <Text style={styles.builderName}>Ayush</Text>
                <Text style={styles.builderFollow}>Follow</Text>
                <TouchableOpacity
                  style={styles.builderIgRow}
                  activeOpacity={0.7}
                  onPress={() => open(IG_URL)}
                >
                  <AtSign color={COLORS.text.primary} size={15} />
                  <Text style={styles.builderIgHandle}>vivac_ayu</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

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
            showDivider={false}
          />
        </View>

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.group}>
          <ListRow label="Help & Support" onPress={() => open(REPO_URL + '/issues')} />
          <ListRow label="Report a Bug" onPress={() => open(REPO_URL + '/issues/new')} showDivider={false} />
        </View>

        <Text style={styles.sectionLabel}>LICENCE</Text>
        <View style={styles.group}>
          <View style={styles.licenceHeaderRow}>
            <Text style={styles.licenceAppName}>Aurix</Text>
            <Text style={styles.licenceType}>GPL-3.0-or-later</Text>
          </View>
          <ListRow
            label="Dependencies"
            onPress={() => setShowDependencies((v) => !v)}
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
          <ListRow label="Read GPL-3.0" onPress={() => open(GPL_URL)} showDivider={false} />
        </View>

        {/* ---- Legal body text — required attribution, kept verbatim ---- */}
        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>Aurix</Text>
          <Text style={styles.legalBody}>
            Copyright © 2026 Ayush.{'\n\n'}
            This program is free software: you can redistribute it and/or modify it
            under the terms of the GNU General Public License as published by the
            Free Software Foundation, either version 3 of the License, or (at your
            option) any later version.{'\n\n'}
            This program is distributed in the hope that it will be useful, but
            WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
          </Text>
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>NewPipe Extractor</Text>
          <Text style={styles.legalBody}>
            Copyright © Team NewPipe and contributors, licensed GPL-3.0-or-later.
            {'\n\n'}
            Aurix uses it, unmodified, to resolve playable audio. No NewPipe source
            is included in this app, and linking it is why Aurix carries the same
            licence.
          </Text>
          <TouchableOpacity style={styles.legalLink} onPress={() => open(NEWPIPE_URL)} activeOpacity={0.7}>
            <Text style={styles.legalLinkText}>NewPipeExtractor on GitHub</Text>
            <ExternalLink color={COLORS.text.secondary} size={16} />
          </TouchableOpacity>
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
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 32 },
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
  name: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text.primary },
  nameInput: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text.primary,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.md,
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
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.accent.green,
    borderRadius: SIZES.radius.sm,
    paddingVertical: SIZES.sm,
  },
  saveBarText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.background },
  statsRow: { flexDirection: 'row', gap: SIZES.md, paddingHorizontal: SIZES.md, marginBottom: SIZES.xl },
  statTouchable: { flex: 1 },
  sectionLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    letterSpacing: 1.5,
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
  builderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xs,
    paddingBottom: SIZES.md,
  },
  builderInfo: { flex: 1 },
  builderName: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.text.primary,
  },
  builderFollow: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
    marginBottom: SIZES.sm,
  },
  builderIgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  builderIgHandle: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  infoBlock: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
    gap: SIZES.xs,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoKey: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text.secondary },
  infoValue: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text.primary },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  aboutDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.hairline },
  aboutLabel: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text.secondary },
  aboutValue: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text.primary },
  licenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.hairline,
  },
  licenceAppName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text.primary },
  licenceType: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text.muted },
  legalCard: {
    marginHorizontal: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: SIZES.xl,
  },
  legalTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text.primary, marginBottom: SIZES.sm },
  legalBody: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.text.secondary, marginBottom: SIZES.sm },
  legalLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SIZES.sm },
  legalLinkText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text.primary },
});
