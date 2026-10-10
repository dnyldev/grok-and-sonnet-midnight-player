export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.55,
} as const;

export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 34,
  mass: 0.6,
} as const;

export const SPRING_SHEET = {
  type: "spring",
  stiffness: 380,
  damping: 38,
  mass: 0.8,
} as const;

export const SPRING_GLIDE = {
  stiffness: 700,
  damping: 50,
  mass: 0.5,
} as const;
