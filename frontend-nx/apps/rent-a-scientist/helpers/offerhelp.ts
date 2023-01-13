import { AllScientistOffers_ScientistOffer } from "../queries/__generated__/AllScientistOffers";

export const collectSchoolSubjects = (
  forOffers:
    | AllScientistOffers_ScientistOffer[]
    | AllScientistOffers_ScientistOffer
) => {
  if (!Array.isArray(forOffers)) {
    forOffers = [forOffers];
  }

  const categories: Record<string, boolean> = {};
  for (const offer of forOffers) {
    for (const s of offer.subjectComment.split(",").map((x) => x.trim())) {
      if (s.length > 0) {
        categories[s] = true;
      }
    }
  }

  return Object.keys(categories);
};

export const collectCategories = (
  forOffers:
    | AllScientistOffers_ScientistOffer[]
    | AllScientistOffers_ScientistOffer
) => {
  if (!Array.isArray(forOffers)) {
    forOffers = [forOffers];
  }

  const categories: Record<string, boolean> = {};
  for (const offer of forOffers) {
    for (const c of offer.categories) {
      const cs = c as string;
      categories[cs] = true;
    }
  }

  const schoolSubjects = collectSchoolSubjects(forOffers);

  return [...Object.keys(categories), ...schoolSubjects];
};

export const doRegionsMatch = (
  schoolPostalCode: string | undefined,
  region: string
) => {
  if (schoolPostalCode === undefined) {
    return false;
  }

  const kielRegion = [
    "24103",
    "24105",
    "24106",
    "24107",
    "24109",
    "24111",
    "24113",
    "24114",
    "24116",
    "24118",
    "24143",
    "24145",
    "24146",
    "24147",
    "24148",
    "24149",
    "24159",
    "24119",
    "24161",
    "24229",
    "24235",
    "24226",
    "24248",
    "24232",
  ];

  const ploen = [
    "24211",
    "24217",
    "24220",
    "24222",
    "24223",
    "24226",
    "24232",
    "24235",
    "24238",
    "24245",
    "24248",
    "24250",
    "24253",
    "24256",
    "24257",
    "24306",
    "24321",
    "24326",
    "24327",
    "24329",
    "24601",
    "24619",
    "24620",
    "24625",
    "24637",
  ];

  const rendsburgeckernfoerde = [
    "24119",
    "24161",
    "24214",
    "24229",
    "24239",
    "24241",
    "24242",
    "24244",
    "24247",
    "24251",
    "24254",
    "24259",
    "24340",
    "24351",
    "24354",
    "24357",
    "24358",
    "24360",
    "24361",
    "24363",
    "24364",
    "24366",
    "24367",
    "24369",
    "24398",
    "24582",
    "24589",
    "24594",
    "24613",
    "24622",
    "24631",
    "24634",
    "24644",
    "24646",
    "24647",
    "24768",
    "24782",
    "24783",
    "24784",
    "24787",
    "24790",
    "24791",
    "24793",
    "24794",
    "24796",
    "24797",
    "24799",
    "24800",
    "24802",
    "24805",
    "24806",
    "24808",
    "24809",
    "24811",
    "24813",
    "24814",
    "24816",
    "24819",
    "25557",
    "25575",
    "25585",
    "25590",
  ];

  if (region.indexOf("Kiel") !== -1) {
    return kielRegion.indexOf(schoolPostalCode) !== -1;
  } else if (region.indexOf("Plön") !== -1) {
    return ploen.indexOf(schoolPostalCode) !== -1;
  } else if (region.indexOf("Rendsburg") !== -1) {
    return rendsburgeckernfoerde.indexOf(schoolPostalCode) !== -1;
  } else {
    console.log("Unknown region selected!", region);
    return false;
  }
};

export const filterOffer = (
  offer: AllScientistOffers_ScientistOffer,
  filterCategories: string[],
  knownSchoolSubjects: string[],
  searchText: string,
  selectedGrade: number,
  schoolPostalCode: string | undefined
) => {
  const o = offer;

  const allSchoolSubjects =
    offer.subjectComment == null || offer.subjectComment.length === 0;
  const offerCategories = collectCategories(o);

  const arraysIntersect = (as: string[], bs: string[]) => {
    const x: Record<string, boolean> = {};
    for (const a of as) {
      x[a] = true;
    }
    for (const b of bs) {
      if (x[b]) {
        return true;
      }
    }
    return false;
  };

  const textIntersect = (a: string, b: string) => {
    const alow = a.toLocaleLowerCase();
    const blow = b.toLocaleLowerCase();
    return alow.indexOf(blow) !== -1;
  };

  const oresult =
    (filterCategories.length === 0 ||
      (allSchoolSubjects &&
        arraysIntersect(knownSchoolSubjects, filterCategories)) ||
      arraysIntersect(offerCategories, filterCategories)) &&
    (textIntersect(o.description, searchText) ||
      textIntersect(o.title, searchText)) &&
    o.minimumGrade <= selectedGrade &&
    o.maximumGrade >= selectedGrade &&
    o.possibleLocations.findIndex((l: string) =>
      doRegionsMatch(schoolPostalCode, l)
    ) !== -1;
  return oresult;
};
