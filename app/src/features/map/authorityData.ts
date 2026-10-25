import { MAP_CONFIG } from './mapConfig'
import type {
  AssemblyConstituency,
  CouncillorProfile,
  WardCardData,
  WardProfile,
  ZoneProfile,
} from './authorityTypes'

type RecordsFile<T> = { records: T[] }
type WardsFile = { wards: WardProfile[] }

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Authority data request failed: ' + response.status)
  return response.json() as Promise<T>
}

function requireArray<T>(value: unknown, field: string): T[] {
  if (!Array.isArray(value)) throw new Error('Authority dataset is missing ' + field + '.')
  return value as T[]
}

export async function fetchWardCardData(signal: AbortSignal): Promise<WardCardData> {
  const [wardsFile, councillorsFile, zonesFile, assembliesFile] = await Promise.all([
    fetchJson<WardsFile>(MAP_CONFIG.authorityDataUrls.wards, signal),
    fetchJson<RecordsFile<CouncillorProfile>>(MAP_CONFIG.authorityDataUrls.councillors, signal),
    fetchJson<RecordsFile<ZoneProfile>>(MAP_CONFIG.authorityDataUrls.zones, signal),
    fetchJson<RecordsFile<AssemblyConstituency>>(MAP_CONFIG.authorityDataUrls.assemblies, signal),
  ])

  return {
    wardsByNumber: new Map(requireArray<WardProfile>(wardsFile.wards, 'wards').map((record) => [record.wardNumber, record])),
    councillorsByWard: new Map(requireArray<CouncillorProfile>(councillorsFile.records, 'councillors').map((record) => [record.wardNumber, record])),
    zonesByNumber: new Map(requireArray<ZoneProfile>(zonesFile.records, 'zones').map((record) => [record.number, record])),
    assembliesByNumber: new Map(requireArray<AssemblyConstituency>(assembliesFile.records, 'assemblies').map((record) => [record.number, record])),
  }
}
