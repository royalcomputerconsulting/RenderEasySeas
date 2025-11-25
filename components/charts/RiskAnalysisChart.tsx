import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Minus, 
  Lightbulb,
  Activity,
  TrendingUp,
  TrendingDown 
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { RiskAnalysis } from '@/lib/whatIfSimulator';

interface RiskAnalysisChartProps {
  riskAnalysis: RiskAnalysis;
  title?: string;
}

const getRiskColor = (risk: 'low' | 'medium' | 'high'): string => {
  switch (risk) {
    case 'low':
      return COLORS.success;
    case 'medium':
      return COLORS.warning;
    case 'high':
      return COLORS.error;
  }
};

const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'low':
      return CheckCircle;
    case 'medium':
      return AlertTriangle;
    case 'high':
      return XCircle;
  }
};

const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
  switch (impact) {
    case 'positive':
      return TrendingUp;
    case 'negative':
      return TrendingDown;
    case 'neutral':
      return Minus;
  }
};

const getImpactColor = (impact: 'positive' | 'negative' | 'neutral'): string => {
  switch (impact) {
    case 'positive':
      return COLORS.success;
    case 'negative':
      return COLORS.error;
    case 'neutral':
      return COLORS.textSecondary;
  }
};

export function RiskAnalysisChart({
  riskAnalysis,
  title = 'Risk Analysis',
}: RiskAnalysisChartProps) {
  const riskColor = useMemo(() => getRiskColor(riskAnalysis.overallRisk), [riskAnalysis.overallRisk]);
  const RiskIcon = useMemo(() => getRiskIcon(riskAnalysis.overallRisk), [riskAnalysis.overallRisk]);

  const gaugeAngle = useMemo(() => {
    return (riskAnalysis.riskScore / 100) * 180 - 90;
  }, [riskAnalysis.riskScore]);

  const sortedFactors = useMemo(() => {
    return [...riskAnalysis.factors].sort((a, b) => b.weight - a.weight);
  }, [riskAnalysis.factors]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${riskColor}20`, `${riskColor}08`]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${riskColor}30` }]}>
              <Shield size={18} color={riskColor} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: `${riskColor}25` }]}>
            <RiskIcon size={14} color={riskColor} />
            <Text style={[styles.riskLabel, { color: riskColor }]}>
              {riskAnalysis.overallRisk.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        <View style={styles.gaugeSection}>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeBackground}>
              <View style={[styles.gaugeSegment, styles.segmentLow]} />
              <View style={[styles.gaugeSegment, styles.segmentMedium]} />
              <View style={[styles.gaugeSegment, styles.segmentHigh]} />
            </View>
            <View
              style={[
                styles.gaugeNeedle,
                { transform: [{ rotate: `${gaugeAngle}deg` }] },
              ]}
            />
            <View style={styles.gaugeCenter}>
              <Text style={[styles.scoreValue, { color: riskColor }]}>
                {riskAnalysis.riskScore}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
          <View style={styles.gaugeLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Low (0-35)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Medium (35-65)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.legendText}>High (65-100)</Text>
            </View>
          </View>
        </View>

        <View style={styles.factorsSection}>
          <View style={styles.sectionHeader}>
            <Activity size={14} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Risk Factors</Text>
          </View>
          <View style={styles.factorsList}>
            {sortedFactors.map((factor, index) => {
              const ImpactIcon = getImpactIcon(factor.impact);
              const impactColor = getImpactColor(factor.impact);
              
              return (
                <View key={index} style={styles.factorItem}>
                  <View style={styles.factorHeader}>
                    <View style={[styles.impactIcon, { backgroundColor: `${impactColor}20` }]}>
                      <ImpactIcon size={12} color={impactColor} />
                    </View>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <View style={styles.factorWeight}>
                      <Text style={[styles.weightText, { color: impactColor }]}>
                        {factor.impact === 'negative' ? '-' : factor.impact === 'positive' ? '+' : ''}
                        {factor.weight}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>Confidence Interval</Text>
          <View style={styles.confidenceBar}>
            <View style={styles.confidenceTrack}>
              <View
                style={[
                  styles.confidenceRange,
                  {
                    left: `${Math.max(0, riskAnalysis.confidenceInterval.low)}%`,
                    width: `${Math.min(100, riskAnalysis.confidenceInterval.high - Math.max(0, riskAnalysis.confidenceInterval.low))}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.confidenceLabels}>
              <Text style={styles.confidenceValue}>
                {riskAnalysis.confidenceInterval.low.toFixed(1)}%
              </Text>
              <Text style={styles.confidenceValue}>
                {riskAnalysis.confidenceInterval.high.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {riskAnalysis.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={14} color={COLORS.beigeWarm} />
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            <View style={styles.recommendationsList}>
              {riskAnalysis.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet} />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.volatilityRow}>
          <Text style={styles.volatilityLabel}>Volatility Index:</Text>
          <View style={styles.volatilityBar}>
            <View
              style={[
                styles.volatilityFill,
                { 
                  width: `${Math.min(100, riskAnalysis.volatility * 100)}%`,
                  backgroundColor: riskAnalysis.volatility > 0.5 ? COLORS.warning : COLORS.aquaAccent,
                },
              ]}
            />
          </View>
          <Text style={styles.volatilityValue}>
            {(riskAnalysis.volatility * 100).toFixed(0)}%
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  riskLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    letterSpacing: 0.5,
  },
  gaugeSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  gaugeContainer: {
    width: 140,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gaugeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    overflow: 'hidden',
  },
  gaugeSegment: {
    flex: 1,
    height: '100%',
  },
  segmentLow: {
    backgroundColor: COLORS.success,
    opacity: 0.3,
  },
  segmentMedium: {
    backgroundColor: COLORS.warning,
    opacity: 0.3,
  },
  segmentHigh: {
    backgroundColor: COLORS.error,
    opacity: 0.3,
  },
  gaugeNeedle: {
    position: 'absolute',
    bottom: 10,
    width: 4,
    height: 50,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 2,
    transformOrigin: 'bottom center',
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.fontSizeXXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  gaugeLegend: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  factorsSection: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textSecondary,
  },
  factorsList: {
    gap: SPACING.sm,
  },
  factorItem: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  impactIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  factorWeight: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  weightText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  factorDescription: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginLeft: 28,
  },
  confidenceSection: {
    marginBottom: SPACING.md,
  },
  confidenceLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confidenceBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  confidenceTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.aquaAccent,
    borderRadius: 4,
  },
  confidenceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  confidenceValue: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  recommendationsSection: {
    marginBottom: SPACING.md,
  },
  recommendationsList: {
    gap: SPACING.xs,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.beigeWarm,
    marginTop: 5,
  },
  recommendationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  volatilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  volatilityLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  volatilityBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  volatilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  volatilityValue: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    width: 35,
    textAlign: 'right',
  },
});
