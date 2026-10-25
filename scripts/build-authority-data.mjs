import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const sourceDir = path.join(root, "data/authorities/source");
const canonicalDir = path.join(root, "data/authorities/canonical");
const browserDir = path.join(root, "app/public/data/authorities");
for (const dir of [sourceDir, canonicalDir, browserDir]) fs.mkdirSync(dir, { recursive: true });

const candidateText = fs.readFileSync(path.join(sourceDir, "user-supplied-ward-name-candidates.txt"), "utf8");
const nameByWard = new Map();
for (const line of candidateText.split(/\r?\n/)) {
  const match = line.match(/Ward\s+(\d+)\s*:\s*(.+?)\s*$/i);
  if (match) nameByWard.set(Number(match[1]), match[2].trim());
}
nameByWard.set(190, "Ramchandra Nagar");

const zoneNames = {
  1: "Thiruvottriyur", 2: "Manali", 3: "Madhavaram", 4: "Tondiarpet",
  5: "Royapuram", 6: "Thiru-Vi-Ka Nagar", 7: "Ambattur", 8: "Anna Nagar",
  9: "Teynampet", 10: "Kodambakkam", 11: "Valasaravakkam", 12: "Alandur",
  13: "Adyar", 14: "Perungudi", 15: "Sozhinganallur"
};
const assemblies = [
  [1,"Gummidipoondi","S. Vijayakumar","Tamilaga Vettri Kazhagam"],
  [2,"Ponneri (SC)","Dr. Ravi M. S.","Tamilaga Vettri Kazhagam"],
  [3,"Tiruttani","G. Hari","All India Anna Dravida Munnetra Kazhagam"],
  [4,"Thiruvallur","Dr. T. Arunkumar","Tamilaga Vettri Kazhagam"],
  [5,"Poonamallee (SC)","Prakasam R.","Tamilaga Vettri Kazhagam"],
  [6,"Avadi","R. Ramesh Kumar","Tamilaga Vettri Kazhagam"],
  [7,"Maduravoyal","Rhevanth Charan","Tamilaga Vettri Kazhagam"],
  [8,"Ambattur","Balamurugan G.","Tamilaga Vettri Kazhagam"],
  [9,"Madhavaram","M. L. Vijayprabhu","Tamilaga Vettri Kazhagam"],
  [10,"Tiruvottiyur","Senthil Kumar N.","Tamilaga Vettri Kazhagam"],
  [11,"Dr. Radhakrishnan Nagar","N. Marie Wilson","Tamilaga Vettri Kazhagam"],
  [12,"Perambur","C. Joseph Vijay","Tamilaga Vettri Kazhagam"],
  [13,"Kolathur","V. S. Babu","Tamilaga Vettri Kazhagam"],
  [14,"Villivakkam","Aadhav Arjuna","Tamilaga Vettri Kazhagam"],
  [15,"Thiru-Vi-Ka Nagar (SC)","M. R. Pallavi","Tamilaga Vettri Kazhagam"],
  [16,"Egmore (SC)","Rajmohan","Tamilaga Vettri Kazhagam"],
  [17,"Royapuram","K. V. Vijay Damu","Tamilaga Vettri Kazhagam"],
  [18,"Harbour","P. K. Sekarbabu","Dravida Munnetra Kazhagam"],
  [19,"Chepauk-Thiruvallikeni","Udhayanidhi Stalin","Dravida Munnetra Kazhagam"],
  [20,"Thousand Lights","Prabhakar J. C. D.","Tamilaga Vettri Kazhagam"],
  [21,"Anna Nagar","V. K. Ramkumar","Tamilaga Vettri Kazhagam"],
  [22,"Virugampakkam","Sabarinathan R.","Tamilaga Vettri Kazhagam"],
  [23,"Saidapet","Arul Prakasam M.","Tamilaga Vettri Kazhagam"],
  [24,"Thiyagarayanagar","Anand N.","Tamilaga Vettri Kazhagam"],
  [25,"Mylapore","Venkataramanan P.","Tamilaga Vettri Kazhagam"],
  [26,"Velachery","Kumar R.","Tamilaga Vettri Kazhagam"],
  [27,"Sholinganallur","ECR P. Saravanan","Tamilaga Vettri Kazhagam"],
  [28,"Alandur","M. Harish","Tamilaga Vettri Kazhagam"],
  [29,"Sriperumbudur (SC)","Thennarasu K.","Tamilaga Vettri Kazhagam"],
  [30,"Pallavaram","J. Kamatchi","Tamilaga Vettri Kazhagam"],
  [31,"Tambaram","D. Sarathkumar","Tamilaga Vettri Kazhagam"],
  [32,"Chengalpattu","S. Thiyagarajan","Tamilaga Vettri Kazhagam"]
].map(([number, name, mlaName, party]) => ({
  number, name, mla: { name: mlaName, party, electedIn: 2026 },
  sourceUrl: "https://www.eci.gov.in/eci-backend/public/all_files/election_report/General_Election_to_the_Legislative_Assembly_of_Tamil_Nadu_2026_2026/10-Detailed_Results_1778165153.pdf",
  verifiedAt: "2026-10-25"
}));

const geometry = readJson("data/wards/canonical/gcc-ward-boundaries-2025.geojson");
const features = new Map(geometry.features.map((feature) => [Number(feature.properties.ward), feature.properties]));
const wards = [];
for (let wardNumber = 1; wardNumber <= 200; wardNumber++) {
  const properties = features.get(wardNumber);
  if (!properties) throw new Error("GCC ward geometry missing ward " + wardNumber);
  const rawAcNo = String(properties.ac_no ?? "").trim();
  const acNumber = /^\d+$/.test(rawAcNo) ? Number(rawAcNo) : null;
  const assembly = acNumber ? assemblies.find((item) => item.number === acNumber) : null;
  wards.push({
    wardNumber,
    wardId: String(properties.ward_id ?? ""),
    name: nameByWard.get(wardNumber) ?? null,
    nameStatus: nameByWard.has(wardNumber) ? "candidate" : "unknown",
    nameConfirmed: nameByWard.has(wardNumber) ? "no" : null,
    nameSource: wardNumber === 190 ? "User-supplied Ward 190 description (not independently confirmed)" : "User-supplied ward-name list (candidate labels)",
    zone: {
      number: Number(properties.zone),
      name: zoneNames[Number(properties.zone)] ?? null,
      status: "confirmed",
      sourceUrl: "https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCDepts/EDPMobile2025/FeatureServer/2"
    },
    assemblyConstituencies: assembly ? [{
      number: assembly.number,
      name: assembly.name,
      mlaName: assembly.mla.name,
      party: assembly.mla.party,
      status: "confirmed_from_GCC_2025_ward_layer",
      sourceAttributeName: String(properties.ac_name ?? "").trim()
    }] : [],
    assemblyMappingStatus: assembly ? "confirmed_from_GCC_2025_ward_layer" : "unmapped_in_GCC_2025_ward_layer"
  });
}

const zoneFile = fs.readFileSync(path.join(sourceDir, "gcc-who-is-who.html"), "utf8");
const councilFile = fs.readFileSync(path.join(sourceDir, "gcc-council-address.html"), "utf8");
const clean = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const extractBlock = (html, index) => {
  const marker = 'class="row who-border-line"';
  const at = html.lastIndexOf(marker, index);
  if (at < 0) return "";
  const next = html.indexOf(marker, index + 1);
  return html.slice(at, next < 0 ? html.length : next);
};
const extractName = (block) => clean(block.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
const extractPhone = (block) => clean(block.match(/phone-icon[^>]*>\s*([^<]*)/i)?.[1] ?? "");
const extractEmail = (block) => clean(block.match(/class="email"[^>]*>\s*([^<\s]+@[^<\s]+)/i)?.[1] ?? "");
const extractPhoto = (block, base) => {
  const value = block.match(/src=["']([^"']*photo\/ward\d+\.jpg)["']/i)?.[1];
  return value ? new URL(value, base).toString() : null;
};

const councilByWard = new Map();
for (const match of councilFile.matchAll(/Councillor\s+Ward\s+(\d+)/gi)) {
  const wardNumber = Number(match[1]);
  if (councilByWard.has(wardNumber)) continue;
  const block = extractBlock(councilFile, match.index);
  const name = extractName(block);
  const status = !name ? "unknown" : /^vacant place$/i.test(name) ? "vacant" : "active";
  councilByWard.set(wardNumber, {
    wardNumber, status, name: status === "active" ? name : null,
    phones: extractPhone(block).split(/\s*\/\s*/).filter(Boolean),
    email: extractEmail(block) || null,
    photoSourceUrl: extractPhoto(block, "https://chennaicorporation.gov.in"),
    sourceUrl: "https://chennaicorporation.gov.in/gcc/council/council-address/",
    verifiedAt: "2026-10-25"
  });
}
const councillors = Array.from({ length: 200 }, (_, index) => {
  const wardNumber = index + 1;
  return councilByWard.get(wardNumber) ?? {
    wardNumber, status: "unknown", name: null, phones: [], email: null, photoSourceUrl: null,
    sourceUrl: "https://chennaicorporation.gov.in/gcc/council/council-address/",
    verifiedAt: "2026-10-25"
  };
});

const roman = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12, XIII:13, XIV:14, XV:15 };
const roleRecords = { chairmen: new Map(), officers: new Map() };
for (const match of zoneFile.matchAll(/<p[^>]*>\s*(Chairman\s+Zone\s*-\s*(\d+)\s*\(Ward Committee\))\s*<\/p>/gi)) {
  const zoneNumber = Number(match[2]);
  if (roleRecords.chairmen.has(zoneNumber)) continue;
  const block = extractBlock(zoneFile, match.index);
  roleRecords.chairmen.set(zoneNumber, { name: extractName(block), phones: extractPhone(block).split(/\s*\/\s*/).filter(Boolean), email: extractEmail(block) || null });
}
for (const match of zoneFile.matchAll(/<p[^>]*>\s*(Assistant Commissioner[^<]*Zone[^<]*)\s*<\/p>/gi)) {
  const title = clean(match[1]);
  const zoneToken = title.match(/Zone[\s-]*([IVX]+|\d+)/i)?.[1]?.toUpperCase();
  const zoneNumber = /^\d+$/.test(zoneToken ?? "") ? Number(zoneToken) : roman[zoneToken];
  if (!zoneNumber || roleRecords.officers.has(zoneNumber)) continue;
  const block = extractBlock(zoneFile, match.index);
  roleRecords.officers.set(zoneNumber, { name: extractName(block), title, phones: extractPhone(block).split(/\s*\/\s*/).filter(Boolean), email: extractEmail(block) || null });
}
const zones = Array.from({ length: 15 }, (_, index) => {
  const number = index + 1;
  const wardNumbers = wards.filter((ward) => ward.zone.number === number).map((ward) => ward.wardNumber);
  return {
    number, name: zoneNames[number], wardNumbers, status: "confirmed_from_GCC_2025_ward_layer",
    wardCommitteeChairman: roleRecords.chairmen.get(number) ?? null,
    zonalOfficer: roleRecords.officers.get(number) ?? null, zonalOfficerStatus: roleRecords.officers.has(number) ? "published_by_GCC" : "not_listed_on_GCC_page",
    sourceUrl: "https://chennaicorporation.gov.in/gcc/who-is-who/",
    verifiedAt: "2026-10-25"
  };
});

const outputs = {
  "ward-profiles.json": { schemaVersion: 1, generatedAt: "2026-10-25", source: "GCC 2025 ward layer for IDs/zones/available AC fields; supplied list for candidate locality labels", wards },
  "councillor-profiles.json": { schemaVersion: 1, generatedAt: "2026-10-25", sourceUrl: "https://chennaicorporation.gov.in/gcc/council/council-address/", records: councillors },
  "zone-profiles.json": { schemaVersion: 1, generatedAt: "2026-10-25", sourceUrl: "https://chennaicorporation.gov.in/gcc/who-is-who/", records: zones },
  "assembly-constituencies.json": { schemaVersion: 1, generatedAt: "2026-10-25", sourceUrl: "https://www.eci.gov.in/eci-backend/public/all_files/election_report/General_Election_to_the_Legislative_Assembly_of_Tamil_Nadu_2026_2026/10-Detailed_Results_1778165153.pdf", records: assemblies.map((assembly) => ({ ...assembly, wardNumbers: wards.filter((ward) => ward.assemblyConstituencies.some((link) => link.number === assembly.number)).map((ward) => ward.wardNumber), wardMappingCoverage: wards.some((ward) => ward.assemblyMappingStatus.startsWith("unmapped")) ? "partial_GCC_layer_coverage" : "complete" })) }
};
for (const [file, data] of Object.entries(outputs)) {
  const json = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(path.join(canonicalDir, file), json);
  fs.writeFileSync(path.join(browserDir, file), json);
}
const summary = {
  wardCount: wards.length, wardsWithCandidateNames: wards.filter((w) => w.nameStatus === "candidate").length,
  wardsByZone: zones.map((z) => ({ zone: z.number, wards: z.wardNumbers.length })),
  councillorStatusCounts: Object.fromEntries(["active","vacant","unknown"].map((status) => [status, councillors.filter((r) => r.status === status).length])),
  zonesWithChairman: roleRecords.chairmen.size, zonesWithOfficer: roleRecords.officers.size,
  wardsWithGccAcMapping: wards.filter((w) => w.assemblyMappingStatus.startsWith("confirmed")).length,
  wardsWithoutGccAcMapping: wards.filter((w) => w.assemblyMappingStatus.startsWith("unmapped")).length,
  assemblyRecords: assemblies.length
};
fs.writeFileSync(path.join(canonicalDir, "generation-summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));


