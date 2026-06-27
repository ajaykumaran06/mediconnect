import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English',          flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',             flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',            flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',           flag: '🇮🇳' },
];

/**
 * Floating language switcher dropdown.
 * Persists selected language to localStorage so it survives refresh.
 * Drop it anywhere — Navbar, Settings page, footer.
 */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const switchTo = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('mc_language', code);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span>{current.flag} {current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <ul
            role="listbox"
            aria-label="Select language"
            className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
          >
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  role="option"
                  aria-selected={lang.code === i18n.language}
                  onClick={() => switchTo(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                    lang.code === i18n.language
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {lang.code === i18n.language && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
