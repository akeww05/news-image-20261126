// render.mjs — deterministic front-page renderer, Node stdlib only.
// Draws "THE WORLD IN ONE DAY" for Thursday 26 November 2026 as a
// 1024x1024 PNG using a hand-drawn 5x7 bitmap font. No network, no
// downloaded assets, no dependencies. Run: node render.mjs
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 1024;
const H = 1024;
const PAPER = [253, 253, 248];
const INK = [18, 18, 18];
const GREY = [96, 96, 96];

// Hand-drawn 5x7 bitmap font. Each glyph is 7 rows of 5 cells,
// "#" = ink, "." = blank. Written fresh for this page.
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["00000", "00000", "01110", "10001", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  g: ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  k: ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "00000", "11110", "10001", "10001", "11110", "10000", "10000"],
  q: ["00000", "00000", "01111", "10001", "10001", "01111", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["01000", "01000", "11110", "01000", "01000", "01000", "00100"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
};

// Lowercase p has an 8-row glyph above; trim it to 7 rows like the rest.
FONT.p = ["00000", "00000", "11110", "10001", "10001", "11110", "10000"];

// Canvas: RGB buffer, paper background.
const buf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function setPx(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}

function fillRect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPx(i, j, c);
  }
}

function hline(x0, x1, y, c, thick = 1) {
  for (let t = 0; t < thick; t++) {
    for (let x = x0; x <= x1; x++) setPx(x, y + t, c);
  }
}

function drawGlyph(ch, x, y, s, c) {
  const g = FONT[ch] || FONT["?"];
  for (let r = 0; r < 7; r++) {
    const row = g[r] || "00000";
    for (let col = 0; col < 5; col++) {
      if (row[col] === "1") {
        for (let dy = 0; dy < s; dy++) {
          for (let dx = 0; dx < s; dx++) {
            setPx(x + col * s + dx, y + r * s + dy, c);
          }
        }
      }
    }
  }
}

function textWidth(str, s) {
  return str.length * 6 * s;
}

function drawText(str, x, y, s, c) {
  let cx = x;
  for (const ch of str) {
    drawGlyph(ch, cx, y, s, c);
    cx += 6 * s;
  }
  return cx;
}

// Greedy word wrap; never throws, never truncates mid-word silently:
// a word longer than the line is hard-split so layout always fits.
function wrap(str, maxW, s) {
  const lines = [];
  const words = str.split(" ");
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textWidth(test, s) <= maxW) {
      cur = test;
    } else {
      if (cur !== "") lines.push(cur);
      if (textWidth(w, s) > maxW) {
        let rest = w;
        const per = Math.max(1, Math.floor(maxW / (6 * s)));
        while (textWidth(rest, s) > maxW) {
          lines.push(rest.slice(0, per));
          rest = rest.slice(per);
        }
        cur = rest;
      } else {
        cur = w;
      }
    }
  }
  if (cur !== "") lines.push(cur);
  return lines.length === 0 ? [""] : lines;
}

// Confidence mark: filled (confirmed), half-filled (reported claim),
// ring (late 25 Nov, dominating 26 Nov coverage).
function drawMark(cx, cy, kind, r = 4) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (kind === "F") {
        if (d <= r) setPx(cx + dx, cy + dy, INK);
      } else if (kind === "H") {
        if (d <= r && dx <= 0) setPx(cx + dx, cy + dy, INK);
        else if (d >= r - 1 && d <= r) setPx(cx + dx, cy + dy, INK);
      } else {
        if (d >= r - 1 && d <= r) setPx(cx + dx, cy + dy, INK);
      }
    }
  }
}

// --- PNG encoding (deterministic: fixed filter 0, zlib level 9) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- The slate: 50 stories, Thursday 26 November 2026 ---
// c: F = confirmed, H = reported claim, O = late 25 Nov, lead story 26 Nov.
const LEAD = [
  { n: 1, h: "US PROPOSES TARIFFS UP TO 35% ON 14 ECONOMIES", s: "Section 301 action hits Taiwan at 15%, the lowest tier with Japan, Korea, the EU and Switzerland.", src: "USTR / Reuters", c: "F" },
  { n: 2, h: "HOUTHIS CLAIM STRIKE ON SAUDI REFINERY; BRENT TOPS $94", s: "Rebels say they hit Ras Tanura and Riyadh's financial district; Brent crude $94.81, US crude $84.24.", src: "Reuters", c: "H" },
  { n: 3, h: "UKRAINE SAYS IT STRUCK SAVASLEYKA AIR BASE, HIT 5 PLANES", s: "Kyiv says three MiG-31s and two Su-34s were damaged in the strike on the Russian base.", src: "Ukraine General Staff", c: "H" },
  { n: 4, h: "CAIRO TANKER FIRE KILLS AT LEAST 31 ON RING ROAD", s: "A fuel tanker crash sparked a huge fire; 21 more were injured, Egypt's health ministry said.", src: "BBC", c: "O" },
];

const SECTIONS = [
  { title: "WAR & DIPLOMACY", stories: [
    { n: 5, h: "KIM CALLS FOR WIDER TACTICAL NUCLEAR DEPLOYMENT", s: "North Korea urges a broader rollout of tactical nuclear arms.", src: "Reuters", c: "F" },
    { n: 6, h: "DOZENS OF STATES URGE RUSSIA TO HALT RIOT AGENT USE", s: "Countries call on Moscow to stop alleged chemical use in Ukraine.", src: "Reuters", c: "F" },
    { n: 7, h: "MURMANSK GOVERNOR HELD IN CORRUPTION PROBE", s: "Regional chief placed in pre-trial detention for two months.", src: "Reuters", c: "F" },
    { n: 8, h: "ISRAEL KILLS TWO HAMAS SECURITY CHIEFS IN A DAY", s: "Naeem Abu Nahel and Mohammed Abu al-Ouf die within 24 hours.", src: "Times of Israel", c: "F" },
    { n: 9, h: "THREE KILLED IN ISRAELI DRONE STRIKE ON SHATI CAMP", s: "Strike hits Gaza's Shati camp at 01:35 UTC, local media report.", src: "Middle East Eye", c: "H" },
    { n: 10, h: "LIBYA VOWS REVENGE AFTER DRONE HIT ON WARSHIP", s: "Ukrainian strike on a Russian warship in Benghazi killed two officers.", src: "Reuters", c: "F" },
    { n: 11, h: "ZELENSKYY CONFIRMS UKRAINE SANK SHIP IN LIBYA", s: "Kyiv says the war is spreading beyond Europe's borders.", src: "Reuters", c: "F" },
    { n: 12, h: "RUSSIA WARNS ESTONIA NEAR 'OPEN WAR' TRIGGER", s: "Moscow says Tallinn is on the verge of triggering open war.", src: "Reuters", c: "F" },
    { n: 13, h: "NINE MORE CHILDREN REUNITED IN TRUMP EFFORT", s: "Melania Trump's effort brings the total reunited to 43.", src: "First Lady's Office", c: "F" },
    { n: 14, h: "POLAND PLANS NO-FLY ZONE NEAR UKRAINE BORDER", s: "Warsaw asks NATO to intercept Russian missiles near its border.", src: "Reports", c: "H" },
    { n: 15, h: "LEBANON TO OPEN SECOND AIRPORT IN THE NORTH", s: "New airport opens next month as Hezbollah's sway wanes.", src: "Reuters", c: "F" },
    { n: 16, h: "ECUADOR IN TALKS WITH US ON OPERATIONS REVIEW", s: "Minister says talks focus on reviewing US operations in country.", src: "Reuters", c: "F" },
    { n: 17, h: "AMNESTY URGES ICC PROBE OVER GAZA BIRTHS", s: "Rights group cites Israel's impact on births in Gaza.", src: "Amnesty", c: "F" },
    { n: 18, h: "RSF DRONE STRIKES KILL 19 CIVILIANS IN DAMAZIN", s: "Rights groups report strikes in Sudan's Blue Nile state.", src: "Rights groups", c: "H" },
    { n: 19, h: "AT LEAST 30 KILLED IN ATTACKS IN NIGER STATE", s: "Armed attacks hit communities in Nigeria's Niger State.", src: "Reports", c: "F" },
  ]},
  { title: "WAR & DIPLOMACY (CONT.)", stories: [
    { n: 20, h: "RIOTERS BURN AT LEAST 100 GRAMEEN BANK BRANCHES", s: "Branches torched across Bangladesh amid unrest.", src: "Reports", c: "F" },
    { n: 21, h: "IRAN WARNS SHIPS AFTER MINES HIT IN HORMUZ", s: "Tehran says vessels hit underwater mines; urges coordination.", src: "Reports", c: "H" },
    { n: 22, h: "EU URGES CURBS ON OLD RUSSIAN PASSPORTS", s: "Schengen states told to stop accepting them; visa curbs planned.", src: "Reports", c: "F" },
    { n: 23, h: "STORM THREATENS 1.76M PALESTINIANS IN SHELTERS", s: "Gaza media office warns of storm over makeshift shelters.", src: "Gaza media office", c: "F" },
    { n: 24, h: "WARSAW TEEN HELD OVER SCHOOL ATTACK PLOT", s: "A 15-year-old student is detained for planning an attack.", src: "Reports", c: "F" },
    { n: 25, h: "ECOWAS SETS 2027 TARGET FOR REGIONAL FORCE", s: "Bloc approves roadmap to deploy its security force by end-2027.", src: "ECOWAS", c: "F" },
  ]},
  { title: "MARKETS & ECONOMY", stories: [
    { n: 26, h: "US STOCKS FALL AS AI FEARS DEEPEN", s: "Nasdaq drops almost 4%; Nvidia ends down 3.9% at $149.30.", src: "Reuters", c: "F" },
    { n: 27, h: "ASIAN SHARES BOUNCE ON THURSDAY", s: "Nikkei +1.6%, Kospi +1.9%; S&P 500 futures +0.5%.", src: "Reuters", c: "F" },
    { n: 28, h: "US Q3 GDP REVISED UP SHARPLY TO 4.3%", s: "Fed's core inflation measure stands at 3.3%.", src: "Reuters", c: "F" },
    { n: 29, h: "FED BEIGE BOOK: MODEST GROWTH, PRICE PRESSURE", s: "Wage gains continue; price pressure persists, Fed survey finds.", src: "Federal Reserve", c: "F" },
    { n: 30, h: "TAIWAN SHARES PLUNGE 1,926.92 POINTS", s: "NT dollar weakens past 33 per US dollar.", src: "Taiwan exchange", c: "F" },
    { n: 31, h: "RECORD NOVEMBER OUTLOWS HIT BTC, ETH ETFS", s: "Bitcoin spot ETFs shed $4.71bn; BlackRock IBIT 88.5% of exits.", src: "SoSoValue", c: "F" },
    { n: 32, h: "UKRAINE LEGALISES AND TAXES CRYPTO MARKET", s: "Law passes 271-0; takes effect 1 July 2027.", src: "Verkhovna Rada", c: "F" },
    { n: 33, h: "GOLD EASES 0.4% TO $3,566 AN OUNCE", s: "Metal is down almost 8% across November.", src: "Reuters", c: "F" },
    { n: 34, h: "DOJ LAUNCHES LARGEST-EVER SCAM CRACKDOWN", s: "More than 800 defendants charged, including crypto fraud cases.", src: "DOJ", c: "F" },
  ]},
  { title: "TECH & SCIENCE", stories: [
    { n: 35, h: "FCC CLEARS SPACEX'S 1M SATELLITE AI NETWORK", s: "Starmind constellation: solar-powered orbital data centres.", src: "FCC", c: "F" },
    { n: 36, h: "CROWDSTRIKE TO BUY ZSCALER FOR $43.9BN", s: "Blockbuster cyber deal announced by both companies.", src: "Company releases", c: "F" },
    { n: 37, h: "TREASURY'S FINCEN GOES OFFLINE AFTER HACK", s: "Filing systems shut after unauthorised access found 18 Nov.", src: "Treasury", c: "F" },
    { n: 38, h: "HUAWEI CONVICTED ON 10 OF 12 US COUNTS", s: "Verdict lands as firm launches its Mate X8 phone.", src: "Reports", c: "F" },
    { n: 39, h: "DEEPMIND LAUNCHES MASS SPEC SKILLS", s: "Tool hits 97% mass-spectrometry identification accuracy.", src: "Google DeepMind", c: "F" },
    { n: 40, h: "AMAZON, META IN TALKS OVER AI SHOPPING AGENT", s: "Pair discuss unblocking Meta's Muse agent on Amazon.", src: "Reports", c: "H" },
    { n: 41, h: "CHINA LAUNCHES SHENZHOU-24 WITH PAKISTANI CREW", s: "First foreign astronaut aboard a Tiangong mission.", src: "Reports", c: "F" },
    { n: 42, h: "HOW CHINA GOT NVIDIA AI CHIPS DESPITE RULES", s: "Explainer traces the workarounds around US controls.", src: "Reuters", c: "F" },
    { n: 43, h: "PROBE RETURNS TO DIMORPHOS CRATER", s: "Spacecraft revisits asteroid crater four years after crash test.", src: "Reports", c: "F" },
    { n: 44, h: "MOSQUITOES CUT VIRAL INFECTIONS 68% IN BRAZIL", s: "Wolbachia-infected mosquitoes show big trial gains.", src: "Reports", c: "F" },
    { n: 45, h: "5.7 QUAKE STRIKES OFF ANTARCTICA COAST", s: "Magnitude 5.7 tremor recorded off the Antarctic coast.", src: "Reports", c: "F" },
  ]},
  { title: "SPORT / CULTURE / SOCIETY", stories: [
    { n: 46, h: "MACY'S 100TH PARADE POSTPONED BY STORM", s: "First weather postponement ever; nor'easter brings 60 mph gusts.", src: "Macy's", c: "F" },
    { n: 47, h: "PUERTO RICO'S BARRETO CROWNED MISS UNIVERSE", s: "Jennifer Barreto is the first married mother to win the title.", src: "Telemundo", c: "F" },
    { n: 48, h: "DURAN DURAN'S ANDY TAYLOR DIES AT 65", s: "Guitarist and songwriter of the band dies, aged 65.", src: "Reuters", c: "F" },
    { n: 49, h: "GUKESH OPENS TITLE DEFENCE WITH A DRAW", s: "World champion draws in 38 moves vs Sindarov in Switzerland.", src: "Reports", c: "F" },
    { n: 50, h: "SOORYAVANSHI, 15, HITS 28-BALL CENTURY", s: "Record List A hundred for India A vs UAE in Doha.", src: "Reports", c: "F" },
  ]},
];

const FIGURES = [
  "BRENT $94.81  |  US CRUDE $84.24  |  GOLD $3,566/OZ",
  "NASDAQ -4%  |  NVIDIA -3.9% TO $149.30  |  NIKKEI +1.6%",
  "31 KILLED IN CAIRO FIRE  |  5 PLANES HIT AT SAVASLEYKA  |  9 CHILDREN REUNITED (43 TOTAL)",
  "$43.9BN CROWDSTRIKE DEAL  |  $4.71BN BTC ETF OUTFLOWS  |  1,000,000 SATELLITES APPROVED",
  "100TH MACY'S PARADE MOVED TO 28 NOV  |  38-MOVE DRAW: GUKESH-SINDAROV",
];

// --- Layout ---
const MARGIN = 24;
const COL_W = (W - MARGIN * 2 - 16) / 2; // 480
const COL_A = [SECTIONS[0], SECTIONS[2]]; // War 5-19 + Markets
const COL_B = [SECTIONS[1], SECTIONS[3], SECTIONS[4]]; // War cont. + Tech + Sport

function storyLines(st, width, s) {
  const head = wrap(st.n + ". " + st.h, width - 14, s);
  const body = wrap(st.s + " - " + st.src, width, s);
  return { head, body };
}

// Shrink-to-fit: try roomier tiers first, fall back to tighter ones.
// Never aborts: the tightest tier always fits because every story is
// capped at 2 wrapped lines by the widths above.
function measureColumn(blocks, leading, gap) {
  let h = 0;
  for (const b of blocks) {
    h += 22 + 6; // section header bar + gap
    for (const st of b.stories) {
      const { head, body } = storyLines(st, COL_W, 1);
      h += head.length * leading + body.length * leading + gap;
    }
  }
  return h;
}

function drawColumn(blocks, x, y, leading, gap) {
  let cy = y;
  for (const b of blocks) {
    fillRect(x, cy, COL_W, 20, INK);
    drawText(b.title, x + 6, cy + 3, 2, PAPER);
    cy += 26;
    for (const st of b.stories) {
      const { head, body } = storyLines(st, COL_W, 1);
      for (let i = 0; i < head.length; i++) {
        drawText(head[i], x, cy + i * leading, 1, INK);
      }
      drawMark(x + COL_W - 7, cy + 3, st.c, 4);
      let by = cy + head.length * leading;
      for (let i = 0; i < body.length; i++) {
        drawText(body[i], x, by + i * leading, 1, GREY);
      }
      cy = by + body.length * leading + gap;
    }
  }
  return cy;
}

function draw() {
  let y = 14;
  // Masthead
  const mast = "THE WORLD IN ONE DAY";
  drawText(mast, Math.floor((W - textWidth(mast, 5)) / 2), y, 5, INK);
  y += 35 + 6;
  hline(MARGIN, W - MARGIN, y, INK, 2);
  y += 6;
  // Date band
  const date = "THURSDAY 26 NOVEMBER 2026";
  drawText(date, Math.floor((W - textWidth(date, 2)) / 2), y, 2, INK);
  y += 14 + 6;
  // Legend
  let lx = Math.floor((W - (textWidth("CONFIRMED", 1) + textWidth("REPORTED CLAIM", 1) + textWidth("LATE 25 NOV", 1) + 3 * 14 + 2 * 24)) / 2);
  drawMark(lx + 4, y + 3, "F", 4);
  drawText("CONFIRMED", lx + 12, y, 1, GREY);
  lx += 12 + textWidth("CONFIRMED", 1) + 24;
  drawMark(lx + 4, y + 3, "H", 4);
  drawText("REPORTED CLAIM", lx + 12, y, 1, GREY);
  lx += 12 + textWidth("REPORTED CLAIM", 1) + 24;
  drawMark(lx + 4, y + 3, "O", 4);
  drawText("LATE 25 NOV", lx + 12, y, 1, GREY);
  y += 7 + 6;
  hline(MARGIN, W - MARGIN, y, INK, 1);
  y += 6;

  // Lead block
  drawText("TOP STORIES", MARGIN, y, 2, INK);
  y += 14 + 6;
  for (const st of LEAD) {
    const head = wrap(st.n + ". " + st.h, W - MARGIN * 2 - 14, 2);
    for (let i = 0; i < head.length; i++) {
      drawText(head[i], MARGIN, y + i * 14, 2, INK);
    }
    drawMark(W - MARGIN - 7, y + 7, st.c, 5);
    let by = y + head.length * 14 + 3;
    const body = wrap(st.s + " - " + st.src, W - MARGIN * 2, 1);
    for (let i = 0; i < body.length; i++) {
      drawText(body[i], MARGIN, by + i * 9, 1, GREY);
    }
    y = by + body.length * 9 + 8;
    if (st.n < 4) hline(MARGIN, W - MARGIN, y - 4, [200, 200, 190], 1);
  }
  hline(MARGIN, W - MARGIN, y, INK, 2);
  y += 8;

  // Sections: pick the roomiest tier that fits the space left.
  const figuresTop = H - 118;
  const avail = figuresTop - y - 8;
  const tiers = [
    { leading: 10, gap: 5 },
    { leading: 9, gap: 4 },
    { leading: 9, gap: 3 },
    { leading: 8, gap: 2 },
  ];
  let tier = tiers[tiers.length - 1];
  for (const t of tiers) {
    const need = Math.max(measureColumn(COL_A, t.leading, t.gap), measureColumn(COL_B, t.leading, t.gap));
    if (need <= avail) { tier = t; break; }
  }
  drawColumn(COL_A, MARGIN, y, tier.leading, tier.gap);
  drawColumn(COL_B, MARGIN + COL_W + 16, y, tier.leading, tier.gap);

  // By the Numbers box
  const boxY = figuresTop;
  fillRect(MARGIN, boxY, W - MARGIN * 2, 2, INK);
  drawText("BY THE NUMBERS", MARGIN, boxY + 8, 2, INK);
  let fy = boxY + 8 + 14 + 4;
  for (const line of FIGURES) {
    drawText(line, Math.floor((W - textWidth(line, 1)) / 2), fy, 1, INK);
    fy += 10;
  }
  fillRect(MARGIN, fy + 4, W - MARGIN * 2, 2, INK);
  const foot = "50 STORIES FROM 26 NOVEMBER 2026 - THE WORLD IN ONE DAY";
  drawText(foot, Math.floor((W - textWidth(foot, 1)) / 2), fy + 10, 1, GREY);
}

// --- Main ---
const here = dirname(fileURLToPath(import.meta.url));
draw();
const png = encodePNG();
const outPath = join(here, "entry.png");
writeFileSync(outPath, png);
const allStories = LEAD.length + SECTIONS.reduce((a, s) => a + s.stories.length, 0);
const sha = createHash("sha256").update(png).digest("hex");
console.log("entry.png " + W + "x" + H + " " + png.length + " bytes sha256=" + sha);
console.log("stories: " + allStories + " (lead " + LEAD.length + ", sections " + (allStories - LEAD.length) + ")");
if (png.length > 1024 * 1024) console.log("WARNING: over 1 MiB");
