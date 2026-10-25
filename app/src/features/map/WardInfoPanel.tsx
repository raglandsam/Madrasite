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

function Detail({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null

  return (
    <div className="ward-detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ward-source-link" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

function ContactLinks({
  label,
  phones,
  email,
}: {
  label: string
  phones: string[]
  email: string | null
}) {
  if (phones.length === 0 && !email) return null

  return (
    <div className="ward-contact">
      <span className="ward-contact__label">{label}</span>
      <div className="ward-contact__links">
        {phones.map((phone) => (
          <a key={phone} href={'tel:' + phone.replace(/[^\d+]/g, '')}>
            {phone}
          </a>
        ))}
        {email && <a href={'mailto:' + email}>{email}</a>}
      </div>
    </div>
  )
}

function ZoneOfficial({
  heading,
  official,
}: {
  heading: string
  official: OfficialProfile | null
}) {
  if (!official) {
    return (
      <div className="ward-official">
        <span className="ward-official__role">{heading}</span>
        <p className="ward-status-note">Not listed by GCC.</p>
      </div>
    )
  }

  return (
    <div className="ward-official">
      <span className="ward-official__role">{heading}</span>
      <strong>{official.name}</strong>
      <ContactLinks label="Public contact" phones={official.phones} email={official.email} />
    </div>
  )
}

function AssemblyCard({ assembly }: { assembly: AssemblyConstituency }) {
  return (
    <div className="ward-ac-record">
      <div>
        <strong>{assembly.name}</strong>
        <span className="ward-ac-number">AC {assembly.number}</span>
      </div>
      <p>MLA: {assembly.mla.name}</p>
      <p className="ward-ac-party">{assembly.mla.party} · elected 2026</p>
      <SourceLink href={assembly.sourceUrl}>ECI result</SourceLink>
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
      <aside className="ward-panel ward-panel--empty" aria-live="polite">
        <p className="eyebrow">Ward explorer</p>
        <h1>Explore Chennai, ward by ward.</h1>
        <p>Select a ward to see its locality label and available representatives. An asterisk marks an unconfirmed ward label.</p>
      </aside>
    )
  }

  const wardNumber = Number.parseInt(ward.ward.trim(), 10)
  const wardProfile = authorityData?.wardsByNumber.get(wardNumber)
  const councillor = authorityData?.councillorsByWard.get(wardNumber)
  const zoneProfile = authorityData?.zonesByNumber.get(wardProfile?.zone.number ?? Number(ward.zone))
  const zoneName = wardProfile?.zone.name || 'Zone ' + ward.zone
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
    <aside className="ward-panel" aria-live="polite">
      <div className="ward-panel__heading">
        <div>
          <p className="eyebrow">Selected ward</p>
          <h1>Ward {ward.ward}</h1>
          {candidateName && <p className="ward-name">{candidateName}</p>}
        </div>
        <button className="icon-button" type="button" onClick={onDeselect} aria-label="Deselect ward">
          ×
        </button>
      </div>

      <section className="ward-section" aria-labelledby="ward-details-heading">
        <h2 id="ward-details-heading" className="ward-section__title">Ward details</h2>
        <dl className="ward-details">
          <Detail label="Zone">{zoneName}</Detail>
          <Detail label="Ward ID">{ward.ward_id}</Detail>
          <Detail label="Region">{ward.region}</Detail>
        </dl>
        {wardProfile?.nameConfirmed === 'no' && (
          <p className="ward-status-note">* Candidate locality label; ward name not yet confirmed.</p>
        )}
        {authorityStatus === 'error' && (
          <p className="ward-status-note">Representative records could not be loaded. The map still shows GCC ward attributes.</p>
        )}
      </section>

      <section className="ward-section" aria-labelledby="ward-councillor-heading">
        <h2 id="ward-councillor-heading" className="ward-section__title">Ward councillor</h2>
        {authorityStatus === 'loading' && <p className="ward-status-note">Loading representative details…</p>}
        {authorityStatus === 'ready' && (
          <>
            {councillor?.status === 'vacant' && <p className="ward-status-note">Marked vacant in the GCC directory.</p>}
            {councillor?.status === 'unknown' && <p className="ward-status-note">No councillor entry listed by GCC.</p>}
            {!councillor && <p className="ward-status-note">No councillor record available.</p>}
            {councillorIsActive && (
              <div className="ward-representative">
                {councillor?.photoSourceUrl && (
                  <img
                    className="ward-representative__photo"
                    src={councillor.photoSourceUrl}
                    alt={councillor.name + ', Ward ' + ward.ward + ' councillor'}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true
                    }}
                  />
                )}
                <div>
                  <strong>{councillor?.name}</strong>
                  <p className="ward-representative__role">Councillor · Ward {ward.ward}</p>
                </div>
              </div>
            )}
            {councillor && (
              <ContactLinks
                label={councillorIsActive ? 'Public contact' : 'Ward contact'}
                phones={councillor.phones}
                email={councillor.email}
              />
            )}
            {councillor?.sourceUrl && <SourceLink href={councillor.sourceUrl}>GCC councillor directory</SourceLink>}
          </>
        )}
      </section>

      <section className="ward-section" aria-labelledby="zone-representatives-heading">
        <h2 id="zone-representatives-heading" className="ward-section__title">{zoneName} representatives</h2>
        {authorityStatus === 'loading' && <p className="ward-status-note">Loading zone representatives…</p>}
        {authorityStatus === 'ready' && (
          <>
            <ZoneOfficial
              heading="Ward Committee Chairman"
              official={zoneProfile?.wardCommitteeChairman ?? null}
            />
            {zoneProfile?.zonalOfficer ? (
              <ZoneOfficial heading="Zonal Officer · GCC administration" official={zoneProfile.zonalOfficer} />
            ) : (
              <div className="ward-official">
                <span className="ward-official__role">Zonal Officer · GCC administration</span>
                <p className="ward-status-note">
                  {zoneProfile?.zonalOfficerStatus === 'not_listed_on_GCC_page'
                    ? 'Not listed by GCC.'
                    : 'Zone officer record unavailable.'}
                </p>
              </div>
            )}
            {zoneProfile?.sourceUrl && <SourceLink href={zoneProfile.sourceUrl}>GCC zone officials</SourceLink>}
          </>
        )}
      </section>

      <section className="ward-section" aria-labelledby="assembly-heading">
        <h2 id="assembly-heading" className="ward-section__title">Assembly Constituency and MLA</h2>
        {authorityStatus === 'loading' && <p className="ward-status-note">Loading Assembly Constituency details…</p>}
        {authorityStatus === 'ready' && assemblies.map((assembly) => (
          <AssemblyCard key={assembly.number} assembly={assembly} />
        ))}
        {authorityStatus === 'ready' && assemblies.length === 0 && (
          <p className="ward-status-note">
            Assembly mapping pending. GCC’s 2025 ward layer does not provide a constituency link for this ward yet.
          </p>
        )}
      </section>

      <p className="source-note">
        Ward boundaries and zone attributes: <SourceLink href={wardSourceUrl}>Greater Chennai Corporation 2025 GIS</SourceLink>.
        Representative records are static snapshots verified 25 October 2026.
      </p>
    </aside>
  )
}
