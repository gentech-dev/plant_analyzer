
export interface LightData {
  wattage: string;
  url: string; // Product URL
  imageUrl: string; // Product Image URL
  distances: {
    distanceCm: number;
    ppfd: number;
    lux: number;
  }[];
}

export const GENTECH_LIGHTS: LightData[] = [
  {
    wattage: '7W',
    url: 'https://www.gentech.tw/products/7w%E6%A4%8D%E7%89%A9%E7%87%88',
    imageUrl: 'https://shoplineimg.com/566528b00390552841000036/69200667507b6700129ed6a2/800x.webp?source_format=jpg',
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
    url: 'https://www.gentech.tw/products/10w%E6%A4%8D%E7%89%A9%E7%87%88',
    imageUrl: 'https://shoplineimg.com/566528b00390552841000036/6920067a2aa140000c94bbc0/800x.webp?source_format=jpg',
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
    url: 'https://www.gentech.tw/products/24w%E6%A4%8D%E7%89%A9%E7%87%88',
    imageUrl: 'https://shoplineimg.com/566528b00390552841000036/6920068b2aa140001494ba5b/800x.webp?source_format=jpg',
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
    url: 'https://www.gentech.tw/products/28w%E6%A4%8D%E7%89%A9%E7%87%88',
    imageUrl: 'https://shoplineimg.com/566528b00390552841000036/692006a034aadf00162aa093/800x.webp?source_format=jpg',
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
