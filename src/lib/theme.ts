// Chicago sunset/sunrise calculator using solar position algorithm
// Coordinates: 41.8781°N, 87.6298°W

const CHICAGO_LAT = 41.8781;
const CHICAGO_LNG = -87.6298;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number) {
  return (rad * 180) / Math.PI;
}

function getSunTimes(date: Date): { sunrise: Date; sunset: Date } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Day of year
  const n1 = Math.floor(275 * month / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const dayOfYear = n1 - n2 * n3 + day - 30;

  // Convert longitude to hour value
  const lngHour = CHICAGO_LNG / 15;

  // Sunrise and sunset approximate times
  const tRise = dayOfYear + (6 - lngHour) / 24;
  const tSet = dayOfYear + (18 - lngHour) / 24;

  function calcSunTime(t: number): number {
    // Sun's mean anomaly
    const M = 0.9856 * t - 3.289;

    // Sun's true longitude
    let L =
      M +
      1.916 * Math.sin(toRadians(M)) +
      0.02 * Math.sin(toRadians(2 * M)) +
      282.634;
    L = ((L % 360) + 360) % 360;

    // Sun's right ascension
    let RA = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(L))));
    RA = ((RA % 360) + 360) % 360;

    // Adjust RA to same quadrant as L
    const lQuadrant = Math.floor(L / 90) * 90;
    const raQuadrant = Math.floor(RA / 90) * 90;
    RA += lQuadrant - raQuadrant;
    RA /= 15;

    // Sun's declination
    const sinDec = 0.39782 * Math.sin(toRadians(L));
    const cosDec = Math.cos(Math.asin(sinDec));

    // Sun's local hour angle (zenith = 90.833 for official sunrise/sunset)
    const cosH =
      (Math.cos(toRadians(90.833)) - sinDec * Math.sin(toRadians(CHICAGO_LAT))) /
      (cosDec * Math.cos(toRadians(CHICAGO_LAT)));

    return { cosH, RA, lngHour, t } as unknown as number;
  }

  // Calculate sunrise
  const riseCalc = calcSunTime(tRise) as unknown as {
    cosH: number;
    RA: number;
    lngHour: number;
    t: number;
  };
  const hRise = 360 - toDegrees(Math.acos(riseCalc.cosH));
  const hRiseHours = hRise / 15;
  let utRise = hRiseHours + riseCalc.RA - 0.06571 * riseCalc.t - 6.622;
  utRise = ((utRise % 24) + 24) % 24;

  // Calculate sunset
  const setCalc = calcSunTime(tSet) as unknown as {
    cosH: number;
    RA: number;
    lngHour: number;
    t: number;
  };
  const hSet = toDegrees(Math.acos(setCalc.cosH));
  const hSetHours = hSet / 15;
  let utSet = hSetHours + setCalc.RA - 0.06571 * setCalc.t - 6.622;
  utSet = ((utSet % 24) + 24) % 24;

  // Convert to Chicago time (UTC-6 standard, UTC-5 daylight)
  const isDST = isChicagoDST(date);
  const offset = isDST ? -5 : -6;

  const sunriseChicago = ((utRise + offset) % 24 + 24) % 24;
  const sunsetChicago = ((utSet + offset) % 24 + 24) % 24;

  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseChicago), Math.round((sunriseChicago % 1) * 60), 0, 0);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetChicago), Math.round((sunsetChicago % 1) * 60), 0, 0);

  return { sunrise, sunset };
}

function isChicagoDST(date: Date): boolean {
  // US DST: 2nd Sunday of March to 1st Sunday of November
  const year = date.getFullYear();
  const marchSecondSunday = new Date(year, 2, 1);
  marchSecondSunday.setDate(1 + ((7 - marchSecondSunday.getDay()) % 7) + 7);

  const novFirstSunday = new Date(year, 10, 1);
  novFirstSunday.setDate(1 + ((7 - novFirstSunday.getDay()) % 7));

  return date >= marchSecondSunday && date < novFirstSunday;
}

export function getThemeForNow(): "light" | "dark" {
  // Get current time in Chicago
  const now = new Date();
  const chicagoStr = now.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const chicagoNow = new Date(chicagoStr);

  const { sunrise, sunset } = getSunTimes(chicagoNow);

  if (chicagoNow >= sunrise && chicagoNow < sunset) {
    return "light";
  }
  return "dark";
}
