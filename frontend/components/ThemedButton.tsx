import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  lightColor?: string;
  darkColor?: string;
};

export function ThemedButton({
  title,
  variant = 'primary',
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedButtonProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === 'primary' ? 'buttonPrimary' : 
    variant === 'secondary' ? 'buttonSecondary' :
    variant === 'success' ? 'success' : 'danger'
  );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        otherProps.disabled && styles.disabled,
        style,
      ]}
      {...otherProps}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
