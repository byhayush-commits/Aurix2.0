import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

interface FlowerMarkProps {
  size?: number;
}

/**
 * Minimal 5-petal flower mark. Nothing like this existed in the project
 * (checked: no .svg assets, no react-native-svg usage anywhere) so this is
 * a small original mark, not a placeholder icon or avatar.
 */
export const FlowerMark: React.FC<FlowerMarkProps> = ({ size = 52 }) => {
  const petal = (rotation: number) => (
    <Path
      key={rotation}
      d="M26 26 C26 14, 34 6, 26 2 C18 6, 26 14, 26 26 Z"
      fill={COLORS.accent.green}
      opacity={0.92}
      transform={`rotate(${rotation} 26 26)`}
    />
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      {[0, 72, 144, 216, 288].map(petal)}
      <Circle cx="26" cy="26" r="5.5" fill={COLORS.text.primary} />
    </Svg>
  );
};
