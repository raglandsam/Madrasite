export type AppLanguage = 'en' | 'ta'

export const ZONE_NAMES_TA: Record<number, string> = {
  1: 'திருவொற்றியூர்',
  2: 'மணலி',
  3: 'மாதவரம்',
  4: 'தண்டையார்பேட்டை',
  5: 'இராயபுரம்',
  6: 'திரு. வி. க. நகர்',
  7: 'அம்பத்தூர்',
  8: 'அண்ணா நகர்',
  9: 'தேனாம்பேட்டை',
  10: 'கோடம்பாக்கம்',
  11: 'வளசரவாக்கம்',
  12: 'ஆலந்தூர்',
  13: 'அடையாறு',
  14: 'பெருங்குடி',
  15: 'சோழிங்கநல்லூர்',
}

export const REGION_NAMES_TA: Record<string, string> = {
  North: 'வடக்கு',
  Central: 'மத்திய',
  South: 'தெற்கு',
}

export const I18N_STRINGS = {
  en: {
    brandSubtitle: 'Chennai Ward & Civic Map',
    statusPill: '200 GCC Wards • 15 Zones',
    themeLight: 'Light',
    themeDark: 'Dark',
    returnToChennai: 'Return to Chennai',
    langToggle: 'தமிழ்',
    langToggleTitle: 'Switch to Tamil (தமிழில் பார்க்க)',

    // Ward Card Empty State
    emptyHeaderTag: 'Interactive Ward Explorer',
    emptyTitle: 'Select any ward in Chennai',
    emptyDesc:
      'Click any ward polygon to inspect its zone boundaries, elected municipal councillor, GCC zonal administration, and Assembly constituency.',

    // Ward Card Details
    wardPrefix: 'Ward',
    zonePrefix: 'Zone',
    regionSuffix: 'Region',
    candidateNotice: '* Candidate locality label; official GCC title pending confirmation.',
    councillorSection: 'Elected Councillor',
    councillorRole: 'GCC Ward Representative',
    retrievingRecords: 'Retrieving councillor records…',
    vacantSeat: 'Seat marked Vacant in GCC directory',
    unknownCouncillor: 'No councillor entry listed by GCC',
    unavailableCouncillor: 'Councillor record currently unavailable',
    adminSectionSuffix: 'Administration',
    chairmanRole: 'Committee Chairman',
    zonalOfficerRole: 'Zonal Officer (GCC)',
    notListedGcc: 'Not listed by GCC',
    assemblySection: 'Assembly Constituency & MLA',
    mlaPrefix: 'MLA:',
    unmappedAcTag: 'AC Link Unmapped',
    unmappedAcDesc: 'GCC’s 2025 GIS records currently lack an official ward-to-Assembly mapping for this ward.',

    // Map Status
    loadingBoundaries: 'Loading validated ward boundaries…',
    mapUnavailable: 'Map unavailable.',
  },
  ta: {
    brandSubtitle: 'சென்னை வார்டு & குடிமை வரைபடம்',
    statusPill: '200 ஜிசிசி வார்டுகள் • 15 மண்டலங்கள்',
    themeLight: 'வெளிச்சம்',
    themeDark: 'இருள்',
    returnToChennai: 'சென்னைக்குத் திரும்பு',
    langToggle: 'English',
    langToggleTitle: 'ஆங்கிலத்திற்கு மாற (Switch to English)',

    // Ward Card Empty State
    emptyHeaderTag: 'ஊடாடும் வார்டு வழிகாட்டி',
    emptyTitle: 'சென்னையின் ஏதேனும் ஒரு வார்டைத் தேர்ந்தெடுக்கவும்',
    emptyDesc:
      'மண்டல எல்லைகள், தேர்ந்தெடுக்கப்பட்ட மாமன்ற உறுப்பினர், ஜிசிசி மண்டல நிர்வாகம் மற்றும் சட்டமன்றத் தொகுதியைக் காண வரைபடத்தில் உள்ள வார்டைக் கிளிக் செய்யவும்.',

    // Ward Card Details
    wardPrefix: 'வார்டு',
    zonePrefix: 'மண்டலம்',
    regionSuffix: 'பிராந்தியம்',
    candidateNotice: '* உத்தேசப் பகுதிப் பெயர்; அதிகாரப்பூர்வ ஜிசிசி பெயர் உறுதிப்படுத்தப்பட வேண்டியுள்ளது.',
    councillorSection: 'தேர்ந்தெடுக்கப்பட்ட மாமன்ற உறுப்பினர்',
    councillorRole: 'ஜிசிசி வார்டு பிரதிநிதி',
    retrievingRecords: 'மாமன்ற உறுப்பினர் விவரங்கள் பெறப்படுகின்றன…',
    vacantSeat: 'ஜிசிசி பதிவேட்டில் காலியிடம் எனக் குறிப்பிடப்பட்டுள்ளது',
    unknownCouncillor: 'ஜிசிசி பதிவேட்டில் விவரம் இல்லை',
    unavailableCouncillor: 'மாமன்ற உறுப்பினர் விவரம் தற்போது கிடைக்கவில்லை',
    adminSectionSuffix: 'நிர்வாகம்',
    chairmanRole: 'வார்டு நிலைக்குழு தலைவர்',
    zonalOfficerRole: 'மண்டல அலுவலர் (ஜிசிசி)',
    notListedGcc: 'ஜிசிசியால் பட்டியலிடப்படவில்லை',
    assemblySection: 'சட்டமன்றத் தொகுதி & எம்.எல்.ஏ',
    mlaPrefix: 'எம்.எல்.ஏ:',
    unmappedAcTag: 'தொகுதி இணைப்பு நிலுவையில் உள்ளது',
    unmappedAcDesc: 'ஜிசிசியின் 2025 வரைபடத் தரவுகளில் இந்த வார்டுக்கான அதிகாரப்பூர்வ சட்டமன்றத் தொகுதி இணைப்பு இன்னும் வழங்கப்படவில்லை.',

    // Map Status
    loadingBoundaries: 'சரிபார்க்கப்பட்ட வார்டு எல்லைகள் ஏற்றப்படுகின்றன…',
    mapUnavailable: 'வரைபடம் கிடைக்கவில்லை.',
  },
} as const

