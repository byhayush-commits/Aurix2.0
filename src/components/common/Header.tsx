import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface HeaderProps {
  title: string;
  /** Optional icon button on the right (edit pencil, bell, etc.) — pass a lucide-react-native icon element. */
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

/**
 * Large bold title header, per Aurix's Library/Profile/Home screens:
 * big white title top-left, optional single icon action top-right.
 * Sits above scrolling content — screens are responsible for their own
 * ScrollView padding-top to clear this plus the status bar.
 */
export const Header: React.FC<HeaderProps> = ({ title, rightIcon, onRightPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SIZES.md }]}>
      <Text style={styles.title}>{title}</Text>
      {rightIcon && (
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={onRightPress}
          style={styles.iconButton}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  title: {
    fontFamily: FONTS.extrabold,
    fontSize: 34,
    color: COLORS.text.primary,
    letterSpacing: -0.5,
  },
  iconButton: {
    marginTop: 6,
  },
});
