import type { AssemblyConstituency, OfficialProfile, WardCardData } from './authorityTypes'
import { I18N_STRINGS, REGION_NAMES_TA, ZONE_NAMES_TA, type AppLanguage } from './i18n'
import type { WardProperties } from './wardTypes'

type WardInfoPanelProps = {
  ward: WardProperties | null
  authorityData: WardCardData | null
  authorityStatus: 'loading' | 'ready' | 'error'
  wardSourceUrl: string
  lang?: AppLanguage
  onDeselect?: () => void
}

function PhoneIcon() {
  return (
    <svg className="contact-pill__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="contact-pill__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function AvatarSilhouette() {
  return (
    <svg className="avatar-silhouette-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function PhoneAction({ phone }: { phone: string }) {
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  return (
    <a className="contact-pill contact-pill--call" href={`tel:${cleanPhone}`}>
      <PhoneIcon />
      <span className="contact-pill__text">{phone}</span>
    </a>
  )
}

function EmailAction({ email }: { email: string }) {
  return (
    <a className="contact-pill contact-pill--email" href={`mailto:${email}`}>
      <MailIcon />
      <span className="contact-pill__text">{email}</span>
    </a>
  )
}

function OfficerTile({
  roleTitle,
  official,
  fallbackNote,
  sourceUrl,
}: {
  roleTitle: string
  official: OfficialProfile | null
  fallbackNote?: string
  sourceUrl?: string | null
}) {
  return (
    <div className="gov-tile">
      <span className="gov-tile__role">{roleTitle}</span>
      {official ? (
        <>
          <p className="gov-tile__name">{official.name}</p>
          {(official.phones.length > 0 || official.email) && (
            <div className="gov-tile__contacts">
              {official.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="tile-contact-link">
                  {phone}
                </a>
              ))}
              {official.email && (
                <a href={`mailto:${official.email}`} className="tile-contact-link">
                  {official.email}
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="gov-tile__empty">{fallbackNote ?? 'Not listed by GCC'}</p>
      )}
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="gov-tile__source">
          GCC Directory
        </a>
      )}
    </div>
  )
}

function AssemblyTile({
  assembly,
  mlaPrefix,
}: {
  assembly: AssemblyConstituency
  mlaPrefix: string
}) {
  return (
    <div className="gov-tile gov-tile--ac">
      <div className="gov-tile__ac-head">
        <span className="ac-badge">AC {assembly.number}</span>
        <strong className="gov-tile__name">{assembly.name}</strong>
      </div>
      <p className="gov-tile__mla">
        <span className="mla-label">{mlaPrefix}</span> {assembly.mla.name}
      </p>
      <div className="gov-tile__ac-meta">
        <span className="ac-party-tag">{assembly.mla.party}</span>
        <a href={assembly.sourceUrl} target="_blank" rel="noreferrer" className="gov-tile__source">
          ECI Result
        </a>
      </div>
    </div>
  )
}

export function WardInfoPanel({
  ward,
  authorityData,
  authorityStatus,
  lang = 'en',
}: WardInfoPanelProps) {
  const t = I18N_STRINGS[lang]

  if (!ward) {
    return (
      <aside className="ward-card ward-card--empty" aria-live="polite">
        <div className="ward-card__header-tag">{t.emptyHeaderTag}</div>
        <h1 className="empty-title">{t.emptyTitle}</h1>
        <p className="empty-desc">{t.emptyDesc}</p>
      </aside>
    )
  }

  const wardNumber = Number.parseInt(ward.ward.trim(), 10)
  const wardProfile = authorityData?.wardsByNumber.get(wardNumber)
  const councillor = authorityData?.councillorsByWard.get(wardNumber)
  const zoneProfile = authorityData?.zonesByNumber.get(wardProfile?.zone.number ?? Number(ward.zone))

  const zoneNumber = wardProfile?.zone.number ?? Number(ward.zone)
  const zoneNameTa = ZONE_NAMES_TA[zoneNumber]
  const zoneLabel =
    lang === 'ta' && zoneNameTa
      ? `${t.zonePrefix} ${zoneNumber} (${zoneNameTa})`
      : wardProfile?.zone.name || `${t.zonePrefix} ${ward.zone}`

  const regionLabel = ward.region
    ? lang === 'ta' && REGION_NAMES_TA[ward.region]
      ? `${REGION_NAMES_TA[ward.region]} ${t.regionSuffix}`
      : `${ward.region} ${t.regionSuffix}`
    : null

  const candidateName = wardProfile?.name
    ? wardProfile.name + (wardProfile.nameConfirmed === 'no' ? '*' : '')
    : null

  const linkedAssemblies = (wardProfile?.assemblyConstituencies ?? [])
    .map((link) => authorityData?.assembliesByNumber.get(link.number) ?? null)
    .filter((assembly): assembly is AssemblyConstituency => assembly !== null)

  const rawAcNumber = Number.parseInt((ward.ac_no ?? '').trim(), 10)
  const fallbackAssembly =
    linkedAssemblies.length === 0 && Number.isFinite(rawAcNumber)
      ? authorityData?.assembliesByNumber.get(rawAcNumber) ?? null
      : null
  const assemblies = fallbackAssembly ? [fallbackAssembly] : linkedAssemblies
  const councillorIsActive = councillor?.status === 'active' && Boolean(councillor.name)

  const wardNum = ward.ward.trim()
  const wardHeading = candidateName ? `${t.wardPrefix} ${wardNum}: ${candidateName}` : `${t.wardPrefix} ${wardNum}`

  return (
    <aside className="ward-card" aria-live="polite">
      {/* 1. Header: Zone metadata and unified Ward ID + Ward Name title */}
      <div className="ward-card__hero">
        <div className="ward-card__hero-meta">
          <span className="zone-pill">{zoneLabel}</span>
          {regionLabel && <span className="region-pill">{regionLabel}</span>}
        </div>
        <h1 className="ward-title">{wardHeading}</h1>
        {wardProfile?.nameConfirmed === 'no' && (
          <p className="unconfirmed-notice">{t.candidateNotice}</p>
        )}
      </div>

      {/* 2. Primary Tier: Elected Councillor with circular photo */}
      <section className="councillor-block" aria-labelledby="councillor-heading">
        <div className="section-eyebrow" id="councillor-heading">
          {t.councillorSection}
        </div>

        {authorityStatus === 'loading' && <p className="tier-status-text">{t.retrievingRecords}</p>}

        {authorityStatus === 'ready' && (
          <>
            {councillorIsActive ? (
              <div className="councillor-profile">
                {councillor?.photoSourceUrl ? (
                  <img
                    className="councillor-photo"
                    src={councillor.photoSourceUrl}
                    alt={`${councillor.name}, Councillor for Ward ${ward.ward}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="councillor-avatar-fallback" aria-hidden="true">
                    <AvatarSilhouette />
                  </div>
                )}
                <div className="councillor-info">
                  <strong className="councillor-name">{councillor?.name}</strong>
                  <span className="councillor-tagline">{t.councillorRole}</span>
                </div>
              </div>
            ) : (
              <div className="vacant-notice">
                {councillor?.status === 'vacant'
                  ? t.vacantSeat
                  : councillor?.status === 'unknown'
                    ? t.unknownCouncillor
                    : t.unavailableCouncillor}
              </div>
            )}

            {/* Quick Action Contact Pills */}
            {councillor && (councillor.phones.length > 0 || councillor.email) && (
              <div className="councillor-actions">
                {councillor.phones.map((phone) => (
                  <PhoneAction key={phone} phone={phone} />
                ))}
                {councillor.email && <EmailAction email={councillor.email} />}
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Secondary Tier: Zone Administration */}
      <section className="admin-block" aria-labelledby="zone-admin-heading">
        <div className="section-eyebrow" id="zone-admin-heading">
          {zoneLabel} {t.adminSectionSuffix}
        </div>
        <div className="admin-grid">
          <OfficerTile
            roleTitle={t.chairmanRole}
            official={zoneProfile?.wardCommitteeChairman ?? null}
            sourceUrl={zoneProfile?.sourceUrl}
          />
          <OfficerTile
            roleTitle={t.zonalOfficerRole}
            official={zoneProfile?.zonalOfficer ?? null}
            fallbackNote={zoneProfile?.zonalOfficerStatus === 'not_listed_on_GCC_page' ? t.notListedGcc : undefined}
            sourceUrl={zoneProfile?.sourceUrl}
          />
        </div>
      </section>

      {/* 4. Legislative Tier: Assembly & MLA */}
      <section className="assembly-block" aria-labelledby="assembly-heading">
        <div className="section-eyebrow" id="assembly-heading">
          {t.assemblySection}
        </div>
        {assemblies.length > 0 ? (
          <div className="assembly-list">
            {assemblies.map((assembly) => (
              <AssemblyTile key={assembly.number} assembly={assembly} mlaPrefix={t.mlaPrefix} />
            ))}
          </div>
        ) : (
          <div className="unmapped-ac-banner">
            <span className="unmapped-ac-banner__tag">{t.unmappedAcTag}</span>
            <p>{t.unmappedAcDesc}</p>
          </div>
        )}
      </section>
    </aside>
  )
}
