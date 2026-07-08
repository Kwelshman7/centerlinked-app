/** Shared payer matching logic for app + backfill script. */

export function normalizePayerName(raw) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/['']/g, "'")
    .replace(/[^\w\s&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCompact(raw) {
  return normalizePayerName(raw).replace(/\s+/g, "");
}

/** Contract labels that are not real payers — skip linking. */
export function isNonPayerLabel(name) {
  const n = normalizePayerName(name);
  return [
    "out-of-network only",
    "out of network only",
    "most commercial insurance plans",
    "most commercial insurance",
    "all commercial insurance",
    "private pay",
    "self pay",
    "self-pay",
    "self-pay / private pay",
    "no insurance",
    "n/a",
    "none",
  ].includes(n);
}

/**
 * Known free-text contract labels -> canonical payer.name in master list.
 * Keys are normalizePayerName() form.
 */
export const CONTRACT_TO_PAYER = {
  bcbs: "Blue Cross Blue Shield Association",
  "blue cross blue shield": "Blue Cross Blue Shield Association",
  "horizon bcbs": "Horizon Blue Cross Blue Shield of New Jersey",
  horizon: "Horizon Blue Cross Blue Shield of New Jersey",
  "anthem bcbs": "Anthem Blue Cross Blue Shield",
  "anthem/elevance": "Elevance Health",
  anthem: "Anthem Blue Cross Blue Shield",
  carefirst: "CareFirst BlueCross BlueShield",
  magellan: "Magellan Health",
  "magellan health": "Magellan Health",
  optum: "Optum Behavioral Health",
  "optum behavioral health": "Optum Behavioral Health",
  beacon: "Beacon Health Options",
  "beacon health options": "Beacon Health Options",
  "value options": "Beacon Health Options",
  "united healthcare": "UnitedHealthcare",
  united: "UnitedHealthcare",
  umr: "UMR (UnitedHealthcare)",
  tricare: "Tricare",
  "tricare east": "Tricare East (Humana Military)",
  "tricare east (humana military)": "Tricare East (Humana Military)",
  "first health": "First Health Network",
  "first choice": "First Health Network",
  "empire bcbs": "Empire Blue Cross Blue Shield",
  "va community care network": "VA Community Care Network",
  "va ccn": "Optum VA CCN",
  va: "VA Community Care Network",
  "cigna behavioral health": "Cigna Behavioral Health (Evernorth)",
  evernorth: "Evernorth Health Services",
  "health first health plans": "Healthfirst",
  "harvard pilgrim healthcare": "Harvard Pilgrim Health Care",
  "harvard pilgrim health care": "Harvard Pilgrim Health Care",
  "medical mutual": "Medical Mutual of Ohio",
  "mvp": "MVP Health Care",
  "amerihealth": "AmeriHealth",
  ambetter: "Ambetter (Centene)",
  "multiplan": "MultiPlan",
  "kaiser permanente": "Kaiser Permanente",
  medicaid: "Medicaid",
  medicare: "Medicare",
  "molina healthcare": "Molina Healthcare",
  "molina": "Molina Healthcare",
  "healthpartners": "HealthPartners",
  "united behavioral health": "United Behavioral Health",
  "wellcare": "WellCare",
  "geha": "GEHA",
  "meritain health": "Meritain Health",
  "meritain": "Meritain Health",
  "compsych": "ComPsych",
  "lifeworks (morneau shepell)": "LifeWorks (Morneau Shepell)",
  "lifeworks": "LifeWorks (Morneau Shepell)",
  "health net": "Health Net",
  "healthnet": "Health Net",
  "highmark": "Highmark Blue Cross Blue Shield",
  "florida blue": "Florida Blue",
  "independence blue cross": "Independence Blue Cross",
  "premera blue cross": "Premera Blue Cross",
  "regence blueshield": "Regence BlueShield",
  "wellmark blue cross blue shield": "Wellmark Blue Cross Blue Shield",
  "wellmark": "Wellmark Blue Cross Blue Shield",
  "capital bluecross": "Capital BlueCross",
  "excellus bluecross blueshield": "Excellus BlueCross BlueShield",
  "point32health": "Point32Health",
  "tufts health plan": "Tufts Health Plan",
  "tufts": "Tufts Health Plan",
  "oscar health": "Oscar Health",
  "oscar": "Oscar Health",
  "devoted health": "Devoted Health",
  "bright healthcare": "Bright HealthCare",
  "clover health": "Clover Health",
  "centene": "Centene Corporation",
  "caresource": "CareSource",
  "amerigroup": "Amerigroup",
  "champva": "CHAMPVA",
  "indian health service": "Indian Health Service",
  "phcs network": "PHCS Network",
  "phcs": "PHCS Network",
  "trustmark": "Trustmark",
  "luminare health (trustmark)": "Luminare Health (Trustmark)",
  "carelon behavioral health": "Carelon Behavioral Health",
  "carelon": "Carelon Behavioral Health",
  "new directions behavioral health": "New Directions Behavioral Health",
  "mhn (health net behavioral health)": "MHN (Health Net Behavioral Health)",
  "mhn": "MHN (Health Net Behavioral Health)",
  "spring health": "Spring Health",
  "modern health": "Modern Health",
  "lyra health": "Lyra Health",
  "upmc health plan": "UPMC Health Plan",
  "upmc": "UPMC Health Plan",
  "geisinger health plan": "Geisinger Health Plan",
  "geisinger": "Geisinger Health Plan",
  "providence health plan": "Providence Health Plan",
  "scan health plan": "SCAN Health Plan",
  "selecthealth": "SelectHealth",
  "paramount health care": "Paramount Health Care",
  "sharp health plan": "Sharp Health Plan",
  "simply healthcare": "Simply Healthcare",
  "sunshine health": "Sunshine Health",
  "peach state health plan": "Peach State Health Plan",
  "buckeye health plan": "Buckeye Health Plan",
  "countycare health plan": "CountyCare Health Plan",
  "l a care health plan": "L.A. Care Health Plan",
  "la care health plan": "L.A. Care Health Plan",
  "partnership healthplan of california": "Partnership HealthPlan of California",
  "inland empire health plan (iehp)": "Inland Empire Health Plan (IEHP)",
  iehp: "Inland Empire Health Plan (IEHP)",
  "triwest healthcare alliance": "TriWest Healthcare Alliance",
  "triwest": "TriWest Healthcare Alliance",
  "tricare west (health net federal services)": "Tricare West (Health Net Federal Services)",
  "allied benefit systems": "Allied Benefit Systems",
  "allied trades": "Allied Benefit Systems",
  "alignment health plan": "Alignment Health Plan",
  "emblemhealth": "EmblemHealth",
  "fidelis care": "Fidelis Care",
  "healthsmart": "HealthSmart",
  "independent health": "Independent Health",
  "meridian health plan": "Meridian Health Plan",
  "moda health": "Moda Health",
  "pacificsource health plans": "PacificSource Health Plans",
  "caloptima": "CalOptima",
  "wellpoint": "Wellpoint",
  "united health group": "UnitedHealthcare",
  "optumserv": "Optum VA CCN",
  "optumserve": "Optum VA CCN",
  "quest behavioral": "Quest Behavioral Health",
  "quest behavioral health": "Quest Behavioral Health",
  "magnacare": "MagnaCare",
  "avmed": "AvMed",
  "zelis": "Zelis",
  "three rivers provider network": "Three Rivers Provider Network",
  "american behavioral": "American Behavioral",
  "nyship": "Empire Blue Cross Blue Shield",
  "pnoa": "Provider Network of America",
  "provider network of america": "Provider Network of America",
};

export function contractNameVariants(payerName) {
  const trimmed = payerName.trim();
  const variants = new Set([trimmed]);
  for (const part of trimmed.split(/[/&,]+/)) {
    const p = part.trim();
    if (p) variants.add(p);
  }
  return Array.from(variants);
}

export function getPayerMatchTerms(payer) {
  const terms = new Set();
  for (const raw of [payer.name, ...(payer.aliases ?? [])]) {
    if (!raw?.trim()) continue;
    terms.add(normalizePayerName(raw));
    terms.add(normalizeCompact(raw));
    terms.add(raw.trim().toLowerCase());
  }
  return Array.from(terms);
}

export function contractMatchesPayer(contract, payer) {
  if (contract.payer_id && contract.payer_id === payer.id) return true;

  const contractNorm = normalizePayerName(contract.payer_name);
  if (!contractNorm) return false;

  const terms = getPayerMatchTerms(payer);
  if (terms.includes(contractNorm) || terms.includes(normalizeCompact(contract.payer_name))) {
    return true;
  }

  const contractCompact = normalizeCompact(contract.payer_name);
  const payerCompact = normalizeCompact(payer.name);
  if (contractCompact && payerCompact) {
    if (contractCompact === payerCompact) return true;
    if (contractCompact.length >= 5 && payerCompact.includes(contractCompact)) return true;
    if (payerCompact.length >= 5 && contractCompact.includes(payerCompact)) return true;
  }

  const payerNorm = normalizePayerName(payer.name);
  if (payerNorm.length >= 4 && contractNorm.includes(payerNorm)) return true;
  if (contractNorm.length >= 4 && payerNorm.includes(contractNorm)) return true;

  for (const alias of payer.aliases ?? []) {
    const aliasNorm = normalizePayerName(alias);
    if (!aliasNorm || aliasNorm.length < 4) continue;
    if (contractNorm.includes(aliasNorm) || aliasNorm.includes(contractNorm)) return true;
  }

  return false;
}

export function findPayerByName(name, payers) {
  const norm = normalizePayerName(name);
  const compact = normalizeCompact(name);
  return (
    payers.find((p) => normalizePayerName(p.name) === norm) ??
    payers.find((p) => normalizeCompact(p.name) === compact) ??
    null
  );
}

export function resolvePayerForContractName(payerName, payers) {
  const trimmed = payerName.trim();
  if (!trimmed || isNonPayerLabel(trimmed)) return null;

  for (const variant of contractNameVariants(trimmed)) {
    const key = normalizePayerName(variant);
    const mapped = CONTRACT_TO_PAYER[key];
    if (mapped) {
      const byName = findPayerByName(mapped, payers);
      if (byName) return byName;
    }
  }

  for (const variant of contractNameVariants(trimmed)) {
    for (const payer of payers) {
      if (contractMatchesPayer({ payer_name: variant }, payer)) return payer;
    }
  }

  return null;
}

export function resolvePayer(contract, payers) {
  return resolvePayerForContractName(contract.payer_name, payers);
}
