
export interface LightData {
  wattage: string;
  distances: {
    distanceCm: number;
    ppfd: number;
    lux: number;
  }[];
}

export const GENTECH_LIGHTS: LightData[] = [
  {
    wattage: '7W',
    distances: [
      { distanceCm: 20, ppfd: 604, lux: 36441 },
      { distanceCm: 30, ppfd: 469, lux: 28189 },
      { distanceCm: 60, ppfd: 60, lux: 3634 },
      { distanceCm: 100, ppfd: 40, lux: 2409 },
      { distanceCm: 150, ppfd: 15, lux: 908 },
      { distanceCm: 200, ppfd: 6, lux: 369 },
    ]
  },
  {
    wattage: '10W',
    distances: [
      { distanceCm: 20, ppfd: 876, lux: 52917 },
      { distanceCm: 30, ppfd: 431, lux: 26054 },
      { distanceCm: 60, ppfd: 91, lux: 5501 },
      { distanceCm: 100, ppfd: 39, lux: 2374 },
      { distanceCm: 150, ppfd: 14, lux: 850 },
      { distanceCm: 200, ppfd: 10, lux: 618 },
    ]
  },
  {
    wattage: '24W',
    distances: [
      { distanceCm: 20, ppfd: 2266, lux: 139065 },
      { distanceCm: 30, ppfd: 1166, lux: 71494 },
      { distanceCm: 60, ppfd: 277, lux: 17003 },
      { distanceCm: 100, ppfd: 102, lux: 6240 },
      { distanceCm: 150, ppfd: 39, lux: 2338 },
      { distanceCm: 200, ppfd: 22, lux: 1325 },
    ]
  },
  {
    wattage: '28W',
    distances: [
      { distanceCm: 20, ppfd: 1154, lux: 69500 },
      { distanceCm: 30, ppfd: 421, lux: 25704 },
      { distanceCm: 60, ppfd: 124, lux: 7469 },
      { distanceCm: 100, ppfd: 43, lux: 2586 },
      { distanceCm: 150, ppfd: 19, lux: 1140 },
      { distanceCm: 200, ppfd: 12, lux: 720 },
    ]
  }
];
