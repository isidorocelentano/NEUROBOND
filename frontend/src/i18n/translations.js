// Internationalization translations for NEUROBOND
export const translations = {
  de: {
    // Navigation & Headers
    welcome: "Willkommen bei NEUROBOND",
    login: "Anmelden",
    register: "Kostenlos registrieren", 
    proVersion: "PRO Version starten",
    dashboard: "Dashboard",
    
    // Landing Page
    title: "Stärke deine Beziehung mit KI-gestütztem Training",
    subtitle: "Empathie lernen, Kommunikation verbessern, Verbindung vertiefen",
    swissQuality: "Schweizer Qualität aus Nottwil",
    tryFree: "Kostenlos ausprobieren",
    
    // Login & Registration
    email: "Email-Adresse",
    enterEmail: "Bitte geben Sie eine Email-Adresse ein",
    noAccountFound: "Kein Account mit dieser Email gefunden. Bitte registrieren Sie sich zuerst",
    loginFailed: "Login fehlgeschlagen. Bitte versuchen Sie es erneut",
    connectionError: "Verbindungsfehler. Bitte versuchen Sie es erneut",
    alreadyRegistered: "Bereits registriert? Schnell anmelden:",
    quickLogin: "Oder verwenden Sie den gelben PRO-Test Button für sofortigen Zugang",
    
    // Training Features
    dialogCoaching: "Dialog-Coaching",
    communityCase: "Community Cases",
    ownCases: "Eigene Cases",
    partnerDashboard: "Partner Dashboard",
    gefuehlslexikon: "Gefühlslexikon",
    trainingStages: "Training Stufen",
    
    // Training Scenarios
    activeListening: "Aktives Zuhören",
    reflectFeelings: "Gefühle spiegeln", 
    askQuestions: "Nachfragen stellen",
    readBodyLanguage: "Körpersprache lesen",
    empathicAnswers: "Empathische Antworten",
    
    // Speech Input
    microphonePermission: "Mikrofon-Berechtigung verweigert. Bitte erlauben Sie den Mikrofon-Zugriff",
    noSpeechDetected: "Keine Sprache erkannt. Bitte sprechen Sie deutlicher",
    noMicrophone: "Kein Mikrofon gefunden. Bitte überprüfen Sie Ihr Mikrofon",
    networkError: "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung",
    speechNotSupported: "Spracherkennung wird von diesem Browser nicht unterstützt",
    speechNotAvailable: "Spracherkennung nicht verfügbar",
    microphoneRequired: "Mikrofon-Berechtigung erforderlich. Bitte erlauben Sie den Zugriff",
    
    // Languages
    languageGerman: "Deutsch",
    languageSwissGerman: "Schweizerdeutsch", 
    languageEnglish: "English",
    
    // Buttons & Actions
    start: "Starten",
    continue: "Weiter",
    back: "Zurück",
    send: "Senden",
    save: "Speichern",
    cancel: "Abbrechen",
    close: "Schließen",
    
    // Status & Messages
    loading: "Lade Dialog...",
    success: "Erfolgreich",
    error: "Fehler",
    warning: "Warnung",
    info: "Information",
    
    // PRO Features
    proTestMode: "PRO Test-Modus aktiviert!",
    upgradeRequired: "ist nur in der PRO Version verfügbar. Upgrade für vollständigen Zugang!",
    proAccess: "PRO-Zugang aktiviert",
    freeMode: "FREE-Modus aktiviert. PRO Features gesperrt"
  },
  
  en: {
    // Navigation & Headers  
    welcome: "Welcome to NEUROBOND",
    login: "Sign In",
    register: "Sign Up Free",
    proVersion: "Start PRO Version", 
    dashboard: "Dashboard",
    
    // Landing Page
    title: "Strengthen Your Relationship with AI-Powered Training",
    subtitle: "Learn Empathy, Improve Communication, Deepen Connection",
    swissQuality: "Swiss Quality from Nottwil",
    tryFree: "Try for Free",
    
    // Login & Registration
    email: "Email Address",
    enterEmail: "Please enter an email address",
    noAccountFound: "No account found with this email. Please register first",
    loginFailed: "Login failed. Please try again",
    connectionError: "Connection error. Please try again",
    alreadyRegistered: "Already registered? Quick sign in:",
    quickLogin: "Or use the yellow PRO-Test button for instant access",
    
    // Training Features
    dialogCoaching: "Dialog Coaching",
    communityCase: "Community Cases", 
    ownCases: "Own Cases",
    partnerDashboard: "Partner Dashboard",
    gefuehlslexikon: "Emotion Lexicon",
    trainingStages: "Training Stages",
    
    // Training Scenarios
    activeListening: "Active Listening",
    reflectFeelings: "Reflect Feelings",
    askQuestions: "Ask Questions", 
    readBodyLanguage: "Read Body Language",
    empathicAnswers: "Empathic Responses",
    
    // Speech Input
    microphonePermission: "Microphone permission denied. Please allow microphone access",
    noSpeechDetected: "No speech detected. Please speak more clearly",
    noMicrophone: "No microphone found. Please check your microphone", 
    networkError: "Network error. Please check your internet connection",
    speechNotSupported: "Speech recognition is not supported by this browser",
    speechNotAvailable: "Speech recognition not available",
    microphoneRequired: "Microphone permission required. Please allow access",
    
    // Languages
    languageGerman: "Deutsch",
    languageSwissGerman: "Schweizerdeutsch",
    languageEnglish: "English",
    
    // Buttons & Actions
    start: "Start",
    continue: "Continue", 
    back: "Back",
    send: "Send",
    save: "Save",
    cancel: "Cancel", 
    close: "Close",
    
    // Status & Messages
    loading: "Loading Dialog...",
    success: "Success",
    error: "Error", 
    warning: "Warning",
    info: "Information",
    
    // PRO Features
    proTestMode: "PRO Test Mode activated!",
    upgradeRequired: "is only available in the PRO version. Upgrade for full access!",
    proAccess: "PRO access activated", 
    freeMode: "FREE mode activated. PRO features locked"
  }
};

// Language context and hook
import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('de');

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations['de'][key] || key;
  };

  const switchLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem('neurobond_language', lang);
    }
  };

  // Initialize from localStorage
  React.useEffect(() => {
    const savedLang = localStorage.getItem('neurobond_language');
    if (savedLang && translations[savedLang]) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      switchLanguage, 
      t,
      availableLanguages: [
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'en', name: 'English', flag: '🇺🇸' }
      ]
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};