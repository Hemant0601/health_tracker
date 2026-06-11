import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Polyline,
  Stop,
} from 'react-native-svg';

import { colors } from '../theme';
import { fmtNum } from '../utils/format';

export interface ChartSeries {
  label: string;
  color: string;
  /** Values ordered oldest → newest. */
  points: number[];
}

interface Props {
  series: ChartSeries[];
  startLabel?: string;
  endLabel?: string;
  height?: number;
}

const PAD_TOP = 10;
const PAD_BOTTOM = 10;

export function TrendChart({ series, startLabel, endLabel, height = 150 }: Props) {
  const [width, setWidth] = useState(0);

  const visible = series.filter((s) => s.points.length > 0);
  if (visible.length === 0) return null;

  const all = visible.flatMap((s) => s.points);
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const pad = (max - min) * 0.12;
    min -= pad;
    max += pad;
  }
  const mid = (min + max) / 2;

  const plotHeight = height - PAD_TOP - PAD_BOTTOM;
  const maxPoints = Math.max(...visible.map((s) => s.points.length));

  const xAt = (i: number, count: number): number => {
    if (count <= 1) return width / 2;
    return (i / (count - 1)) * width;
  };
  const yAt = (v: number): number =>
    PAD_TOP + (1 - (v - min) / (max - min)) * plotHeight;

  const gridYs = [PAD_TOP, PAD_TOP + plotHeight / 2, PAD_TOP + plotHeight];

  return (
    <View>
      <View style={styles.chartRow}>
        <View style={[styles.yLabels, { height }]}>
          <Text style={styles.yLabel}>{fmtNum(Math.round(max * 10) / 10)}</Text>
          <Text style={styles.yLabel}>{fmtNum(Math.round(mid * 10) / 10)}</Text>
          <Text style={styles.yLabel}>{fmtNum(Math.round(min * 10) / 10)}</Text>
        </View>
        <View
          style={styles.svgWrap}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {width > 0 ? (
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={visible[0].color}
                    stopOpacity="0.18"
                  />
                  <Stop
                    offset="1"
                    stopColor={visible[0].color}
                    stopOpacity="0.01"
                  />
                </LinearGradient>
              </Defs>
              {gridYs.map((gy) => (
                <Line
                  key={gy}
                  x1={0}
                  y1={gy}
                  x2={width}
                  y2={gy}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4 6"
                />
              ))}
              {visible.map((s, si) => {
                const pts = s.points.map(
                  (v, i) => [xAt(i, s.points.length), yAt(v)] as const
                );
                const polyPoints = pts.map(([x, y]) => `${x},${y}`).join(' ');
                const showFill = visible.length === 1 && pts.length > 1;
                const fillPath = showFill
                  ? `M ${pts[0][0]} ${pts[0][1]} ` +
                    pts
                      .slice(1)
                      .map(([x, y]) => `L ${x} ${y}`)
                      .join(' ') +
                    ` L ${pts[pts.length - 1][0]} ${height - PAD_BOTTOM}` +
                    ` L ${pts[0][0]} ${height - PAD_BOTTOM} Z`
                  : null;
                return (
                  <React.Fragment key={s.label}>
                    {fillPath ? <Path d={fillPath} fill="url(#fill)" /> : null}
                    {pts.length > 1 ? (
                      <Polyline
                        points={polyPoints}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : null}
                    {maxPoints <= 40
                      ? pts.map(([x, y], i) => (
                          <Circle
                            key={`${si}-${i}`}
                            cx={x}
                            cy={y}
                            r={3.5}
                            fill={s.color}
                            stroke={colors.card}
                            strokeWidth={1.5}
                          />
                        ))
                      : null}
                  </React.Fragment>
                );
              })}
            </Svg>
          ) : null}
        </View>
      </View>
      {(startLabel || endLabel) && (
        <View style={styles.xLabels}>
          <Text style={styles.xLabel}>{startLabel ?? ''}</Text>
          <Text style={styles.xLabel}>{endLabel ?? ''}</Text>
        </View>
      )}
      {visible.length > 1 ? (
        <View style={styles.legend}>
          {visible.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yLabels: {
    justifyContent: 'space-between',
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'flex-end',
  },
  yLabel: {
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '600',
  },
  svgWrap: {
    flex: 1,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginLeft: 38,
  },
  xLabel: {
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    marginLeft: 38,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
