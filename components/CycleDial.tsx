import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { CyclePhase } from '@/lib/cycleCalculations';

interface CycleDialProps {
  size: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  dayInCycle: number; // 0-indexed, where today falls in the current cycle
  phase: CyclePhase;
  emoji: string;
}

const phaseColors: Record<CyclePhase, string> = {
  menstrual: '#D46A9F',
  follicular: '#7CB88F',
  ovulation: '#C9A227',
  luteal: '#8E5FBF',
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function CycleDial({
  size,
  avgCycleLength,
  avgPeriodLength,
  dayInCycle,
  phase,
  emoji,
}: CycleDialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const strokeWidth = 14;

  // Phase boundaries (in days-into-cycle), mirroring the logic in cycleCalculations.ts
  const ovulationDay = avgCycleLength - 14;
  const fertileStart = Math.max(ovulationDay - 5, avgPeriodLength);
  const fertileEnd = ovulationDay + 1;

  const segments: { phase: CyclePhase; from: number; to: number }[] = [
    { phase: 'menstrual', from: 0, to: avgPeriodLength },
    { phase: 'follicular', from: avgPeriodLength, to: fertileStart },
    { phase: 'ovulation', from: fertileStart, to: fertileEnd },
    { phase: 'luteal', from: fertileEnd, to: avgCycleLength },
  ];

  const markerAngle = (Math.min(dayInCycle, avgCycleLength) / avgCycleLength) * 360;
  const markerPos = polarToCartesian(cx, cy, r, markerAngle);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#F3E9F7" strokeWidth={strokeWidth} fill="none" />
        <G>
          {segments.map((seg) => {
            if (seg.to <= seg.from) return null;
            const startAngle = (seg.from / avgCycleLength) * 360;
            const endAngle = (seg.to / avgCycleLength) * 360;
            return (
              <Path
                key={seg.phase}
                d={arcPath(cx, cy, r, startAngle, endAngle - 2)}
                stroke={phaseColors[seg.phase]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                opacity={seg.phase === phase ? 1 : 0.35}
              />
            );
          })}
        </G>
        <Circle cx={markerPos.x} cy={markerPos.y} r={7} fill="#fff" stroke={phaseColors[phase]} strokeWidth={3} />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerEmoji}>{emoji}</Text>
        <Text style={styles.centerDay}>{lang_day(dayInCycle)}</Text>
      </View>
    </View>
  );
}

function lang_day(day: number) {
  return `Day ${day + 1}`;
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmoji: { fontSize: 34, marginBottom: 4 },
  centerDay: { fontSize: 12, fontWeight: '700', color: '#8B7AA8', letterSpacing: 0.5 },
});
