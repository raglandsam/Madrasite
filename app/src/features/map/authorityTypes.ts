export type WardNameStatus = 'confirmed' | 'candidate' | 'unknown'
export type ConfirmationValue = 'yes' | 'no'

export type AssemblyLink = {
  number: number
  name: string
  mlaName: string
  party: string
  status: string
  sourceAttributeName: string
}

export type WardProfile = {
  wardNumber: number
  wardId: string
  name: string | null
  nameStatus: WardNameStatus
  nameConfirmed: ConfirmationValue | null
  nameSource: string
  zone: {
    number: number
    name: string | null
    status: string
    sourceUrl: string
  }
  assemblyConstituencies: AssemblyLink[]
  assemblyMappingStatus: string
}

export type CouncillorProfile = {
  wardNumber: number
  status: 'active' | 'vacant' | 'unknown'
  name: string | null
  phones: string[]
  email: string | null
  photoSourceUrl: string | null
  sourceUrl: string
  verifiedAt: string
}

export type OfficialProfile = {
  name: string
  title?: string
  phones: string[]
  email: string | null
}

export type ZoneProfile = {
  number: number
  name: string
  wardNumbers: number[]
  status: string
  wardCommitteeChairman: OfficialProfile | null
  zonalOfficer: OfficialProfile | null
  zonalOfficerStatus: 'published_by_GCC' | 'not_listed_on_GCC_page'
  sourceUrl: string
  verifiedAt: string
}

export type AssemblyConstituency = {
  number: number
  name: string
  mla: {
    name: string
    party: string
    electedIn: number
  }
  sourceUrl: string
  verifiedAt: string
  wardNumbers: number[]
  wardMappingCoverage: string
}

export type WardCardData = {
  wardsByNumber: Map<number, WardProfile>
  councillorsByWard: Map<number, CouncillorProfile>
  zonesByNumber: Map<number, ZoneProfile>
  assembliesByNumber: Map<number, AssemblyConstituency>
}
