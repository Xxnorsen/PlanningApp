// Minimal stub — placeholder screens use this until the team implements them.
import { Text, type TextProps, StyleSheet } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return <Text style={[styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { fontSize: 16, color: '#1A1A1A' },
  title:   { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle:{ fontSize: 18, fontWeight: '600', color: '#555' },
  link:    { fontSize: 16, color: '#4A4AE8', textDecorationLine: 'underline' },
});
