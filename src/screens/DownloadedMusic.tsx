import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CloudOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function DownloadedMusicScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SIZES.xl }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft color={COLORS.text.primary} size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloaded Music</Text>
      </View>

      <View style={styles.empty}>
        <View style={styles.iconCircle}>
          <CloudOff color={COLORS.text.muted} size={32} />
        </View>
        <Text style={styles.emptyTitle}>No offline downloads</Text>
        <Text style={styles.emptySubtitle}>
          Aurix streams every track on demand and doesn't store audio on your device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, paddingBottom: SIZES.md },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text.primary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: SIZES.xxxl, paddingHorizontal: SIZES.xl, gap: SIZES.md },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: FONTS.semibold, fontSize: 17, color: COLORS.text.primary },
  emptySubtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 20 },
});
