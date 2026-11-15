/** Marketing information architecture. Copy describes the product that exists. */

export type NavLink = { label: string; to: string; description: string };

export const audiences: NavLink[] = [
  {
    label: "BD reps",
    to: "/for/bd-reps",
    description:
      "Search by payer, level of care, and city, then call the business development contact on the result.",
  },
  {
    label: "Treatment programs",
    to: "/for/programs",
    description:
      "Publish levels of care, in-network contracts, and the person who answers, on a link partners can open.",
  },
  {
    label: "Multi-site organizations",
    to: "/for/organizations",
    description:
      "Keep every location, contract, and contact on one organization, with a verification state on each site.",
  },
  {
    label: "Levels of care",
    to: "/for/partners",
    description:
      "Detox, residential, PHP, IOP, and outpatient stay on the search, next to the payer.",
  },
  {
    label: "Referral sources",
    to: "/for/referral-sources",
    description:
      "Hospitals, employee assistance programs, and interventionists can look up the same fit: in network, the right level of care, and a person to call.",
  },
];

export const platform: NavLink[] = [
  {
    label: "Insurance-fit search",
    to: "/platform/search",
    description:
      "Start with the payer, the level of care, and the place. Each result leads with the person who answers.",
  },
  {
    label: "Program listings",
    to: "/platform/listings",
    description:
      "A public page for the program and the organization. Send the link when a PDF would go out of date.",
  },
  {
    label: "Monthly verification",
    to: "/platform/verification",
    description:
      "Each facility is marked fresh, recent, stale, or frozen, so a quiet listing does not look current.",
  },
  {
    label: "Contacts",
    to: "/platform/contacts",
    description: "The people you call, text, and email, kept in one list after the search.",
  },
];

export const company: NavLink[] = [
  { label: "About", to: "/about", description: "Why CenterLinked exists, and what it does not do." },
  { label: "Insights", to: "/insights", description: "Short notes on insurance fit, verification, and the person you call." },
  { label: "Partner with us", to: "/partners", description: "List a program, or search if you are the one placing people." },
  { label: "Contact", to: "/contact", description: "Write the team about a listing or a membership question." },
];

export type Stat = { value: string; label: string };

export type Split = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

export type SecondBandLayout = "cards" | "checklist" | "rail" | "stripes";

export type MarketingArticle = {
  path: string;
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
  seoTitle: string;
  seoDescription: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
  stats?: Stat[];
  secondBand?: SecondBandLayout;
  closing: { headline: string; body: string };
  splits: Split[];
  related: NavLink[];
};

export const articles: MarketingArticle[] = [
  {
    path: "/for/bd-reps",
    eyebrow: "BD reps",
    title: "Find the program that still takes the plan,",
    accent: "and the person who answers.",
    lede: "You usually already know the payer and the level of care. The slow part is figuring out which program in that city still has the contract, and which business development contact still picks up. CenterLinked is that list.",
    seoTitle: "Insurance search for treatment BD reps | CenterLinked",
    seoDescription:
      "Search approved treatment programs by payer, level of care, and city. Each result shows the business development contact so you can call, text, or email.",
    primary: { label: "Join free", to: "/join" },
    secondary: { label: "See search", to: "/platform/search" },
    secondBand: "rail",
    closing: {
      headline: "Open search with a work email.",
      body: "No card is required to search. Claim an organization later from your profile if you need to maintain listings.",
    },
    stats: [
      { value: "Payer", label: "The filter that decides who belongs on the list." },
      { value: "Place", label: "State and city, so the program is somewhere you can actually use." },
      { value: "Person", label: "A business development contact, with a phone or email when the program published one." },
    ],
    splits: [
      {
        eyebrow: "The morning search",
        title: "Start with the questions you already ask.",
        body: "Enter the payer, the level of care, and the place. Results are approved programs with a matching in-network contract. A facility that verification has frozen does not stay in the list. Each row leads with the business development contact, so you can call, text, or email without opening another tab.",
        points: ["Payer and plan type", "Level of care", "State and city", "Business development contact on the row"],
      },
      {
        eyebrow: "The handoff",
        title: "The result is someone you can reach.",
        body: "A match only helps if you can get a person on the phone. The row shows the name, how to reach them, the program, the organization, and the city together. When you need to send the contracts or the levels of care to someone else, open the public program sheet.",
        points: ["Phone and email on the row", "Program and organization under the name", "A shareable sheet when you pass it on"],
      },
      {
        eyebrow: "Your account",
        title: "A work email is enough to start.",
        body: "Search does not require you to claim an organization. You can join, run a search, and use Contacts before anyone claims a listing. Claim later, from your profile, when you need to edit facilities or contracts.",
        points: ["No card to search", "Invite teammates from Contacts", "Claim an organization when you are ready"],
      },
    ],
    related: audiences.filter((a) => a.to !== "/for/bd-reps"),
  },
  {
    path: "/for/programs",
    eyebrow: "Treatment programs",
    title: "Give partners one current page",
    accent: "instead of last quarter’s PDF.",
    lede: "People who refer you should not have to guess whether the one-pager in their inbox is still true. Your program sheet shows levels of care, in-network contracts, and the business development contact who answers. When a contract changes, you edit the listing.",
    seoTitle: "List a treatment program partners can trust | CenterLinked",
    seoDescription:
      "Publish levels of care, in-network contracts, and a business development contact on one link. Update the listing when the contract changes.",
    primary: { label: "List your program", to: "/join" },
    secondary: { label: "See pricing", to: "/pricing" },
    secondBand: "checklist",
    closing: {
      headline: "List the program. Keep the sheet current.",
      body: "Listing is free. Membership is optional, and the price follows how many facilities you keep live.",
    },
    stats: [
      { value: "Live", label: "One link for business development, admissions, and marketing." },
      { value: "In network", label: "Contracts sit on the listing, where a partner can read them." },
      { value: "Monthly", label: "Verification shows whether someone confirmed the sheet recently." },
    ],
    splits: [
      {
        eyebrow: "The sheet",
        title: "What a partner sees when they open your link.",
        body: "The public program page leads with the program, the place, and the organization. Levels of care and in-network insurance sit on the sheet with the business development contact. Someone who was sent the link can read it without an account. Refer, share, and export stay on the page when they need to pass it on.",
        points: ["Levels of care", "In-network insurance", "Business development contact", "Share link"],
      },
      {
        eyebrow: "Keeping it true",
        title: "Edit the contract in the app, not in a new brochure.",
        body: "Facility admins update the listing and the insurance contracts from the organization desk. Partners open the current sheet. Monthly verification marks the facility fresh, recent, stale, or frozen, so a quiet listing does not keep looking current.",
        points: ["Edit facilities and contracts", "Assign the business development contact", "Hide a listing when it should not be public"],
      },
      {
        eyebrow: "Listing",
        title: "Being found does not require a card.",
        body: "Listing is free. Search is free for professionals with a work email. Paid membership is for organizations that want the maintained profile, team seats, and monthly verification. The price follows facility count, not seats.",
        points: ["Free to be found", "Membership by facility count", "Done For You if you want help building the profile"],
      },
    ],
    related: platform,
  },
  {
    path: "/for/organizations",
    eyebrow: "Multi-site organizations",
    title: "One organization,",
    accent: "with a sheet for every site.",
    lede: "Detox in one city and intensive outpatient in another should not live in a folder of PDFs. Partners need the specific facility that matches the insurance and the place. Your team needs every site, contract, contact, and verification state in one desk.",
    seoTitle: "One organization for every treatment site | CenterLinked",
    seoDescription:
      "Keep every facility, in-network contract, and business development contact on one organization. Search still returns the site that matches.",
    primary: { label: "Create your organization", to: "/join" },
    secondary: { label: "Plans", to: "/pricing" },
    secondBand: "stripes",
    closing: {
      headline: "Put every site on one organization.",
      body: "Search still returns the matching facility. Membership scales with how many facilities you keep live.",
    },
    stats: [
      { value: "1–15", label: "Self-serve membership, priced by how many facilities are live." },
      { value: "16+", label: "Larger groups are quoted. The listing works the same way." },
      { value: "Seats", label: "Unlimited team seats on membership." },
    ],
    splits: [
      {
        eyebrow: "The organization",
        title: "A public page for the group, and a sheet for each site.",
        body: "Partners can open the organization, then each program. Insurance-fit search still returns the specific facility that matches the payer and the city. Each facility carries its own business development contact.",
        points: ["Organization sheet", "A sheet per program", "A contact on each facility"],
      },
      {
        eyebrow: "The desk",
        title: "Every location in one table.",
        body: "The organization dashboard lists each facility with its location, business development contact, public visibility, and in-network count. Open a row to adjust contracts or who answers.",
        points: ["See every site", "Adjust contracts", "Assign who answers"],
      },
      {
        eyebrow: "Verification",
        title: "Freshness is per listing, not per brand.",
        body: "Monthly verification marks each facility fresh, recent, stale, or frozen. A PDF cannot show that difference. A frozen listing drops out of search until it is verified again.",
        points: ["Fresh and recent stay searchable", "Stale is a warning", "Frozen is out of search"],
      },
    ],
    related: [audiences[1], audiences[3], platform[2]],
  },
  {
    path: "/for/partners",
    eyebrow: "Levels of care",
    title: "The same plan can still be",
    accent: "the wrong program.",
    lede: "Detox, residential, partial hospitalization (PHP), intensive outpatient (IOP), and outpatient are different handoffs, even when they accept the same plan. Search keeps level of care next to the payer, so the list is the right kind of program.",
    seoTitle: "Search treatment by level of care | CenterLinked",
    seoDescription:
      "Filter behavioral health programs by detox, residential, PHP, IOP, or outpatient, next to the payer and the city.",
    primary: { label: "Search the network", to: "/join" },
    secondary: { label: "How listings work", to: "/platform/listings" },
    secondBand: "cards",
    closing: {
      headline: "Match the payer and the level of care.",
      body: "Then call the business development contact on the row. The sheet is what you send when someone else needs the contracts.",
    },
    stats: [
      { value: "Detox", label: "When the next step is medical withdrawal management." },
      { value: "Residential", label: "When the partner needs a bed, not a brochure." },
      { value: "PHP · IOP", label: "When the step-down has to be in network too." },
    ],
    splits: [
      {
        eyebrow: "Fit",
        title: "Level of care is part of the match.",
        body: "A residential program and an outpatient clinic can accept the same payer and still be the wrong call. Filter by level of care, see it on the result, and open the program sheet for the rest of the continuum.",
        points: ["Filter by level of care", "See it on the result", "Open the program sheet for the rest"],
      },
      {
        eyebrow: "Step-down",
        title: "Sibling programs stay under the organization.",
        body: "When a group runs more than one facility, the program sheet can point back to the organization. The next level of care is another listing, with its own contracts and its own contact.",
        points: ["An organization page for the group", "A program page for the site", "A clearer handoff to the next level of care"],
      },
      {
        eyebrow: "What this is not",
        title: "This is not a patient chart.",
        body: "CenterLinked does not store clinical records, schedule patients, or replace an electronic health record. It tells a professional with a work email who accepts the insurance at this level of care, and who to call.",
        points: ["No patient information", "No patient scheduling", "Professionals only"],
      },
    ],
    related: [audiences[0], audiences[1], platform[0]],
  },
  {
    path: "/for/referral-sources",
    eyebrow: "Referral sources",
    title: "A person to call,",
    accent: "for this plan and this city.",
    lede: "Hospitals, employee assistance programs, interventionists, and other referral sources get the same question a business development rep gets. Who can take this plan, at this level of care, close enough to matter? The useful answer is a person with a phone.",
    seoTitle: "Referral sources: who accepts the plan | CenterLinked",
    seoDescription:
      "Look up in-network treatment programs by payer, level of care, and city. Each result includes a business development contact you can call.",
    primary: { label: "Join free", to: "/join" },
    secondary: { label: "Contacts", to: "/platform/contacts" },
    secondBand: "rail",
    closing: {
      headline: "Narrow the list. Then keep the people.",
      body: "Search is free with a work email. Contacts holds the professionals you actually reach after the call.",
    },
    stats: [
      { value: "Free", label: "Referral partners are not billed to search." },
      { value: "Work email", label: "Accounts use a work address. This is not a public directory for families." },
      { value: "Call", label: "Phone, text, and email sit on the contact." },
    ],
    splits: [
      {
        eyebrow: "Before the call",
        title: "Narrow the list before you dial.",
        body: "Start with the payer and the state. Add level of care and city when you have them. The list is approved programs that are not frozen and that have a matching in-network contract. The business development contact is first on every row.",
        points: ["Insurance", "Level of care", "State and city"],
      },
      {
        eyebrow: "After you find them",
        title: "Keep the people, not only the programs.",
        body: "Contacts is the professional list: name, organization, city, and a way to reach them. Call, text, or email without hunting an old spreadsheet the next time the same payer comes up.",
        points: ["An alphabetical contact list", "Organization and city on the row", "A profile when you need the longer view"],
      },
      {
        eyebrow: "What this is not",
        title: "Patients do not search here.",
        body: "CenterLinked is a tool for behavioral health professionals, behind a work-email gate. It is not a consumer directory. It does not collect patient information, and it does not run scheduling.",
        points: ["A work-email gate", "No clinical records", "Share links are for partners"],
      },
    ],
    related: [audiences[0], platform[0], platform[3]],
  },
  {
    path: "/platform/search",
    eyebrow: "Insurance-fit search",
    title: "Who to call",
    accent: "for this insurance.",
    lede: "Search answers one job: which approved programs are in network for this payer, at this level of care, in this place, and who answers. The row leads with the business development contact so you can make the call without opening another tab.",
    seoTitle: "Search treatment programs by insurance | CenterLinked",
    seoDescription:
      "Filter approved, in-network behavioral health programs by payer, level of care, state, and city. Frozen listings stay out of the results.",
    primary: { label: "Join and search", to: "/join" },
    secondary: { label: "For BD reps", to: "/for/bd-reps" },
    secondBand: "stripes",
    closing: {
      headline: "Run the search that matches the referral.",
      body: "A work email is enough to join. Search is free. Frozen listings do not stay in the results.",
    },
    stats: [
      { value: "In network", label: "Results are approved programs with a matching contract." },
      { value: "Not frozen", label: "A listing that failed verification does not stay in the list." },
      { value: "Person first", label: "The row leads with the business development contact." },
    ],
    splits: [
      {
        eyebrow: "Filters",
        title: "The few questions that decide the list.",
        body: "Insurance, level of care, state, and city sit in front. Plan type, ZIP, specialty, and accreditation stay under more filters when you need them. Results only include approved facilities that are not frozen and that have a matching in-network contract.",
        points: ["Payer", "Level of care", "State and city", "More filters when you need them"],
      },
      {
        eyebrow: "The row",
        title: "A person, then the program.",
        body: "Each result shows the business development contact, how to reach them, the facility, the organization, the city, and the levels of care. The insurance match sits on the row, so you can see why the program appeared.",
        points: ["Name and how to reach them", "A link to the program", "The insurance match on the row"],
      },
      {
        eyebrow: "While you compare",
        title: "The other matches stay beside you.",
        body: "When you open a listing from search, the other organizations from that result stay in a menu. You can move between them without rebuilding the same filters.",
        points: ["Back to the same search", "The payer you searched", "The other organizations in that result"],
      },
    ],
    related: [platform[1], platform[2], platform[3]],
  },
  {
    path: "/platform/listings",
    eyebrow: "Program listings",
    title: "A sheet partners can open",
    accent: "without wondering if it is current.",
    lede: "Every public program has a link. It shows the program, the organization, levels of care, insurance, and the business development contact. No login is required to read a sheet someone sent you. Search itself stays behind a work-email account.",
    seoTitle: "Share a live treatment program listing | CenterLinked",
    seoDescription:
      "Send one public link for levels of care, in-network contracts, and the business development contact. Partners can read it without an account.",
    primary: { label: "List a program", to: "/join" },
    secondary: { label: "Verification", to: "/platform/verification" },
    secondBand: "checklist",
    closing: {
      headline: "Send the link instead of the PDF.",
      body: "Claim the organization when you are ready to edit contracts. Listing is free. Membership is optional.",
    },
    stats: [
      { value: "Link", label: "One URL for the program. One for the organization." },
      { value: "Share", label: "Send the sheet instead of attaching a PDF." },
      { value: "Edit", label: "Change contracts in the app. The sheet updates." },
    ],
    splits: [
      {
        eyebrow: "Public",
        title: "Readable without an account.",
        body: "A partner who receives the link can see the program and organization sheets. Insurance-fit search stays behind a work-email account, so the network is for professionals.",
        points: ["Public program sheet", "Public organization sheet", "Search requires an account"],
      },
      {
        eyebrow: "On the sheet",
        title: "The facts that decide a referral.",
        body: "Levels of care, in-network contracts, location, and the person to call. Refer, share, and export stay on the page for people who need to pass the sheet on.",
        points: ["Care and contracts", "Business development contact", "Share and export"],
      },
      {
        eyebrow: "Ownership",
        title: "The organization controls the listing.",
        body: "Claim the organization, assign facility admins, and decide what is public. Unclaimed organizations can still be found in search when they qualify. Claiming is how you maintain contracts and the contact.",
        points: ["Claim from your profile", "Admins edit contracts", "Visibility is a choice you make"],
      },
    ],
    related: [audiences[1], audiences[2], platform[2]],
  },
  {
    path: "/platform/verification",
    eyebrow: "Monthly verification",
    title: "Current, or clearly not.",
    accent: "You can tell which.",
    lede: "A listing is only useful if you can tell whether someone stood behind it this month. Contracts change. Contacts leave. Admissions pause. Verification marks each facility fresh, recent, stale, or frozen, so a quiet sheet does not keep looking current.",
    seoTitle: "Monthly verification for treatment listings | CenterLinked",
    seoDescription:
      "Fresh, recent, stale, and frozen tell you whether a treatment listing was confirmed. Frozen facilities leave search until they are verified again.",
    primary: { label: "See membership", to: "/pricing" },
    secondary: { label: "How listings work", to: "/platform/listings" },
    secondBand: "cards",
    closing: {
      headline: "Treat freshness as part of the listing.",
      body: "Membership includes monthly verification. Frozen facilities leave search until they are verified again.",
    },
    stats: [
      { value: "Fresh", label: "Confirmed within 30 days. Reasonable to treat as current." },
      { value: "Stale", label: "Past the recent window. The badge says so before you call." },
      { value: "Frozen", label: "Out of search until someone verifies it again." },
    ],
    splits: [
      {
        eyebrow: "The states",
        title: "Four states, with a plain meaning.",
        body: "Fresh means the listing was confirmed within 30 days. Recent means 31 to 60 days. Stale means it needs confirmation. Frozen means the facility should not be offered as an insurance-fit match until someone verifies it again. A frozen listing is removed from search.",
        points: ["Fresh: within 30 days", "Recent: 31 to 60 days", "Stale: needs confirmation", "Frozen: out of search"],
      },
      {
        eyebrow: "Search",
        title: "Frozen listings do not stay in the results.",
        body: "Search shows approved programs that are not frozen and that have an in-network contract for the payer you asked about. That is how a quiet listing stops looking like a live option.",
        points: ["Approved", "Not frozen", "In-network contract"],
      },
      {
        eyebrow: "The habit",
        title: "Checked on a monthly rhythm, on purpose.",
        body: "Membership includes monthly verification, so a multi-site group is not depending on whoever last edited a spreadsheet. The state is visible on the listing. You still confirm the bed and the benefit on the phone.",
        points: ["Included with membership", "Visible on the listing", "A reason to trust the sheet this month"],
      },
    ],
    related: [platform[0], platform[1], audiences[2]],
  },
  {
    path: "/platform/contacts",
    eyebrow: "Contacts",
    title: "The people behind the programs,",
    accent: "kept where you can find them.",
    lede: "A list of buildings still fails if you cannot find the person. Contacts is the professional list: name, organization, city, and a way to reach them after search. The call is why you opened the product. The sheet is what you send when someone else needs the contracts.",
    seoTitle: "Business development contacts for treatment | CenterLinked",
    seoDescription:
      "Keep the business development contacts you call, text, and email. Find them by insurance fit, then return to the person later.",
    primary: { label: "Join free", to: "/join" },
    secondary: { label: "Search", to: "/platform/search" },
    secondBand: "rail",
    closing: {
      headline: "Keep the relationships next to the search.",
      body: "Find contacts by insurance fit, then return to them in Contacts without rebuilding the list.",
    },
    stats: [
      { value: "A–Z", label: "People, grouped the way a contact list should be." },
      { value: "Reach", label: "Call, text, and email from the row." },
      { value: "Yours", label: "Invite teammates. Keep the relationships in the product." },
    ],
    splits: [
      {
        eyebrow: "The list",
        title: "A contact index you can scan.",
        body: "Each row is a person: name, title, organization, where they work, and the actions you actually take. Contacts is the professional workspace after the search. There is no social feed here.",
        points: ["Name and organization", "Phone and place", "Open the profile"],
      },
      {
        eyebrow: "From search",
        title: "Insurance fit finds them. Contacts keeps them.",
        body: "Search surfaces the business development contact on a matching program. Contacts is where those professional relationships live after the call, so the next referral for the same payer does not start from a blank spreadsheet.",
        points: ["Find them by insurance fit", "Reach them the same day", "Come back to the person later"],
      },
      {
        eyebrow: "Accounts",
        title: "Teammates join with a work email.",
        body: "Invite colleagues onto the organization. Personal email domains stay blocked unless they have been approved. Search and Contacts do not require a claimed organization on the first day.",
        points: ["Work email", "Unlimited seats on membership", "Search does not require an organization"],
      },
    ],
    related: [audiences[0], audiences[4], platform[0]],
  },
  {
    path: "/vs/samhsa-treatment-locator",
    eyebrow: "Compared",
    title: "CenterLinked and the SAMHSA Treatment Locator:",
    accent: "who to call, not just where.",
    lede: "The SAMHSA Treatment Locator is free, federal, and the first place most people look. It answers where a facility is. It does not tell you whether the program still holds a contract with the payer in front of you, or who at that program picks up. Those are the two answers a referral actually waits on.",
    seoTitle: "CenterLinked vs SAMHSA Treatment Locator | CenterLinked",
    seoDescription:
      "SAMHSA lists facilities and addresses. CenterLinked adds the in-network contract, the date someone last confirmed it, and the business development contact who answers.",
    primary: { label: "Search with a work email", to: "/join" },
    secondary: { label: "See how search works", to: "/platform/search" },
    secondBand: "rail",
    closing: {
      headline: "Use both. They answer different questions.",
      body: "SAMHSA is the public map of licensed facilities. CenterLinked is the professional list of who is in network this month, and who to call.",
    },
    stats: [
      { value: "Contract", label: "SAMHSA lists services and payment types. CenterLinked lists the named in-network contract search filters on." },
      { value: "Date", label: "A locator record has no last-confirmed date. Every CenterLinked facility is fresh, recent, stale, or frozen." },
      { value: "Person", label: "A locator result ends at a main line. A CenterLinked result leads with the business development contact." },
    ],
    splits: [
      {
        eyebrow: "What each one answers",
        title: "Where the facility is, versus whether it can take this plan.",
        body: "The federal locator is built for the public and covers licensed facilities nationally, with services and general payment categories. That is a real and useful map. What it cannot tell a business development rep is whether this program holds a current contract with this specific payer, at this level of care, in this city. CenterLinked starts from the payer, so the list that comes back is already filtered to programs with a matching in-network contract.",
        points: [
          "SAMHSA: licensed facilities, services, broad payment categories",
          "CenterLinked: a named payer contract on an approved facility",
          "CenterLinked: level of care and city on the same search",
        ],
      },
      {
        eyebrow: "Staying current",
        title: "A record with no date cannot tell you it is stale.",
        body: "Contracts lapse, programs pause admissions, and contacts leave. A directory entry that never changes looks the same whether it was confirmed last week or three years ago. Each CenterLinked facility carries a verification state: fresh within 30 days, recent at 31 to 60, stale when it needs confirmation, and frozen when it has gone past that window. A frozen facility leaves search rather than sitting there looking current.",
        points: ["Fresh, recent, stale, frozen on every facility", "Frozen listings leave search", "You still confirm the bed and the benefit on the phone"],
      },
      {
        eyebrow: "The handoff",
        title: "The part of the afternoon a locator does not help with.",
        body: "Finding the building is rarely the slow part. The slow part is the transfer, the voicemail, and the contact form. A CenterLinked result leads with the business development contact, with a phone or email when the program published one, and Contacts keeps that person findable for the next referral with the same payer.",
        points: ["Business development contact on the result row", "Phone and email when the program published them", "Contacts keeps the person after the call"],
      },
    ],
    related: [platform[0], platform[2], audiences[0]],
  },
  {
    path: "/vs/payer-directories",
    eyebrow: "Compared",
    title: "One search across every payer,",
    accent: "instead of one directory per carrier.",
    lede: "Checking a payer directory works when you already know which carrier to open. The behavioral health version of the job runs the other way: you have a person, a level of care, and a city, and you need to know which programs nearby can take the plan. Doing that one carrier at a time is the morning most business development reps lose.",
    seoTitle: "CenterLinked vs payer provider directories | CenterLinked",
    seoDescription:
      "Payer directories check one carrier at a time and stop at the facility. CenterLinked searches every listed payer at once and shows who to call.",
    primary: { label: "Search with a work email", to: "/join" },
    secondary: { label: "See how search works", to: "/platform/search" },
    secondBand: "checklist",
    closing: {
      headline: "The payer directory is still the system of record.",
      body: "Benefits verification stays in your normal admissions process. CenterLinked is how you find the short list worth verifying.",
    },
    stats: [
      { value: "One search", label: "Payer, level of care, and city together, across every payer listed on the network." },
      { value: "Per carrier", label: "A payer directory answers for its own plans only, in its own interface." },
      { value: "Who answers", label: "A directory record names a facility. A result here names the person." },
    ],
    splits: [
      {
        eyebrow: "The direction of the question",
        title: "You rarely start by knowing the carrier.",
        body: "A payer directory is built to answer one question: is this provider in network for us. That is the right tool when the carrier is already settled. Business development runs the other direction. You have a level of care and a city, and several plans are in play. CenterLinked puts the payer on the search as a filter rather than as the starting point, so one search covers the programs that hold a matching contract.",
        points: ["Payer, level of care, and city in one query", "Approved facilities with a matching in-network contract", "Plan type, ZIP, specialty, and accreditation one click away"],
      },
      {
        eyebrow: "What the record contains",
        title: "Provider directories stop at the facility.",
        body: "A payer listing tells you a facility participates. It does not tell you which levels of care that site actually runs today, or who at the program handles referrals. CenterLinked results lead with the business development contact, then the program, the organization, and the city, and the public program sheet carries levels of care and contracts on one link you can send.",
        points: ["Levels of care on the listing", "Business development contact on the row", "A shareable sheet instead of a PDF"],
      },
      {
        eyebrow: "What this does not replace",
        title: "This is not benefits verification.",
        body: "Insurance listings on CenterLinked are for reference. They tell you which programs are worth a call, not what a particular member's plan will authorize. Eligibility, authorization, and benefits still run through your normal admissions process, and the bed still gets confirmed on the phone.",
        points: ["Listings are reference, not eligibility", "Benefits verification stays in admissions", "Confirm the bed on the call"],
      },
    ],
    related: [platform[0], platform[1], audiences[4]],
  },
];

/**
 * Head-to-head pages. Linked from the footer so the comparison queries have a
 * crawlable path in, and so a visitor comparing tools can find them.
 */
export const comparisons: NavLink[] = [
  {
    label: "vs SAMHSA Treatment Locator",
    to: "/vs/samhsa-treatment-locator",
    description: "Where a facility is, versus whether it still holds the contract and who answers.",
  },
  {
    label: "vs payer directories",
    to: "/vs/payer-directories",
    description: "One search across every listed payer, instead of one carrier directory at a time.",
  },
];

export const insights = [
  {
    slug: "insurance-before-the-brochure",
    title: "Check the insurance before you send the brochure",
    lede: "A clear program description does not help if the plan is out of network. The order of the questions is the whole job.",
    seoDescription:
      "Why behavioral health referrals stall when the payer, the level of care, and the city live in three different places.",
    body: [
      "The first question in behavioral health business development is usually whether the program can take the payer. Level of care and city come next. Campus photos and a well-designed one-pager come after that. They cannot repair a contract that is not there.",
      "Those facts get scattered. Someone has a PDF from a conference. Someone else has a text that names a contact who left in the spring. The admissions line can confirm a bed, but only after you have already spent the morning finding the right program to call.",
      "CenterLinked puts the payer on the search. The programs that come back have an in-network contract for that payer, are approved, and are not frozen. You can narrow by level of care and city. The business development contact is who you call to confirm the bed and the benefit. The phone call still matters. The list is there so you are not starting from a folder.",
      "Listing stays free so a program can be found without buying a membership. Search stays free with a work email so the people who refer have a reason to open it. Organizations pay for membership when keeping facilities current is worth more than another printed leave-behind. None of that requires patient records, and the product does not schedule care.",
    ],
  },
  {
    slug: "what-monthly-verification-changes",
    title: "What changes when a listing is checked every month",
    lede: "Contracts change, contacts leave, and admissions pause. A date on a PDF does not tell you any of that.",
    seoDescription:
      "How fresh, recent, stale, and frozen work on a treatment listing, and why a quiet facility leaves search.",
    body: [
      "If the only thing a partner has is a file from March, they cannot tell whether the contract is still in place. They call, they wait, and sometimes they send someone toward a program that cannot take the plan.",
      "Each facility on CenterLinked has a verification state. Fresh means someone confirmed it within the last 30 days. Recent means 31 to 60 days. Stale means the listing needs confirmation. Frozen means it has gone past that window, and it leaves search until someone verifies it again.",
      "You still confirm the bed and the benefit on the phone. What you can stop doing is treating a quiet listing as if it were current.",
      "For a group with more than one site, the state belongs to the facility, not the brand. Detox in one city can stay fresh while intensive outpatient in another city goes stale. Search only offers approved facilities that are not frozen and that have a matching in-network contract. Silence shows up as absence from the list, which is more honest than a confident wrong answer.",
    ],
  },
  {
    slug: "the-person-on-the-listing",
    title: "Put a person on the listing, not only a main line",
    lede: "Most of the time you lose is not the search. It is the transfer, the voicemail, and the contact form.",
    seoDescription:
      "Why a treatment listing should show the business development contact, and how Contacts keeps that person findable.",
    body: [
      "A directory that ends at the building still leaves you with a main line. If you do this work, you already know how that afternoon goes.",
      "On CenterLinked, the result leads with the business development contact: a name when the program has one, and a phone or email when they published it. Contacts keeps those people in a list you can come back to, so the next referral for the same payer does not start from a blank spreadsheet.",
      "The public sheet is still what you send when someone else needs the levels of care and the contracts. No login is required to read a link you were sent. Search itself stays behind a work-email account, because this is not a directory for families browsing on their own.",
      "That is why Contacts sits next to Search. The habit is finding who accepts the insurance, reaching them, and keeping the relationship. There is no patient information in the product, and it does not schedule care.",
    ],
  },
] as const;

export function articleByPath(path: string) {
  return articles.find((article) => article.path === path) ?? null;
}

export function insightBySlug(slug: string) {
  return insights.find((article) => article.slug === slug) ?? null;
}

/**
 * Homepage FAQ. Answers the hesitations a BD rep actually raises before
 * creating an account. Keep in sync with the FAQPage JSON-LD in index.html —
 * structured data must describe copy that is visible on the page.
 */
export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "What if a listing is out of date?",
    answer:
      "Every facility carries the date someone last confirmed it. Fresh means within 30 days. Recent means 31 to 60 days. After that the listing is marked as needing confirmation, and a facility that stays unconfirmed is frozen and leaves search until someone verifies it again. A quiet listing shows up as absent rather than as current.",
  },
  {
    question: "Does it show whether a bed is open today?",
    answer:
      "No, and it does not try to. Census changes by the hour and no directory can keep up with it honestly. CenterLinked answers the question that comes before the bed: which programs hold a contract with this payer, at this level of care, in this city, and who to call to confirm. You still confirm the bed and the benefit on the phone.",
  },
  {
    question: "Will this replace the relationships I already have?",
    answer:
      "No. It is a lookup and a contact list, not a broker. There are no mass messages and no lead routing — you decide who to call, and the call is still yours. Contacts keeps the people you already work with in one place, so the next referral for the same payer does not start from a spreadsheet. The product is for the programs you have not met yet.",
  },
  {
    question: "Is this a directory for patients or families?",
    answer:
      "No. Accounts require a work email, and personal email domains stay blocked unless they have been approved. It is not a consumer treatment directory, it does not store charts or schedule care, and no protected health information belongs on a listing.",
  },
  {
    question: "Do the insurance listings mean a plan is verified?",
    answer:
      "No. In-network contracts on a listing tell you which programs are worth a call. They are not an eligibility check for a specific member. Benefits verification stays in your normal admissions process.",
  },
  {
    question: "What does it cost?",
    answer:
      "Searching is free with a work email, and no card is required. Listing an organization is free too. Membership is optional and priced by how many facilities you keep live, starting at $99 a month for one facility.",
  },
];

/**
 * Directory counts for the homepage proof block.
 *
 * Deliberately unset. There is no public aggregate in this codebase, and a
 * number nobody can trace is worse than no number. Fill every field from a
 * dated snapshot and the block renders itself; leave any field null and it
 * stays hidden.
 */
export type DirectorySnapshot = {
  asOf: string;
  facilities: number;
  contracts: number;
  payers: number;
  states: number;
  /** The supply side of the network. The "who you already know" claim rests on this one. */
  professionals: number;
};

export const directorySnapshot: DirectorySnapshot | null = null;

/**
 * Named-user proof. Empty until real quotes are collected — name, role, and a
 * specific outcome. Do not fill this with personas; the demo data on this site
 * is labeled as made up for a reason.
 */
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  organization: string;
};

export const testimonials: Testimonial[] = [];

/**
 * Who operates CenterLinked. Set `name` and `role` and the About page renders
 * the block; leave `name` empty and it stays hidden rather than shipping a
 * placeholder person.
 */
export const operator = {
  name: "",
  role: "",
  /** Public photo path under /public, e.g. "/founder.jpg". Optional. */
  photo: "",
  /** One paragraph, same voice as the rest of the site. Why this exists. */
  note: "",
  /** A profile a reader can check. LinkedIn is the one this audience uses. */
  profileUrl: "",
  /** Where to write the team. Falls back to the contact page when empty. */
  email: "",
};
