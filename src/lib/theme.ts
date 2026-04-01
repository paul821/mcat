// Chicago sunset/sunrise calculator using NOAA solar equations
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
  // Julian day calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Day of year
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) dayOfYear += daysInMonth[i];

  // NOAA solar equations
  // Fractional year (gamma) in radians
  const gamma = (2 * Math.PI / (isLeap ? 366 : 365)) * (dayOfYear - 1);

  // Equation of time (minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.04089 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Hour angle for sunrise/sunset (zenith = 90.833 degrees)
  const zenith = toRadians(90.833);
  const latRad = toRadians(CHICAGO_LAT);

  const cosHA =
    (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl))) -
    Math.tan(latRad) * Math.tan(decl);

  // Clamp to [-1, 1] for polar edge cases
  const clampedCosHA = Math.max(-1, Math.min(1, cosHA));
  const ha = toDegrees(Math.acos(clampedCosHA)); // in degrees

  // Sunrise and sunset in minutes from midnight UTC
  const sunriseUTCMin = 720 - 4 * (CHICAGO_LNG + ha) - eqTime;
  const sunsetUTCMin = 720 - 4 * (CHICAGO_LNG - ha) - eqTime;

  // Convert to Chicago local time
  const isDST = isChicagoDST(date);
  const offsetMinutes = isDST ? -300 : -360; // CDT = -5h, CST = -6h

  const sunriseLocalMin = sunriseUTCMin + offsetMinutes;
  const sunsetLocalMin = sunsetUTCMin + offsetMinutes;

  // Normalize to 0-1440 range
  const normSunrise = ((sunriseLocalMin % 1440) + 1440) % 1440;
  const normSunset = ((sunsetLocalMin % 1440) + 1440) % 1440;

  const sunrise = new Date(date);
  sunrise.setHours(0, 0, 0, 0);
  sunrise.setMinutes(Math.round(normSunrise));

  const sunset = new Date(date);
  sunset.setHours(0, 0, 0, 0);
  sunset.setMinutes(Math.round(normSunset));

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
  const chicagoStr = now.toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });
  const chicagoNow = new Date(chicagoStr);

  const { sunrise, sunset } = getSunTimes(chicagoNow);

  if (chicagoNow >= sunrise && chicagoNow < sunset) {
    return "light";
  }
  return "dark";
}
