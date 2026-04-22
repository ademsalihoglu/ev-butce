import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { formatDate, toIsoDate } from '../utils/format';

interface Props {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
}

export function DatePickerField({ value, onChange, label = 'Tarih' }: Props) {
  if (Platform.OS === 'web') {
    return <WebDatePicker value={value} onChange={onChange} label={label} />;
  }
  return <NativeDatePicker value={value} onChange={onChange} label={label} />;
}

function WebDatePicker({ value, onChange, label }: Required<Props>) {
  const theme = useTheme();
  const inputStyle: Record<string, string | number> = {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };
  return (
    <View style={{ gap: 4 }}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {React.createElement('input', {
        type: 'date',
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: inputStyle,
      })}
    </View>
  );
}

function NativeDatePicker({ value, onChange, label }: Required<Props>) {
  const [open, setOpen] = useState(false);
  const DateTimePicker =
    require('@react-native-community/datetimepicker').default as React.ComponentType<{
      value: Date;
      mode: 'date';
      display?: 'default' | 'spinner' | 'calendar';
      onChange: (event: { type: string }, date?: Date) => void;
    }>;

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            value={formatDate(value)}
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) {
              onChange(toIsoDate(date));
            }
          }}
        />
      )}
    </>
  );
}
