import type { ReactNode } from 'react'
import type { AssemblyConstituency, OfficialProfile, WardCardData } from './authorityTypes'
import type { WardProperties } from './wardTypes'

type WardInfoPanelProps = {
  ward: WardProperties | null
  authorityData: WardCardData | null
  authorityStatus: 'loading' | 'ready' | 'error'
  wardSourceUrl: string
  onDeselect: () => void
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="source-anchor" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
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

function AssemblyTile({ assembly }: { assembly: AssemblyConstituency }) {
  return (
    <div className="gov-tile gov-tile--ac">
      <div className="gov-tile__ac-head">
        <span className="ac-badge">AC {assembly.number}</span>
        <strong className="gov-tile__name">{assembly.name}</strong>
      </div>
      <p className="gov-tile__mla">
        <span className="mla-label">MLA:</span> {assembly.mla.name}
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
  wardSourceUrl,
  onDeselect,
}: WardInfoPanelProps) {
  if (!ward) {
    return (
      <aside className="ward-card ward-card--empty" aria-live="polite">
        <div className="ward-card__header-tag">Interactive Ward Explorer</div>
        <h1 className="empty-title">Select any ward in Chennai</h1>
        <p className="empty-desc">
          Click any ward polygon to inspect its zone boundaries, elected municipal councillor, GCC zonal administration, and Assembly constituency.
        </p>
      </aside>
    )
  }

  const wardNumber = Number.parseInt(ward.ward.trim(), 10)
  const wardProfile = authorityData?.wardsByNumber.get(wardNumber)
  const councillor = authorityData?.councillorsByWard.get(wardNumber)
  const zoneProfile = authorityData?.zonesByNumber.get(wardProfile?.zone.number ?? Number(ward.zone))
  const zoneName = wardProfile?.zone.name || `Zone ${ward.zone}`
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

  return (
    <aside className="ward-card" aria-live="polite">
      {/* 1. Header Banner */}
      <div className="ward-card__hero">
        <div className="ward-card__hero-meta">
          <span className="zone-pill">{zoneName}</span>
          {ward.region && <span className="region-pill">{ward.region} Region</span>}
        </div>
        <div className="ward-card__title-row">
          <div className="ward-card__title-wrap">
            <h1 className="ward-card__number">Ward {ward.ward}</h1>
            {candidateName && <p className="ward-card__locality">{candidateName}</p>}
          </div>
          <button className="ward-card__close-btn" type="button" onClick={onDeselect} aria-label="Deselect ward">
            ✕
          </button>
        </div>
        {wardProfile?.nameConfirmed === 'no' && (
          <p className="unconfirmed-notice">* Candidate locality label; official GCC ward title pending confirmation.</p>
        )}
      </div>

      {/* 2. Primary Tier: Ward Councillor */}
      <section className="councillor-block" aria-labelledby="councillor-heading">
        <div className="section-eyebrow" id="councillor-heading">
          Elected Councillor
        </div>

        {authorityStatus === 'loading' && <p className="tier-status-text">Retrieving councillor records…</p>}

        {authorityStatus === 'ready' && (
          <>
            {councillorIsActive ? (
              <div className="councillor-profile">
                {councillor?.photoSourceUrl ? (
                  <img
                    className="councillor-profile__avatar"
                    src={councillor.photoSourceUrl}
                    alt={`${councillor.name}, Councillor for Ward ${ward.ward}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="councillor-profile__avatar-fallback" aria-hidden="true">
                    👤
                  </div>
                )}
                <div className="councillor-profile__info">
                  <strong className="councillor-profile__name">{councillor?.name}</strong>
                  <span className="councillor-profile__badge">GCC Ward Representative</span>
                </div>
              </div>
            ) : (
              <div className="councillor-status-card">
                <span className="status-indicator"></span>
                <span>
                  {councillor?.status === 'vacant'
                    ? 'Seat marked Vacant in the GCC directory'
                    : councillor?.status === 'unknown'
                      ? 'No councillor entry listed by GCC'
                      : 'Councillor record currently unavailable'}
                </span>
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

            {councillor?.sourceUrl && (
              <div className="source-wrap">
                <SourceLink href={councillor.sourceUrl}>GCC Council Directory Snapshot ↗</SourceLink>
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Secondary Tier: Zone Administration */}
      <section className="admin-block" aria-labelledby="zone-admin-heading">
        <div className="section-eyebrow" id="zone-admin-heading">
          {zoneName} Administration
        </div>
        <div className="admin-grid">
          <OfficerTile
            roleTitle="Committee Chairman"
            official={zoneProfile?.wardCommitteeChairman ?? null}
            sourceUrl={zoneProfile?.sourceUrl}
          />
          <OfficerTile
            roleTitle="Zonal Officer (GCC)"
            official={zoneProfile?.zonalOfficer ?? null}
            fallbackNote={zoneProfile?.zonalOfficerStatus === 'not_listed_on_GCC_page' ? 'Not listed by GCC' : undefined}
            sourceUrl={zoneProfile?.sourceUrl}
          />
        </div>
      </section>

      {/* 4. Legislative Tier: Assembly & MLA */}
      <section className="assembly-block" aria-labelledby="assembly-heading">
        <div className="section-eyebrow" id="assembly-heading">
          Assembly Constituency & MLA
        </div>
        {assemblies.length > 0 ? (
          <div className="assembly-list">
            {assemblies.map((assembly) => (
              <AssemblyTile key={assembly.number} assembly={assembly} />
            ))}
          </div>
        ) : (
          <div className="unmapped-ac-banner">
            <span className="unmapped-ac-banner__tag">AC Link Unmapped</span>
            <p>GCC’s 2025 GIS records currently lack an official ward-to-Assembly mapping for this ward.</p>
          </div>
        )}
      </section>

      {/* 5. Footer info */}
      <footer className="card-footer">
        <span>Ward ID: {ward.ward_id}</span>
        <span className="bullet-sep">·</span>
        <SourceLink href={wardSourceUrl}>GCC 2025 Layer ↗</SourceLink>
      </footer>
    </aside>
  )
}
