import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('cs_theme')
        if (stored) return stored
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        return systemPrefersDark ? 'dark' : 'light'
    })

    useEffect(() => {
        localStorage.setItem('cs_theme', theme)
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
            root.setAttribute('data-theme', 'dark')
        } else {
            root.classList.remove('dark')
            root.setAttribute('data-theme', 'light')
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
