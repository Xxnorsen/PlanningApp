import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',
  // Tabs
  'checklist': 'checklist',
  'calendar': 'calendar-today',
  'chart.bar.fill': 'bar-chart',
  // General
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'plus': 'add',
  'xmark': 'close',
  'trash': 'delete',
  'pencil': 'edit',
  'person.fill': 'person',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] ?? 'help-outline'}
      style={style}
    />
  );
}
