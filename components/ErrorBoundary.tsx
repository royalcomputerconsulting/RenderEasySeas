import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/theme';

type ErrorBoundaryState = { hasError: boolean; errorMessage: string };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ErrorBoundary] getDerivedStateFromError', message);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[ErrorBoundary] componentDidCatch', { error, errorInfo });
  }

  handleReset = () => {
    console.log('[ErrorBoundary] Reset pressed');
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.errorMessage || 'An unexpected error occurred.'}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} testID="error-reset-button">
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.navyDeep,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeXXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.beigeWarm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
});
