import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ko from './locales/ko.json'

const LANG_KEY = 'forge-studio-language'

function loadLanguage(): string {
  try {
    return localStorage.getItem(LANG_KEY) || 'en'
  } catch {
    return 'en'
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko }
  },
  lng: loadLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export function changeLanguage(lang: string): void {
  i18n.changeLanguage(lang)
  localStorage.setItem(LANG_KEY, lang)
}

export function getCurrentLanguage(): string {
  return i18n.language
}

export default i18n
