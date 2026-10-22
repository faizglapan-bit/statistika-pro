import React, { createContext, useContext, useState, useCallback } from 'react'
import { Language } from '@/types'
import { translations, TranslationKey } from '@/i18n/translations'

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('id')

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id')
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key]
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
