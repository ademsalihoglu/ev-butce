import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { formatCurrency } from '../utils/format';

export interface PieSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: PieSlice[];
  size?: number;
  innerRadius?: number;
  centerLabel?: string;
  centerValue?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, rOuter, endAngle);
  const end = polarToCartesian(cx, cy, rOuter, startAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, startAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${start.x} ${start.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

export function PieChart({ data, size = 220, innerRadius, centerLabel, centerValue }: Props) {
  const theme = useTheme();
  const total = data.reduce((sum, s) => sum + s.value, 0);
  const rOuter = size / 2;
  const rInner = innerRadius ?? rOuter * 0.6;
  const cx = rOuter;
  const cy = rOuter;

  if (total <= 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={rOuter - 1} fill={theme.colors.surfaceVariant} />
          <Circle cx={cx} cy={cy} r={rInner} fill={theme.colors.surface} />
        </Svg>
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Veri yok
          </Text>
        </View>
      </View>
    );
  }

  let current = 0;
  const slices = data.map((slice) => {
    const start = (current / total) * 360;
    current += slice.value;
    const end = (current / total) * 360;
    return { ...slice, start, end };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s) => {
            if (s.end - s.start >= 359.999) {
              return (
                <G key={s.key}>
                  <Circle cx={cx} cy={cy} r={rOuter} fill={s.color} />
                  <Circle cx={cx} cy={cy} r={rInner} fill={theme.colors.surface} />
                </G>
              );
            }
            return (
              <Path
                key={s.key}
                d={describeArc(cx, cy, rOuter, rInner, s.start, s.end)}
                fill={s.color}
              />
            );
          })}
        </G>
      </Svg>
      {(centerLabel || centerValue) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerLabel && (
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {centerLabel}
            </Text>
          )}
          {centerValue && (
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              {centerValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export function PieLegend({ data }: { data: PieSlice[] }) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  return (
    <View style={{ gap: 8, width: '100%' }}>
      {data.map((slice) => {
        const pct = total > 0 ? (slice.value / total) * 100 : 0;
        return (
          <View
            key={slice.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: slice.color,
                }}
              />
              <Text numberOfLines={1}>{slice.label}</Text>
            </View>
            <Text style={{ fontVariant: ['tabular-nums'] }}>
              {formatCurrency(slice.value)} · %{pct.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
