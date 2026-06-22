# MP Online Hub – Cyber Café Toolkit

A production-ready MVP for cyber café/shop owners.

## Features
- 📸 **Passport Photo Generator** – 4/8/16 copies on A4 (print-ready)
- 📦 **File Size Reducer** – Compress to exact 20KB / 50KB / 100KB
- 📄 **PDF Tools** – Merge PDFs, JPG→PDF, Compress PDF
- ✍️ **Signature Tool** – Remove background → transparent PNG
- 📱 **QR File Transfer** – Let customers upload from their phone in real-time

## Folder Structure

```
Hub/
├── backend/
│   ├── server.js              # Entry point
│   ├── src/
│   │   ├── app.js             # Express app
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Multer upload config
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/socket.js    # Socket.IO singleton
│   └── uploads/               # Uploaded files (auto-cleaned)
└── frontend/
    └── src/
        ├── App.jsx            # Router
        ├── pages/             # All page components
        └── index.css          # Global dark theme
```

## Running Locally

### Backend
```bash
cd Hub/backend
node server.js
# Runs on http://localhost:5000
```

### Frontend
```bash
cd Hub/frontend
npm run dev
# Runs on http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/session/create` | Create QR upload session |
| GET | `/session/:id` | Get session info |
| POST | `/upload/:sessionId` | Upload file to session |
| POST | `/passport/generate` | Generate passport photo sheet |
| POST | `/compress` | Compress image/PDF to target KB |
| POST | `/pdf/merge` | Merge multiple PDFs |
| POST | `/pdf/jpg-to-pdf` | Convert images to PDF |
| POST | `/pdf/compress` | Compress a PDF |
| POST | `/signature/generate` | Remove background from signature |

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express + Socket.IO
- **Image**: Sharp
- **PDF**: pdf-lib
- **Upload**: Multer
- **QR**: qrcode
## Author
Amit Singh – [itzamitsingh01](https://github.com/itzamitsingh01)
