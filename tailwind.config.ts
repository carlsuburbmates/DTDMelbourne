import type { Config } from 'tailwindcss';
import designSystem from './src/design-system.json';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          offWhite: designSystem.color_palette.surface.off_white,
          richBlack: designSystem.color_palette.surface.rich_black,
        },
        primary: {
          brand: designSystem.color_palette.primary.brand,
          brandHover: designSystem.color_palette.primary.brand_hover,
          brandActive: designSystem.color_palette.primary.brand_active,
        },
        neutral: {
          slate50: designSystem.color_palette.neutral.slate_50,
          slate100: designSystem.color_palette.neutral.slate_100,
          slate200: designSystem.color_palette.neutral.slate_200,
          slate300: designSystem.color_palette.neutral.slate_300,
          slate400: designSystem.color_palette.neutral.slate_400,
          slate500: designSystem.color_palette.neutral.slate_500,
          slate600: designSystem.color_palette.neutral.slate_600,
          slate700: designSystem.color_palette.neutral.slate_700,
          slate800: designSystem.color_palette.neutral.slate_800,
          slate900: designSystem.color_palette.neutral.slate_900,
        },
        semantic: {
          success: designSystem.color_palette.semantic.success,
          successLight: designSystem.color_palette.semantic.success_light,
          error: designSystem.color_palette.semantic.error,
          errorLight: designSystem.color_palette.semantic.error_light,
          warning: designSystem.color_palette.semantic.warning,
          warningLight: designSystem.color_palette.semantic.warning_light,
          info: designSystem.color_palette.semantic.info,
          infoLight: designSystem.color_palette.semantic.info_light,
        },
      },
      fontFamily: {
        primary: designSystem.typography.font_family.primary,
        heading: designSystem.typography.font_family.heading,
        body: designSystem.typography.font_family.body,
        caption: designSystem.typography.font_family.caption,
      },
      fontSize: {
        h1: designSystem.typography.font_sizes.h1,
        h1Mobile: designSystem.typography.font_sizes.h1_mobile,
        h2: designSystem.typography.font_sizes.h2,
        h2Mobile: designSystem.typography.font_sizes.h2_mobile,
        h3: designSystem.typography.font_sizes.h3,
        h3Mobile: designSystem.typography.font_sizes.h3_mobile,
        body: designSystem.typography.font_sizes.body,
        bodySmall: designSystem.typography.font_sizes.body_small,
        caption: designSystem.typography.font_sizes.caption,
      },
      fontWeight: {
        regular: designSystem.typography.font_weights.regular,
        medium: designSystem.typography.font_weights.medium,
        semibold: designSystem.typography.font_weights.semibold,
        bold: designSystem.typography.font_weights.bold,
      },
      lineHeight: {
        tight: designSystem.typography.line_heights.tight,
        normal: designSystem.typography.line_heights.normal,
        relaxed: designSystem.typography.line_heights.relaxed,
      },
      letterSpacing: {
        headingTight: designSystem.typography.letter_spacing.heading_tight,
        normal: designSystem.typography.letter_spacing.normal,
        wide: designSystem.typography.letter_spacing.wide,
      },
      spacing: {
        xs: designSystem.spacing.tokens.xs,
        sm: designSystem.spacing.tokens.sm,
        md: designSystem.spacing.tokens.md,
        lg: designSystem.spacing.tokens.lg,
        xl: designSystem.spacing.tokens.xl,
        '2xl': designSystem.spacing.tokens['2xl'],
        '3xl': designSystem.spacing.tokens['3xl'],
      },
      sectionPadding: {
        mobile: designSystem.spacing.section_padding.mobile,
        tablet: designSystem.spacing.section_padding.tablet,
        desktop: designSystem.spacing.section_padding.desktop,
      },
      componentPadding: {
        tight: designSystem.spacing.component_padding.tight,
        normal: designSystem.spacing.component_padding.normal,
        generous: designSystem.spacing.component_padding.generous,
      },
      maxWidth: {
        mobile: designSystem.grid.max_width.mobile,
        tablet: designSystem.grid.max_width.tablet,
        desktop: designSystem.grid.max_width.desktop,
      },
      screens: {
        mobile: designSystem.grid.breakpoints.mobile,
        tablet: designSystem.grid.breakpoints.tablet,
        desktop: designSystem.grid.breakpoints.desktop,
        wide: designSystem.grid.breakpoints.wide,
      },
      borderRadius: {
        none: designSystem.border_radius.none,
        sm: designSystem.border_radius.sm,
        md: designSystem.border_radius.md,
        lg: designSystem.border_radius.lg,
        xl: designSystem.border_radius.xl,
        full: designSystem.border_radius.full,
      },
      boxShadow: {
        none: designSystem.shadows.none,
        subtle: designSystem.shadows.subtle,
        medium: designSystem.shadows.medium,
        elevated: designSystem.shadows.elevated,
        hover: designSystem.shadows.hover,
      },
      transitionDuration: {
        fast: designSystem.micro_interactions.duration.fast,
        normal: designSystem.micro_interactions.duration.normal,
        slow: designSystem.micro_interactions.duration.slow,
      },
      transitionTimingFunction: {
        easeOut: designSystem.micro_interactions.easing.ease_out,
        easeInOut: designSystem.micro_interactions.easing.ease_in_out,
        spring: designSystem.micro_interactions.easing.spring,
      },
    },
  },
  plugins: [],
};

export default config;
