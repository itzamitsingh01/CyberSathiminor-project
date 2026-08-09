/**
 * App.jsx — Proper React Router v6 nested routing architecture
 *
 * Layout Routes (no path) → AppShell renders <Outlet />, no nested <Routes>
 * This eliminates the "descendant Routes" error entirely.
 *
 * Route Tree:
 *   /                     → LandingPage
 *   /login                → LoginPage
 *   /register             → RegisterPage
 *   /forgot-password      → ForgotPasswordPage
 *   /upload/:sessionId    → MobileUpload
 *   (layout: AppShell)
 *     /dashboard          → Home (lazy)
 *     /passport           → PassportTool (lazy)
 *     /compress           → CompressTool (lazy)
 *     /pdf                → PdfTools (lazy)
 *     /signature          → SignatureTool (lazy)
 *     /qr-session         → QrSession (auth-gated, lazy)
 *     /pricing            → SubscriptionPage (lazy)
 *     /about              → About (lazy)
 *     /help               → Help (lazy)
 *     *                   → redirect /dashboard
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import './index.css'

import { LanguageProvider }  from './LanguageContext'
import { ThemeProvider }     from './ThemeContext'
import AuthHydrator          from './components/AuthHydrator'
import useAuthStore          from './store/authStore'

// Public pages (eager — needed for initial load)
import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import MobileUpload       from './pages/MobileUpload'
import AppShell           from './components/AppShell'

// Dashboard pages — lazy loaded to reduce initial bundle (P-1)
const Home             = lazy(() => import('./pages/Home'))
const PassportTool     = lazy(() => import('./pages/PassportTool'))
const CompressTool     = lazy(() => import('./pages/CompressTool'))
const PdfTools         = lazy(() => import('./pages/PdfTools'))
const SignatureTool    = lazy(() => import('./pages/SignatureTool'))
const QrSession        = lazy(() => import('./pages/QrSession'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const About            = lazy(() => import('./pages/About'))
const Help             = lazy(() => import('./pages/Help'))
const BgRemoverTool    = lazy(() => import('./pages/BgRemoverTool'))
const OcrTool          = lazy(() => import('./pages/OcrTool'))

/** Minimal spinner shown while lazy chunks load */
function PageLoader() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', flexDirection: 'column', gap: 12,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</span>
        </div>
    )
}

/**
 * Auth guard for QR session (requires login).
 * Waits for isHydrated so a valid refresh cookie isn't
 * mistakenly redirected during the async /auth/me call. (C-4 fix)
 */
function AuthOnlyRoute({ children }) {
    // isLoggedIn is NOT a store field — compute it from accessToken
    const { accessToken, isHydrated } = useAuthStore()
    const isLoggedIn = !!accessToken

    // Still waiting for hydration — show spinner instead of redirecting
    if (!isHydrated) return <PageLoader />

    if (!isLoggedIn) {
        return <Navigate to="/register" state={{ from: { pathname: '/qr-session' } }} replace />
    }
    return children
}

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <BrowserRouter>
                    <AuthHydrator>
                        <Toaster
                            position="top-center"
                            toastOptions={{
                                style: {
                                    background: 'var(--card)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '14px',
                                },
                            }}
                        />

                        <Routes>
                            {/* ── Public standalone pages ── */}
                            <Route path="/"                element={<LandingPage />} />
                            <Route path="/login"           element={<LoginPage />} />
                            <Route path="/register"        element={<RegisterPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/upload/:sessionId" element={<MobileUpload />} />

                            {/* ── Dashboard layout (AppShell = layout, no path) ── */}
                            {/* All children render into AppShell's <Outlet /> */}
                            <Route element={<Suspense fallback={<PageLoader />}>
      <AppShell />
    </Suspense>}>
                                {/* <Suspense fallback={<PageLoader />}> */}
                                    <Route path="/dashboard"    element={<Home />} />
                                    <Route path="/passport"     element={<PassportTool />} />
                                    <Route path="/compress"     element={<CompressTool />} />
                                    <Route path="/pdf"          element={<PdfTools />} />
                                    <Route path="/signature"    element={<SignatureTool />} />
                                    <Route path="/bg-remover"   element={<BgRemoverTool />} />
                                    <Route path="/ocr"          element={<OcrTool />} />
                                    <Route path="/qr-session" element={
                                        <AuthOnlyRoute><QrSession /></AuthOnlyRoute>
                                    } />
                                    <Route path="/pricing"    element={<SubscriptionPage />} />
                                    <Route path="/about"      element={<About />} />
                                    <Route path="/help"       element={<Help />} />
                                {/* </Suspense> */}
                            </Route>

                            {/* ── Fallback ── */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthHydrator>
                </BrowserRouter>
            </LanguageProvider>
        </ThemeProvider>
    )
}

export default App
