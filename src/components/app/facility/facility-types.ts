export const LEVELS_OF_CARE = [
  "Detox",
  "Residential",
  "PHP",
  "IOP",
  "Outpatient",
  "Sober Living",
  "MAT",
  "Dual Diagnosis",
] as const;

// Amenities — physical facility features & on-site offerings
export const HIGHLIGHT_OPTIONS = [
  "Private rooms",
  "Shared rooms",
  "Pool",
  "Gym / Fitness Training",
  "Ocean view",
  "Mountain view",
  "Chef-prepared meals",
  "Pet friendly",
  "Acupuncture",
  "Massage therapy",
  "Yoga",
  "Meditation",
  "Offsite activities",
  "Transportation provided",
  "Laundry service",
  "Wi-Fi",
  "Smoking permitted",
] as const;

export const POPULATION_OPTIONS = [
  "Adults (18+)",
  "Young Adults",
  "Adolescents",
  "Professionals",
  "First Responders",
  "Veterans",
  "LGBTQ+",
  "Women",
  "Men",
] as const;

// Type of Therapy — clinical modalities & specializations
export const SPECIALIZATION_OPTIONS = [
  "EMDR",
  "CBT",
  "DBT",
  "Trauma-Informed",
  "12-Step",
  "Holistic Therapies",
  "Equine Therapy",
  "Art Therapy",
  "Music Therapy",
  "Family Therapy",
  "Group Therapy",
  "Individual Therapy",
  "MAT",
  "Dual Diagnosis",
  "Co-Occurring Disorders",
  "PTSD",
  "Anxiety",
  "Depression",
  "Eating Disorders",
  "Process Addictions",
] as const;

// Accreditations & certifications
export const ACCREDITATION_OPTIONS = [
  "JCAHO (Joint Commission)",
  "CARF Accredited",
  "LegitScript Certified",
  "FARR Certified",
  "NAATP Member",
  "State Licensed",
  "DCF Licensed",
  "NABH Member",
] as const;

export interface FacilityContractDraft {
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
  pending?: boolean;
}

export interface FacilityDraft {
  name: string;
  tagline: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  description: string;
  capacity: string;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations: string[];
  custom_highlight: string;
  image_urls: string[];
  bd_contact_name: string;
  bd_contact_phone: string;
  bd_contact_email: string;
  contracts: FacilityContractDraft[];
}

export const emptyFacility = (): FacilityDraft => ({
  name: "",
  tagline: "",
  address_line1: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  website: "",
  description: "",
  capacity: "",
  levels_of_care: [],
  highlights: [],
  population_served: [],
  specializations: [],
  accreditations: [],
  custom_highlight: "",
  image_urls: [],
  bd_contact_name: "",
  bd_contact_phone: "",
  bd_contact_email: "",
  contracts: [],
});
