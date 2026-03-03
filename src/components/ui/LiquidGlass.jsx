/**
 * Liquid Glass Design System — Core Tokens & Primitives
 * Based on iOS 26 Liquid Glass material language
 * 
 * Glass interacts with its background: refracts color, boosts saturation,
 * specular rim highlights on edges, inner shadows that simulate thickness.
 */

// ─── LIGHT TOKENS ──────────────────────────────────────────────────────────
export const light = {
  // Page canvas
  page:           'linear-gradient(145deg, #e8edf5 0%, #dde4ef 40%, #e4dff0 100%)',
  orb1:           'radial-gradient(circle, rgba(200,210,240,0.55) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(210,200,240,0.45) 0%, transparent 70%)',

  // Card — primary glass container (heavy blur, high refraction)
  card:           'rgba(255,255,255,0.42)',
  cardBorder:     'rgba(255,255,255,0.72)',
  cardShadow:     'inset 0 1.5px 0 0 rgba(255,255,255,0.92), inset 0 -1px 1px rgba(0,0,0,0.04), 0 20px 60px rgba(100,110,160,0.08), 0 2px 8px rgba(0,0,0,0.04)',

  // Surface — secondary glass (lighter weight)
  surface:        'rgba(255,255,255,0.35)',
  surfaceBorder:  'rgba(255,255,255,0.6)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.8)',

  // Tab bar glass — heavier than card, more refraction
  tabBar:         'rgba(255,255,255,0.52)',
  tabBarBorder:   'rgba(255,255,255,0.78)',
  tabBarShadow:   'inset 0 1.5px 0 0 rgba(255,255,255,0.95), 0 -1px 40px rgba(100,110,160,0.08), 0 8px 32px rgba(0,0,0,0.06)',

  // Active tab indicator pill
  tabActive:      'rgba(255,255,255,0.72)',
  tabActiveBorder:'rgba(255,255,255,0.9)',
  tabActiveShadow:'inset 0 1.5px 0 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.06)',

  // Accessory bar (now playing, context actions)
  accessory:      'rgba(255,255,255,0.48)',
  accessoryBorder:'rgba(255,255,255,0.72)',
  accessoryShadow:'inset 0 1.5px 0 0 rgba(255,255,255,0.9), 0 4px 16px rgba(100,110,160,0.08)',

  // Primary action button
  btn:            'linear-gradient(145deg, rgba(71,85,105,0.85) 0%, rgba(51,65,85,0.9) 100%)',
  btnBorder:      'rgba(255,255,255,0.25)',
  btnShadow:      'inset 0 1.5px 0 0 rgba(255,255,255,0.2), 0 8px 24px rgba(51,65,85,0.2)',

  // States
  successBg:      'rgba(240,253,244,0.55)',
  successBorder:  'rgba(134,239,172,0.4)',
  errorBg:        'rgba(254,226,226,0.5)',
  errorBorder:    'rgba(252,165,165,0.4)',

  // Typography
  title:          '#1e293b',
  subtitle:       '#64748b',
  text:           '#334155',
  muted:          '#94a3b8',
  label:          '#94a3b8',

  // Tab text
  tabText:        '#64748b',
  tabTextActive:  '#1e293b',
};

// ─── DARK TOKENS ───────────────────────────────────────────────────────────
export const dark = {
  page:           'linear-gradient(145deg, #0c0d12 0%, #10121a 40%, #0e1018 100%)',
  orb1:           'radial-gradient(circle, rgba(56,80,140,0.3) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(80,50,120,0.25) 0%, transparent 70%)',

  card:           'rgba(255,255,255,0.055)',
  cardBorder:     'rgba(255,255,255,0.1)',
  cardShadow:     'inset 0 1.5px 0 0 rgba(255,255,255,0.07), inset 0 -1px 1px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)',

  surface:        'rgba(255,255,255,0.05)',
  surfaceBorder:  'rgba(255,255,255,0.08)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.06)',

  tabBar:         'rgba(255,255,255,0.07)',
  tabBarBorder:   'rgba(255,255,255,0.12)',
  tabBarShadow:   'inset 0 1.5px 0 0 rgba(255,255,255,0.08), 0 -1px 40px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.3)',

  tabActive:      'rgba(255,255,255,0.12)',
  tabActiveBorder:'rgba(255,255,255,0.18)',
  tabActiveShadow:'inset 0 1.5px 0 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)',

  accessory:      'rgba(255,255,255,0.06)',
  accessoryBorder:'rgba(255,255,255,0.1)',
  accessoryShadow:'inset 0 1.5px 0 0 rgba(255,255,255,0.07), 0 4px 16px rgba(0,0,0,0.25)',

  btn:            'linear-gradient(145deg, rgba(148,163,184,0.18) 0%, rgba(100,116,139,0.22) 100%)',
  btnBorder:      'rgba(255,255,255,0.1)',
  btnShadow:      'inset 0 1.5px 0 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)',

  successBg:      'rgba(20,83,45,0.2)',
  successBorder:  'rgba(74,222,128,0.2)',
  errorBg:        'rgba(127,29,29,0.2)',
  errorBorder:    'rgba(248,113,113,0.2)',

  title:          '#f1f5f9',
  subtitle:       '#94a3b8',
  text:           '#cbd5e1',
  muted:          '#475569',
  label:          '#64748b',

  tabText:        '#64748b',
  tabTextActive:  '#e2e8f0',
};

// ─── GLASS STYLE FACTORIES ─────────────────────────────────────────────────

/** Primary glass card — heavy blur, smooth contoured corners, thin border */
export const glassCard = (t) => ({
  background: t.card,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${t.cardBorder}`,
  boxShadow: t.cardShadow,
  borderRadius: 28,
});

/** Secondary glass surface — lighter blur, smooth rounded edges */
export const glassSurface = (t) => ({
  background: t.surface,
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: `1px solid ${t.surfaceBorder}`,
  boxShadow: t.surfaceShadow,
  borderRadius: 20,
});

/** Tab bar glass — heaviest blur, full capsule pill */
export const glassTabBar = (t) => ({
  background: t.tabBar,
  backdropFilter: 'blur(50px) saturate(200%)',
  WebkitBackdropFilter: 'blur(50px) saturate(200%)',
  border: `1px solid ${t.tabBarBorder}`,
  boxShadow: t.tabBarShadow,
  borderRadius: 999,
});

/** Active tab indicator capsule — full pill */
export const glassTabActive = (t) => ({
  background: t.tabActive,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${t.tabActiveBorder}`,
  boxShadow: t.tabActiveShadow,
  borderRadius: 999,
});

/** Accessory bar — smooth lozenge, thin border */
export const glassAccessory = (t) => ({
  background: t.accessory,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${t.accessoryBorder}`,
  boxShadow: t.accessoryShadow,
  borderRadius: 999,
});

/** Primary action button — full pill capsule, thin border */
export const glassBtn = (t) => ({
  background: t.btn,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${t.btnBorder}`,
  boxShadow: t.btnShadow,
  borderRadius: 999,
  color: 'white',
  fontWeight: 600,
});

/** Error state — smooth contoured corners, thin border */
export const glassError = (t) => ({
  background: t.errorBg,
  border: `1px solid ${t.errorBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3)',
  borderRadius: 24,
});

/** Success state — smooth contoured corners, thin border */
export const glassSuccess = (t) => ({
  background: t.successBg,
  border: `1px solid ${t.successBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3)',
  borderRadius: 24,
});