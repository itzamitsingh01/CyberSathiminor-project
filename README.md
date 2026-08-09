# 🌐 CyberSathi — AI-Powered Cyber Café Toolkit

> A production-ready SaaS platform for cyber café & shop owners — built with React, Node.js, AI/ML browser tools, and real-time features.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Vite-v8-purple?logo=vite)](https://vitejs.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-RealTime-black?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ✨ Features (7 Tools)

### 📸 Passport Photo Generator
- Generate 4 / 8 / 16 passport photos on a single A4 sheet
- 35×45 mm standard size with cutting guides
- Print-ready output via Sharp image processing

### 📦 File Size Reducer
- Compress images & PDFs to exact target sizes: 20KB / 50KB / 100KB
- Useful for government form uploads with strict size limits

### 📄 PDF Tools (3-in-1)
- **Merge PDFs** — combine multiple PDFs into one
- **JPG → PDF** — convert images to PDF
- **Compress PDF** — reduce PDF file size

### ✍️ Signature Creator
- Draw digital signature on canvas
- Upload handwritten signature → remove background → transparent PNG
- Download as PNG for digital forms

### 📱 QR File Transfer *(Real-Time)*
- Generate QR code → customer scans on phone → files upload directly to shop PC
- Zero cloud dependency — powered by **Socket.IO** for real-time transfer

### 🤖 AI Background Remover *(NEW — AI Feature)*
- Remove background from any photo instantly using **WebAssembly ML model**
- Runs 100% in browser — **no API key, no server, no cost**
- 8 background color options: Transparent, White, Blue, Red, Green, Black, Gray, Navy
- Before/After comparison view + PNG download
- Tech: `@imgly/background-removal` (ONNX model via WASM)

### 🔍 Smart OCR — Text Extractor *(NEW — AI Feature)*
- Extract text from any image using **Tesseract.js** (browser-based OCR engine)
- Supports **English**, **Hindi**, and **English + Hindi** mixed text
- Works on: Documents, ID cards, handwritten notes, signboards, screenshots
- Shows confidence score, word count, character count
- Editable extracted text → Copy to clipboard or Download as `.txt`
- Tech: `tesseract.js` v5

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS v4 |
| **Backend** | Node.js + Express.js |
| **Real-Time** | Socket.IO |
| **Auth** | JWT + httpOnly Cookies + OTP Email Verification |
| **Image Processing** | Sharp |
| **PDF** | pdf-lib |
| **File Upload** | Multer + Cloudinary |
| **AI — BG Removal** | @imgly/background-removal (WASM + ONNX) |
| **AI — OCR** | Tesseract.js (WebAssembly) |
| **Rate Limiting** | express-rate-limit (4 separate limiters) |
| **State Management** | Zustand |
| **QR Code** | qrcode |

---

## 📁 Folder Structure

```
CyberSathi/
├── backend/
│   ├── server.js                  # Entry point
│   └── src/
│       ├── app.js                 # Express app + middleware + rate limiters
│       ├── controllers/           # auth, session, upload handlers
│       ├── middleware/            # Multer, auth guard
│       ├── routes/                # passport, compress, pdf, signature, session
│       ├── services/              # Business logic
│       └── utils/socket.js        # Socket.IO singleton
└── frontend/
    └── src/
        ├── App.jsx                # React Router v6 (lazy loading)
        ├── pages/
        │   ├── LandingPage.jsx    # Marketing page
        │   ├── Home.jsx           # Dashboard (7 tools)
        │   ├── PassportTool.jsx   # Passport photo generator
        │   ├── CompressTool.jsx   # File compressor
        │   ├── PdfTools.jsx       # PDF utilities
        │   ├── SignatureTool.jsx   # Signature creator
        │   ├── QrSession.jsx      # QR file transfer
        │   ├── BgRemoverTool.jsx  # 🤖 AI background remover (NEW)
        │   └── OcrTool.jsx        # 🔍 Smart OCR (NEW)
        ├── components/            # AppShell, Navbar, RecentFiles
        ├── store/                 # Zustand (authStore, guestStore)
        └── hooks/                 # useAuth, useGuestLimit
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas URI (for auth features)

### Backend
```bash
cd backend
cp .env.example .env   # Fill in MongoDB URI, JWT secret, etc.
node server.js
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

> **Note:** AI features (Background Remover & OCR) work without backend — open `/bg-remover` or `/ocr` directly.

---

## 🔐 Security Features

- **JWT Auth** with httpOnly cookies (XSS-safe)
- **OTP Email Verification** on registration
- **4 Rate Limiters**: Auth (10/15min), OTP (5/10min), Tools (30/min), Upload (20/min)
- **CORS whitelist** — only allowed origins accepted
- **Global error handler** with proper HTTP status codes

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register + send OTP |
| POST | `/api/auth/login` | Login → set httpOnly JWT cookie |
| POST | `/api/session/create` | Create QR upload session |
| POST | `/api/upload/:sessionId` | Upload file to session |
| POST | `/api/passport/generate` | Generate passport photo sheet |
| POST | `/api/compress` | Compress image/PDF to target KB |
| POST | `/api/pdf/merge` | Merge multiple PDFs |
| POST | `/api/pdf/jpg-to-pdf` | Convert images to PDF |
| POST | `/api/signature/generate` | Remove background from signature |

---

## 👤 Author

**Amit Singh**
- GitHub: [@itzamitsingh01](https://github.com/itzamitsingh01)
- LinkedIn: [amit-singh2468](https://www.linkedin.com/in/amit-singh2468)
- Email: amitsingh013919@gmail.com

---

> ⭐ If you found this useful, please **star the repo** — it helps a lot!
