import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import type { TaskPriority } from '@/types/task';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
  icon: IoniconName;
}[] = [
  { value: 'low',    label: 'Low',    color: '#2ED573', icon: 'chevron-down-circle-outline' },
  { value: 'medium', label: 'Medium', color: '#FFA502', icon: 'remove-circle-outline' },
  { value: 'high',   label: 'High',   color: '#FF4757', icon: 'chevron-up-circle-outline' },
];

interface Props {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
}

export function PriorityPicker({ value, onChange }: Props) {
  return (
    <>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {PRIORITY_OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                active && { backgroundColor: opt.color, borderColor: opt.color },
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? COLORS.WHITE_TEXT : opt.color}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: active ? COLORS.WHITE_TEXT : opt.color },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  chipText: { fontFamily: FontFamily.BOLD, fontSize: 13 },
});
