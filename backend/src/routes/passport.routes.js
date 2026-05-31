/**
 * passport.routes.js – Buffer-in → Cloudinary URL out.
 * Accepts: image, count, removeBg, personName, showDate, stampDate, dateFormat, cropPosition
 * Protected: requires authentication. Tracks per-user monthly usage.
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { generatePassportPhoto } = require('../services/passport.service');
const { uploadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');

router.post('/generate', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file required' });

    try {
        const count        = parseInt(req.body.count || '8', 10);
        const removeBg     = req.body.removeBg === 'true';
        const personName   = req.body.personName  || '';
        const showDate     = req.body.showDate === 'true';
        const stampDate    = req.body.stampDate   || '';
        const dateFormat   = req.body.dateFormat  || 'DD-MM-YYYY';
        const cropPosition = req.body.cropPosition || 'center';

        const resultBuffer = await generatePassportPhoto(
            req.file.buffer, count, removeBg,
            { personName, showDate, stampDate, dateFormat, cropPosition }
        );

        const { url } = await uploadBuffer(resultBuffer, {
            folder: 'mp-online-hub/passport',
            resource_type: 'image',
            format: 'png',
        });

        // Increment monthly usage counter
        const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'usage.passport': 1 },
            $set: { 'usage.month': currentMonth },
        });

        res.json({ success: true, url, count });
    } catch (err) {
        console.error('Passport error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
