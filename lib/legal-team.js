const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const getEntityValue = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    return { name: value };
  }
  return value;
};

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : value || "";

const normalizeMember = (member) => {
  const source = getEntityValue(member);
  const linkedUser = getEntityValue(source.user);

  const name = cleanText(source.name) || cleanText(linkedUser.name);
  const email = cleanText(source.email) || cleanText(linkedUser.email);
  const contact = cleanText(source.contact) || cleanText(linkedUser.contact);
  const company = cleanText(source.company) || cleanText(linkedUser.company);
  const gst = cleanText(source.gst) || cleanText(linkedUser.gst);
  const poc = cleanText(source.poc) || cleanText(source.spock);
  const level = cleanText(source.level);

  return {
    ...source,
    name,
    email,
    contact,
    company,
    gst,
    poc,
    level,
    isLead: Boolean(source.isLead || source.isPrimary || source.role === "lead"),
  };
};

export const getCaseLegalTeam = (caseItem = {}) => {
  const lawyers = toArray(caseItem?.lawyers);
  const advocates = toArray(caseItem?.advocates);
  const legacyLawyer = caseItem?.lawyer ? [caseItem.lawyer] : [];

  const teamSource = lawyers.length > 0 ? lawyers : advocates.length > 0 ? advocates : legacyLawyer;

  return teamSource
    .map(normalizeMember)
    .filter((member) => member.name || member.email || member.contact);
};

export const getLeadLegalTeamMember = (caseItemOrTeam = []) => {
  const team = Array.isArray(caseItemOrTeam)
    ? caseItemOrTeam
    : getCaseLegalTeam(caseItemOrTeam);

  return (
    team.find((member) => member.isLead) ||
    team.find((member) => member.level === "Senior") ||
    team[0] ||
    null
  );
};

export const formatLegalTeamSummary = (
  caseItemOrTeam,
  { maxNames = 2, withPrefix = false } = {}
) => {
  const team = Array.isArray(caseItemOrTeam)
    ? caseItemOrTeam
    : getCaseLegalTeam(caseItemOrTeam);

  const names = team
    .map((member) => cleanText(member?.name))
    .filter(Boolean);

  if (names.length === 0) return null;

  const formattedNames = names
    .slice(0, maxNames)
    .map((name) => (withPrefix ? `Adv. ${name}` : name));

  const remainingCount = names.length - formattedNames.length;

  return remainingCount > 0
    ? `${formattedNames.join(", ")} +${remainingCount} more`
    : formattedNames.join(", ");
};
