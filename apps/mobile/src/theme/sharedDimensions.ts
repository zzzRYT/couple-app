/** Shared dimension layer: the values meant to move to the shared design-system package. Colors and themes stay per product (tokens.ts, useAppColor). Source: the design artifact's S19 "버튼 치수(공통)" row. */
export const sharedDimensions = {
  control: {
    sizes: { md: { height: 32, icon: 16 }, lg: { height: 36, icon: 20 } },
    paddingInline: 12,
    gap: 8,
    radius: 8,
    label: { size: 14, lineHeight: 20 },
  },
  touchTarget: 48,
} as const;
