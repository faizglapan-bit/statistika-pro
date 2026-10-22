// Terjemahan bahasa Indonesia dan Inggris

export const translations = {
  id: {
    // App
    appName: 'Statistika Pro',
    appTagline: 'Analisis Statistik Profesional',

    // Header
    newProject: 'Proyek Baru',
    saved: 'Tersimpan',
    unsaved: 'Belum Tersimpan',
    saving: 'Menyimpan...',
    backendOnline: 'Backend Online',
    backendOffline: 'Backend Offline',
    backendLocal: 'Mode Lokal Siap',
    backendChecking: 'Memeriksa...',
    language: 'Bahasa',

    // Menu
    dashboard: 'Dashboard',
    dataEditor: 'Editor Data',
    variableView: 'Tampilan Variabel',
    analysis: 'Analisis Statistik',
    output: 'Output Viewer',
    reports: 'Laporan',
    settings: 'Pengaturan',

    // Dashboard
    welcomeTitle: 'Selamat Datang di Statistika Pro',
    welcomeSubtitle: 'Platform analisis statistik profesional berbasis web',
    featureAvailable: 'Fitur Tersedia',
    featureComingSoon: 'Segera Hadir',
    quickStart: 'Mulai Cepat',
    openDataEditor: 'Buka Editor Data',
    statusTitle: 'Status Layanan',
    apiStatus: 'API Backend',

    // Data Editor
    dataEditorTitle: 'Editor Data',
    dataEditorSubtitle: 'Masukkan dan kelola data statistik Anda',
    addRow: 'Tambah Baris',
    addColumn: 'Tambah Kolom',
    deleteRow: 'Hapus Baris',
    clearData: 'Hapus Semua',
    importData: 'Impor Data',
    exportData: 'Ekspor Data',
    rows: 'baris',
    columns: 'kolom',
    cell: 'Sel',
    noData: 'Belum ada data. Klik "Tambah Baris" untuk memulai.',
    columnName: 'Nama Kolom',
    enterValue: 'Masukkan nilai...',

    // Coming Soon
    comingSoonTitle: 'Segera Hadir',
    comingSoonDesc: 'Fitur ini sedang dalam pengembangan dan akan tersedia di versi berikutnya.',
    comingSoonFeatures: 'Fitur yang Direncanakan',

    // Errors
    errorTitle: 'Terjadi Kesalahan',
    retryButton: 'Coba Lagi',
    connectionError: 'Tidak dapat terhubung ke server backend.',
  },
  en: {
    // App
    appName: 'Statistika Pro',
    appTagline: 'Professional Statistical Analysis',

    // Header
    newProject: 'New Project',
    saved: 'Saved',
    unsaved: 'Unsaved',
    saving: 'Saving...',
    backendOnline: 'Backend Online',
    backendOffline: 'Backend Offline',
    backendLocal: 'Local Mode Ready',
    backendChecking: 'Checking...',
    language: 'Language',

    // Menu
    dashboard: 'Dashboard',
    dataEditor: 'Data Editor',
    variableView: 'Variable View',
    analysis: 'Statistical Analysis',
    output: 'Output Viewer',
    reports: 'Reports',
    settings: 'Settings',

    // Dashboard
    welcomeTitle: 'Welcome to Statistika Pro',
    welcomeSubtitle: 'Professional web-based statistical analysis platform',
    featureAvailable: 'Available Features',
    featureComingSoon: 'Coming Soon',
    quickStart: 'Quick Start',
    openDataEditor: 'Open Data Editor',
    statusTitle: 'Service Status',
    apiStatus: 'API Backend',

    // Data Editor
    dataEditorTitle: 'Data Editor',
    dataEditorSubtitle: 'Enter and manage your statistical data',
    addRow: 'Add Row',
    addColumn: 'Add Column',
    deleteRow: 'Delete Row',
    clearData: 'Clear All',
    importData: 'Import Data',
    exportData: 'Export Data',
    rows: 'rows',
    columns: 'columns',
    cell: 'Cell',
    noData: 'No data yet. Click "Add Row" to get started.',
    columnName: 'Column Name',
    enterValue: 'Enter value...',

    // Coming Soon
    comingSoonTitle: 'Coming Soon',
    comingSoonDesc: 'This feature is under development and will be available in the next version.',
    comingSoonFeatures: 'Planned Features',

    // Errors
    errorTitle: 'An Error Occurred',
    retryButton: 'Retry',
    connectionError: 'Cannot connect to backend server.',
  },
} as const

export type TranslationKey = keyof typeof translations.id
