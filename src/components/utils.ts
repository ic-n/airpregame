import type { QueryResult } from "bitecs";
import type { Vector3D, ComponentData } from "./types";

// Math utilities
export const randomInRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const randomPosition = (bound: number): number =>
  (Math.random() - 0.5) * bound;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const calculateDistance = (
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

export const calculateDistanceVec = (v1: Vector3D, v2: Vector3D): number =>
  calculateDistance(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

// Component utilities
export const getComponentValue = (
  component: ComponentData,
  eid: number
): Vector3D => ({
  x: component.x[eid],
  y: component.y[eid],
  z: component.z[eid],
});

export const setComponentValue = (
  component: ComponentData,
  eid: number,
  value: Vector3D
): void => {
  component.x[eid] = value.x;
  component.y[eid] = value.y;
  component.z[eid] = value.z;
};

export const addComponentValue = (
  component: ComponentData,
  eid: number,
  delta: Vector3D
): void => {
  component.x[eid] += delta.x;
  component.y[eid] += delta.y;
  component.z[eid] += delta.z;
};

// Entity selection utilities
export const selectRandomEntity = (entities: QueryResult): number =>
  entities[Math.floor(Math.random() * entities.length)];

export const filterLivingEntities = (
  entities: QueryResult,
  Health: { Value: Uint8Array },
  deadValue: number = 0
): QueryResult => entities.filter((e) => Health.Value[e] !== deadValue);

export const getRandomLivingEntity = (
  entities: QueryResult,
  Health: { Value: Uint8Array },
  deadValue: number = 0
): number => {
  const living = filterLivingEntities(entities, Health, deadValue);
  return living.length > 0 ? selectRandomEntity(living) : entities[0];
};

// Color utilities
export const colorEquals = (
  color1: number,
  color2: number,
  tolerance: number = 0.01
): boolean => {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  return (
    Math.abs(r1 - r2) / 255 < tolerance &&
    Math.abs(g1 - g2) / 255 < tolerance &&
    Math.abs(b1 - b2) / 255 < tolerance
  );
};
