import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function AyaLogo({
  size = 64,
  backgroundColor = '#FCEEF3',
}: {
  size?: number;
  backgroundColor?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8E5FBF" />
          <Stop offset="1" stopColor="#D46A9F" />
        </LinearGradient>
      </Defs>
      {/* Main crescent body */}
      <Circle cx="50" cy="50" r="38" fill="url(#moonGrad)" />
      {/* Cut-out circle, colored to match the surrounding background to carve the crescent shape */}
      <Circle cx="66" cy="36" r="33" fill={backgroundColor} />
      {/* Small sparkle accent */}
      <Circle cx="82" cy="20" r="3.2" fill="#D4B8E8" />
      <Circle cx="90" cy="32" r="1.6" fill="#D4B8E8" />
    </Svg>
  );
}
