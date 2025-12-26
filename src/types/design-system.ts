import designSystem from '../design-system.json';

// Color Palette Types
export type SurfaceColor = typeof designSystem.color_palette.surface;
export type PrimaryColor = typeof designSystem.color_palette.primary;
export type NeutralColor = typeof designSystem.color_palette.neutral;
export type SemanticColor = typeof designSystem.color_palette.semantic;

// Typography Types
export type FontFamily = typeof designSystem.typography.font_family;
export type FontSize = typeof designSystem.typography.font_sizes;
export type FontWeight = typeof designSystem.typography.font_weights;
export type LineHeight = typeof designSystem.typography.line_heights;
export type LetterSpacing = typeof designSystem.typography.letter_spacing;

// Spacing Types
export type SpacingToken = typeof designSystem.spacing.tokens;
export type SectionPadding = typeof designSystem.spacing.section_padding;
export type ComponentPadding = typeof designSystem.spacing.component_padding;

// Grid Types
export type MaxWidth = typeof designSystem.grid.max_width;
export type Breakpoint = typeof designSystem.grid.breakpoints;

// Border Radius Types
export type BorderRadius = typeof designSystem.border_radius;

// Shadow Types
export type Shadow = typeof designSystem.shadows;

// Micro-interaction Types
export type TransitionDuration = typeof designSystem.micro_interactions.duration;
export type TransitionTimingFunction = typeof designSystem.micro_interactions.easing;

// Component Variant Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tertiary';
export type ButtonState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

export type InputVariant = 'underline' | 'filled';
export type InputState = 'default' | 'focus' | 'error';

export type BadgeVariant = 'featured' | 'verified' | 'new';

export type CardState = 'default' | 'hover';

// Responsive Types
export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

// Accessibility Types
export type FocusRingStyle = {
  width: string;
  offset: string;
  color: string;
  radius: string;
};

export type SkipLinkStyle = {
  background: string;
  color: string;
  padding: string;
  borderRadius: string;
};

// Design System Interface
export interface DesignSystem {
  name: string;
  version: string;
  description: string;
  principles: {
    mobile_first: string;
    one_primary_action: string;
    spacing_is_trust: string;
    motion_is_meaning: string;
    no_vibes: string;
  };
  color_palette: {
    surface: SurfaceColor;
    primary: PrimaryColor;
    neutral: NeutralColor;
    semantic: SemanticColor;
  };
  typography: {
    font_family: FontFamily;
    font_sizes: FontSize;
    font_weights: FontWeight;
    line_heights: LineHeight;
    letter_spacing: LetterSpacing;
  };
  spacing: {
    scale: number[];
    tokens: SpacingToken;
    section_padding: SectionPadding;
    component_padding: ComponentPadding;
  };
  grid: {
    columns: number;
    gutter: string;
    max_width: MaxWidth;
    breakpoints: Breakpoint;
  };
  border_radius: BorderRadius;
  shadows: Shadow;
  components: {
    button: {
      height: string;
      padding_horizontal: string;
      border_radius: string;
      font_weight: string;
      font_size: string;
      transition: string;
      variants: {
        primary: {
          background: string;
          color: string;
          hover: {
            background: string;
            transform: string;
          };
          active: {
            background: string;
            transform: string;
          };
          disabled: {
            background: string;
            opacity: string;
          };
        };
        secondary: {
          background: string;
          color: string;
          border: string;
          hover: {
            background: string;
            transform: string;
          };
          active: {
            background: string;
            transform: string;
          };
        };
        ghost: {
          background: string;
          color: string;
          hover: {
            background: string;
            color: string;
          };
          active: {
            background: string;
            color: string;
          };
        };
        tertiary: {
          background: string;
          color: string;
          text_decoration: string;
          hover: {
            color: string;
          };
        };
      };
    };
    card: {
      background: string;
      border: string;
      border_radius: string;
      padding: string;
      shadow: string;
      hover: {
        shadow: string;
        transform: string;
      };
    };
    input: {
      height: string;
      padding_horizontal: string;
      border_radius: string;
      font_size: string;
      variants: {
        underline: {
          background: string;
          border: string;
          border_bottom: string;
          focus: {
            border_bottom: string;
          };
        };
        filled: {
          background: string;
          border: string;
          focus: {
            background: string;
            border: string;
            box_shadow: string;
          };
        };
      };
    };
    badge: {
      padding_horizontal: string;
      padding_vertical: string;
      border_radius: string;
      font_size: string;
      font_weight: string;
      variants: {
        featured: {
          background: string;
          color: string;
        };
        verified: {
          background: string;
          color: string;
        };
        new: {
          background: string;
          color: string;
        };
      };
    };
    rating: {
      star_size: string;
      star_color: string;
      star_empty: string;
      star_half: string;
    };
  };
  micro_interactions: {
    duration: TransitionDuration;
    easing: TransitionTimingFunction;
    hover: {
      button: {
        transform: string;
        shadow: string;
      };
      card: {
        transform: string;
        shadow: string;
      };
    };
    click: {
      button: {
        transform: string;
      };
    };
  };
  accessibility: {
    focus_ring: FocusRingStyle;
    skip_links: SkipLinkStyle;
    contrast_ratios: {
      aa: string;
      aaa: string;
    };
  };
  responsive: {
    mobile_first: boolean;
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
    navigation: {
      mobile: {
        type: string;
        position: string;
      };
      desktop: {
        type: string;
        position: string;
      };
    };
  };
  empty_states: {
    search: {
      icon: string;
      title: string;
      message: string;
      action: string;
    };
    reviews: {
      icon: string;
      title: string;
      message: string;
      action: string;
    };
    queue: {
      icon: string;
      title: string;
      message: string;
      action: string;
    };
  };
  loading_states: {
    skeleton: {
      background: string;
      border_radius: string;
      animation: string;
    };
    spinner: {
      size: string;
      border_width: string;
      color: string;
    };
  };
  visual_hierarchy: {
    featured_badge: {
      position: string;
      background: string;
      color: string;
      text: string;
    };
    verified_checkmark: {
      icon: string;
      background: string;
      color: string;
      border_radius: string;
    };
    rating_stars: {
      display: string;
      spacing: string;
    };
  };
  forms: {
    validation: {
      error: {
        color: string;
        background: string;
        border_radius: string;
        padding: string;
      };
      success: {
        color: string;
        background: string;
        border_radius: string;
        padding: string;
      };
    };
    labels: {
      required: {
        indicator: string;
        color: string;
      };
    };
  };
  error_pages: {
    '404': {
      title: string;
      message: string;
      action: string;
    };
    '500': {
      title: string;
      message: string;
      action: string;
    };
    '429': {
      title: string;
      message: string;
      action: string;
    };
  };
  dark_mode: {
    enabled: boolean;
    color_palette: {
      surface: {
        off_white: string;
        rich_black: string;
      };
      primary: {
        brand: string;
        brand_hover: string;
        brand_active: string;
      };
    };
}

// Export design system instance
export const ds: DesignSystem = designSystem as DesignSystem;
