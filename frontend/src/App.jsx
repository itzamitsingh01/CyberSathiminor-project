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
 *     /dashboard          → Home
 *     /passport           → PassportTool
 *     /compress           → CompressTool
 *     /pdf                → PdfTools
 *     /signature          → SignatureTool
 *     /qr-session         → QrSession (auth-gated)
 *     /pricing            → SubscriptionPage
 *     /about              → About
 *     /help               → Help
 *     *                   → redirect /dashboard
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'

import { LanguageProvider }  from './LanguageContext'
import { ThemeProvider }     from './ThemeContext'
import AuthHydrator          from './components/AuthHydrator'

// Public pages
import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import MobileUpload       from './pages/MobileUpload'

// App shell layout (renders <Outlet />, no nested <Routes>)
import AppShell           from './components/AppShell'

// Dashboard pages (rendered inside AppShell via <Outlet />)
import Home               from './pages/Home'
import PassportTool       from './pages/PassportTool'
import CompressTool       from './pages/CompressTool'
import PdfTools           from './pages/PdfTools'
import SignatureTool      from './pages/SignatureTool'
import QrSession          from './pages/QrSession'
import SubscriptionPage   from './pages/SubscriptionPage'
import About              from './pages/About'
import Help               from './pages/Help'

// Auth guard for QR session (requires login)
import { useAuth } from './hooks/useAuth'
function AuthOnlyRoute({ children }) {
    const { isLoggedIn } = useAuth()
    if (!isLoggedIn) return <Navigate to="/register" state={{ from: { pathname: '/qr-session' } }} replace />
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
                            <Route element={<AppShell />}>
                                <Route path="/dashboard"  element={<Home />} />
                                <Route path="/passport"   element={<PassportTool />} />
                                <Route path="/compress"   element={<CompressTool />} />
                                <Route path="/pdf"        element={<PdfTools />} />
                                <Route path="/signature"  element={<SignatureTool />} />
                                <Route path="/qr-session" element={
                                    <AuthOnlyRoute><QrSession /></AuthOnlyRoute>
                                } />
                                <Route path="/pricing"    element={<SubscriptionPage />} />
                                <Route path="/about"      element={<About />} />
                                <Route path="/help"       element={<Help />} />
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
