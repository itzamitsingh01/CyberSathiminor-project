/**
 * passport.service.js – Generates a standard A4 passport photo sheet.
 *
 * Features:
 *  - Indian standard: 35 mm × 45 mm @ 300 dpi (413 × 531 px)
 *  - True A4 canvas: 2480 × 3508 px @ 300 dpi
 *  - Tight grid with 3 mm cutting guide lines
 *  - Optional background removal via remove.bg API → replaced with white
 *  - 3-layer text overlay per photo: [Photo] [Name] [Date]
 *  - Adjustable face position (top / center / bottom) for cropping
 */
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');

// ── Indian passport photo standard (35 × 45 mm @ 300 dpi) ───────────────────
const PHOTO_W = 413;
const PHOTO_H = 531;

// ── A4 @ 300 dpi ─────────────────────────────────────────────────────────────
const A4_W = 2480;
const A4_H = 3508;

// ── Layout ───────────────────────────────────────────────────────────────────
const MARGIN = 59;       // 5 mm margin on each side
const GAP    = 35;       // 3 mm gap between photos (for cutting guides)
const GUIDE_W = 2;       // cutting guide line thickness

const MAX_COLS = Math.floor((A4_W - 2 * MARGIN + GAP) / (PHOTO_W + GAP)); // 5
const MAX_ROWS = Math.floor((A4_H - 2 * MARGIN + GAP) / (PHOTO_H + GAP)); // 6

// ── Text stamp sizes (px on A4) ───────────────────────────────────────────────
const NAME_FONT_SIZE = 28;   // ~ 2.4 mm at 300 dpi — legible when printed
const DATE_FONT_SIZE = 22;
const TEXT_PAD       = 6;    // padding inside text row

// ── Photo cell height = photo + (name row) + (date row) ─────────────────────
// We keep the grid slot taller to accommodate name/date below each photo.
// Only activated when name/date is actually requested.
function cellHeight(hasText) {
    if (!hasText) return PHOTO_H;
    const nameH = NAME_FONT_SIZE + TEXT_PAD * 2;
    const dateH = DATE_FONT_SIZE + TEXT_PAD * 2;
    return PHOTO_H + nameH + dateH;
}

// ── Background Removal ───────────────────────────────────────────────────────
async function removeBgViaApi(inputBuffer) {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) throw new Error('REMOVE_BG_API_KEY is not set in environment variables');

    const fd = new FormData();
    fd.append('image_file', inputBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    fd.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', fd, {
        headers: { ...fd.getHeaders(), 'X-Api-Key': apiKey },
        responseType: 'arraybuffer',
        timeout: 30000,
    });

    return Buffer.from(response.data);
}

async function preparePhotoWithWhiteBg(inputBuffer, cropGravity = 'centre') {
    const transparentPng = await removeBgViaApi(inputBuffer);

    return sharp({
        create: {
            width: PHOTO_W, height: PHOTO_H,
            channels: 3, background: { r: 255, g: 255, b: 255 },
        },
    })
        .composite([{
            input: await sharp(transparentPng)
                .resize(PHOTO_W, PHOTO_H, { fit: 'cover', position: cropGravity })
                .png()
                .toBuffer(),
            blend: 'over',
        }])
        .png()
        .toBuffer();
}

// ── Cutting Guides SVG ────────────────────────────────────────────────────────
function buildGuidesSVG(cols, rows, slotH) {
    const lines = [];
    const x0 = MARGIN;
    const y0 = MARGIN;
    const totalW = cols * (PHOTO_W + GAP) - GAP;
    const totalH = rows * (slotH  + GAP) - GAP;

    for (let c = 0; c <= cols; c++) {
        const x = c === 0 ? x0 : x0 + c * (PHOTO_W + GAP) - Math.floor(GAP / 2);
        lines.push(
            `<line x1="${x}" y1="${y0 - MARGIN / 2}" x2="${x}" y2="${y0 + totalH + MARGIN / 2}"
             stroke="#aaaaaa" stroke-width="${GUIDE_W}" stroke-dasharray="20,15"/>`
        );
    }
    for (let r = 0; r <= rows; r++) {
        const y = r === 0 ? y0 : y0 + r * (slotH + GAP) - Math.floor(GAP / 2);
        lines.push(
            `<line x1="${x0 - MARGIN / 2}" y1="${y}" x2="${x0 + totalW + MARGIN / 2}" y2="${y}"
             stroke="#aaaaaa" stroke-width="${GUIDE_W}" stroke-dasharray="20,15"/>`
        );
    }

    return Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${A4_W}" height="${A4_H}">${lines.join('')}</svg>`
    );
}

// ── Text Row SVG (name or date) ───────────────────────────────────────────────
function buildTextRowSVG(text, fontSize, width, height, color = '#000000') {
    // Escape XML special chars
    const safe = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    return Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="white"/>
          <text
            x="${width / 2}"
            y="${height / 2 + fontSize * 0.35}"
            font-family="Arial, Helvetica, sans-serif"
            font-size="${fontSize}"
            font-weight="bold"
            fill="${color}"
            text-anchor="middle"
            dominant-baseline="middle"
          >${safe}</text>
        </svg>`
    );
}

// ── Format date string ────────────────────────────────────────────────────────
function formatDate(dateStr, fmt = 'DD-MM-YYYY') {
    let d;
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        d = new Date(dateStr);
    } else {
        d = new Date();
    }
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    if (fmt === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
    if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    return `${dd}-${mm}-${yyyy}`;   // default DD-MM-YYYY
}

// ── Map user-facing gravity name to Sharp gravity ────────────────────────────
function resolveGravity(cropPosition) {
    const map = {
        top:    'north',
        center: 'centre',
        centre: 'centre',
        bottom: 'south',
    };
    return map[(cropPosition || '').toLowerCase()] || 'centre';
}

// ── Main Export ───────────────────────────────────────────────────────────────
/**
 * Generate a passport photo sheet.
 *
 * @param {Buffer}  inputBuffer     Raw uploaded image
 * @param {number}  count           Number of photos to tile (1–30)
 * @param {boolean} removeBg        Remove background via remove.bg API
 * @param {object}  opts
 * @param {string}  opts.personName     Name to print below each photo (empty = skip)
 * @param {string}  opts.stampDate      Date string (ISO) or '' for today
 * @param {boolean} opts.showDate       Whether to print a date row
 * @param {string}  opts.dateFormat     'DD-MM-YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
 * @param {string}  opts.cropPosition   'top' | 'center' | 'bottom'
 * @returns {Promise<Buffer>}  PNG buffer of the A4 sheet
 */
async function generatePassportPhoto(inputBuffer, count = 8, removeBg = false, opts = {}) {
    const {
        personName   = '',
        stampDate    = '',
        showDate     = false,
        dateFormat   = 'DD-MM-YYYY',
        cropPosition = 'center',
    } = opts;

    const hasName = Boolean(personName && personName.trim());
    const hasDate = Boolean(showDate);
    const hasText = hasName || hasDate;

    const safeCount = Math.min(Math.max(1, count), MAX_COLS * MAX_ROWS);
    const gravity   = resolveGravity(cropPosition);

    // ── Step 1: prepare the single photo buffer ─────────────────────────────
    let photoBuffer;
    if (removeBg) {
        photoBuffer = await preparePhotoWithWhiteBg(inputBuffer, gravity);
    } else {
        photoBuffer = await sharp(inputBuffer)
            .resize(PHOTO_W, PHOTO_H, { fit: 'cover', position: gravity })
            .png()
            .toBuffer();
    }

    // ── Step 2: build text row buffers (reuse for every cell) ───────────────
    const nameH = NAME_FONT_SIZE + TEXT_PAD * 2;
    const dateH = DATE_FONT_SIZE + TEXT_PAD * 2;

    let nameRowBuf = null;
    let dateRowBuf = null;

    if (hasName) {
        nameRowBuf = await sharp(
            buildTextRowSVG(personName.trim(), NAME_FONT_SIZE, PHOTO_W, nameH, '#000000')
        ).png().toBuffer();
    }

    if (hasDate) {
        const dateText = formatDate(stampDate, dateFormat);
        dateRowBuf = await sharp(
            buildTextRowSVG(dateText, DATE_FONT_SIZE, PHOTO_W, dateH, '#333333')
        ).png().toBuffer();
    }

    // ── Step 3: build a single "cell" composite (photo + optional text rows) ─
    const slotH = cellHeight(hasText);
    const nameH_actual = hasName ? nameH : 0;
    const dateH_actual = hasDate ? dateH : 0;

    // Composite the photo + text rows into one cell buffer
    const cellComposites = [{ input: photoBuffer, top: 0, left: 0 }];
    if (hasName && nameRowBuf) {
        cellComposites.push({ input: nameRowBuf, top: PHOTO_H, left: 0 });
    }
    if (hasDate && dateRowBuf) {
        cellComposites.push({ input: dateRowBuf, top: PHOTO_H + nameH_actual, left: 0 });
    }

    const cellBuffer = await sharp({
        create: {
            width: PHOTO_W, height: slotH,
            channels: 3, background: { r: 255, g: 255, b: 255 },
        },
    })
        .composite(cellComposites)
        .png()
        .toBuffer();

    const cols = Math.min(safeCount, MAX_COLS);
    const rows = Math.ceil(safeCount / cols);

    // ── Step 4: tile cells onto A4 canvas ───────────────────────────────────
    const composites = [];
    composites.push({ input: buildGuidesSVG(cols, rows, slotH), top: 0, left: 0 });

    for (let i = 0; i < safeCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        composites.push({
            input: cellBuffer,
            left: MARGIN + col * (PHOTO_W + GAP),
            top:  MARGIN + row * (slotH  + GAP),
        });
    }

    return sharp({
        create: {
            width: A4_W, height: A4_H,
            channels: 3, background: { r: 255, g: 255, b: 255 },
        },
    })
        .composite(composites)
        .png({ compressionLevel: 8 })
        .toBuffer();
}

module.exports = { generatePassportPhoto, MAX_PHOTOS: MAX_COLS * MAX_ROWS };
