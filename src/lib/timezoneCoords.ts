/**
 * IANA timezone → approximate city coordinates.
 *
 * Used as the only geolocation source: Intl.DateTimeFormat resolves the
 * timezone synchronously, with no permission prompt and no network. Accuracy
 * is city-level (±hundreds of km), which is fine for sunrise/sunset
 * computation — ±20 min worst case at this granularity.
 */

export const TZ_COORDS: Record<string, [number, number]> = {
  // Europe
  'Europe/Moscow': [55.75, 37.62],
  'Europe/London': [51.51, -0.13],
  'Europe/Berlin': [52.52, 13.40],
  'Europe/Paris': [48.85, 2.35],
  'Europe/Madrid': [40.42, -3.70],
  'Europe/Rome': [41.90, 12.50],
  'Europe/Amsterdam': [52.37, 4.90],
  'Europe/Brussels': [50.85, 4.35],
  'Europe/Stockholm': [59.33, 18.07],
  'Europe/Oslo': [59.91, 10.75],
  'Europe/Copenhagen': [55.68, 12.57],
  'Europe/Helsinki': [60.17, 24.94],
  'Europe/Athens': [37.98, 23.73],
  'Europe/Istanbul': [41.01, 28.98],
  'Europe/Kyiv': [50.45, 30.52],
  'Europe/Kiev': [50.45, 30.52],
  'Europe/Warsaw': [52.23, 21.01],
  'Europe/Lisbon': [38.72, -9.14],
  'Europe/Dublin': [53.35, -6.26],
  'Europe/Zurich': [47.38, 8.55],
  'Europe/Vienna': [48.21, 16.37],
  'Europe/Prague': [50.08, 14.44],
  'Europe/Bucharest': [44.43, 26.10],
  'Europe/Belgrade': [44.79, 20.45],
  'Europe/Sofia': [42.70, 23.32],
  'Europe/Minsk': [53.90, 27.57],
  'Europe/Riga': [56.95, 24.11],
  'Europe/Tallinn': [59.44, 24.75],
  'Europe/Vilnius': [54.69, 25.28],

  // Americas
  'America/New_York': [40.71, -74.01],
  'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99],
  'America/Los_Angeles': [34.05, -118.24],
  'America/Phoenix': [33.45, -112.07],
  'America/Anchorage': [61.22, -149.90],
  'America/Honolulu': [21.31, -157.86],
  'America/Toronto': [43.65, -79.38],
  'America/Vancouver': [49.28, -123.12],
  'America/Montreal': [45.50, -73.57],
  'America/Mexico_City': [19.43, -99.13],
  'America/Sao_Paulo': [-23.55, -46.63],
  'America/Argentina/Buenos_Aires': [-34.61, -58.38],
  'America/Buenos_Aires': [-34.61, -58.38],
  'America/Lima': [-12.05, -77.04],
  'America/Bogota': [4.71, -74.07],
  'America/Santiago': [-33.45, -70.67],
  'America/Caracas': [10.48, -66.90],

  // Asia
  'Asia/Tokyo': [35.68, 139.69],
  'Asia/Seoul': [37.57, 126.98],
  'Asia/Shanghai': [31.23, 121.47],
  'Asia/Hong_Kong': [22.32, 114.17],
  'Asia/Taipei': [25.03, 121.57],
  'Asia/Singapore': [1.35, 103.82],
  'Asia/Bangkok': [13.76, 100.50],
  'Asia/Kuala_Lumpur': [3.14, 101.69],
  'Asia/Jakarta': [-6.21, 106.85],
  'Asia/Manila': [14.60, 120.98],
  'Asia/Ho_Chi_Minh': [10.82, 106.63],
  'Asia/Kolkata': [22.57, 88.36],
  'Asia/Calcutta': [22.57, 88.36],
  'Asia/Karachi': [24.86, 67.01],
  'Asia/Dhaka': [23.81, 90.41],
  'Asia/Dubai': [25.20, 55.27],
  'Asia/Tehran': [35.69, 51.39],
  'Asia/Jerusalem': [31.78, 35.22],
  'Asia/Riyadh': [24.71, 46.68],
  'Asia/Baghdad': [33.32, 44.36],
  'Asia/Yerevan': [40.18, 44.51],
  'Asia/Tbilisi': [41.72, 44.78],
  'Asia/Baku': [40.41, 49.87],
  'Asia/Tashkent': [41.31, 69.27],
  'Asia/Almaty': [43.24, 76.95],
  'Asia/Yekaterinburg': [56.84, 60.61],
  'Asia/Novosibirsk': [55.04, 82.93],
  'Asia/Krasnoyarsk': [56.01, 92.85],
  'Asia/Irkutsk': [52.29, 104.30],
  'Asia/Vladivostok': [43.12, 131.89],

  // Africa
  'Africa/Cairo': [30.04, 31.24],
  'Africa/Lagos': [6.46, 3.40],
  'Africa/Nairobi': [-1.29, 36.82],
  'Africa/Johannesburg': [-26.20, 28.04],
  'Africa/Casablanca': [33.57, -7.59],
  'Africa/Algiers': [36.75, 3.06],
  'Africa/Accra': [5.60, -0.19],

  // Oceania
  'Australia/Sydney': [-33.87, 151.21],
  'Australia/Melbourne': [-37.81, 144.96],
  'Australia/Brisbane': [-27.47, 153.03],
  'Australia/Perth': [-31.95, 115.86],
  'Australia/Adelaide': [-34.93, 138.60],
  'Pacific/Auckland': [-36.85, 174.76],
  'Pacific/Fiji': [-18.14, 178.44],
};

export const FALLBACK_COORDS: [number, number] = [55.75, 37.62];
