import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KnightArenaTheme } from '../../theme/tokens';

interface ClockViewProps {
  remainingMs: number;
  isActive: boolean;
  label?: string;
  isLowTimeWarning?: boolean;
}

export const ClockView: React.FC<ClockViewProps> = React.memo(
  ({ remainingMs, isActive, label, isLowTimeWarning }) => {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((Math.max(0, remainingMs) % 1000) / 100);

    // Show tenths of second if less than 20 seconds remaining
    const isCritical = totalSeconds < 20;

    const formattedTime = isCritical
      ? `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
      <View
        style={[
          styles.container,
          isActive && styles.activeContainer,
          isLowTimeWarning && styles.warningContainer,
        ]}
      >
        {label && <Text style={styles.label}>{label}</Text>}
        <Text
          style={[
            styles.timeText,
            isActive && styles.activeTimeText,
            isLowTimeWarning && styles.warningText,
          ]}
        >
          {formattedTime}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: KnightArenaTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: KnightArenaTheme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  activeContainer: {
    backgroundColor: KnightArenaTheme.colors.surfaceDark,
    borderColor: KnightArenaTheme.colors.brandPrimary,
    shadowColor: KnightArenaTheme.colors.brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  warningContainer: {
    borderColor: KnightArenaTheme.colors.statusDanger,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: KnightArenaTheme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  timeText: {
    fontFamily: KnightArenaTheme.typography.mono.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: KnightArenaTheme.colors.textSecondary,
  },
  activeTimeText: {
    color: KnightArenaTheme.colors.brandPrimary,
  },
  warningText: {
    color: KnightArenaTheme.colors.statusDanger,
  },
});
