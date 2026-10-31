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

function PhoneAction({ phone }: { phone: string }) {
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  return (
    <a className="contact-pill contact-pill--call" href={`tel:${cleanPhone}`}>
      <span className="contact-pill__icon" aria-hidden="true">📞</span>
      <span className="contact-pill__text">{phone}</span>
    </a>
  )
}

function EmailAction({ email }: { email: string }) {
  return (
    <a className="contact-pill contact-pill--email" href={`mailto:${email}`}>
      <span className="contact-pill__icon" aria-hidden="true">✉️</span>
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
                    👤
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
