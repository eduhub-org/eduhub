import { useQuery } from "@apollo/client";
import { Button, Input, TextField } from "@material-ui/core";
import { FC, useCallback, useMemo, useState } from "react";
import {
  collectSchoolSubjects,
  doRegionsMatch,
  filterOffer,
} from "../helpers/offerhelp";
import { shuffleSlices } from "../helpers/shuffle";
import { QUERY_RSA_CONFIG, RSAConfig } from "../queries/ras_config";
import { ALL_OFFERS } from "../queries/ras_offer";
import { AllSchols_School } from "../queries/__generated__/AllSchols";
import {
  AllScientistOffers,
  AllScientistOffers_ScientistOffer,
} from "../queries/__generated__/AllScientistOffers";
import { QueryRSAConfig } from "../queries/__generated__/QueryRSAConfig";
import { CategorySelector } from "./CategorySelector";
import { GradeSelector } from "./GradeSelector";
import { OfferDisplay } from "./OfferDisplay";
import { RegistrationSelection } from "./RegistrationSelection";
import { SchoolSelector } from "./SchoolSelector";
import { useRouter } from "next/router";
import { useRasConfig } from "../hooks/ras";

interface IProps {
  className?: string;
}

// Maps from the id of a selected offer to the days selected in it
type SelectedOffers = Record<number, number[]>;

export const OffersSearch: FC<IProps> = ({ className }) => {
  const rsaConfig = useRasConfig();

  const qOffers = useQuery<AllScientistOffers>(ALL_OFFERS);
  const allOffers = useMemo(() => {
    const os = qOffers.data?.ScientistOffer || [];
    const fos = os.filter((o) => o.programId === rsaConfig.programId);
    return fos;
  }, [qOffers, rsaConfig]);

  const offers = useMemo(() => {
    const sorted = allOffers.sort((a, b) => {
      const ac = a.RequestsCount.aggregate?.count || 0;
      const bc = b.RequestsCount.aggregate?.count || 0;
      return ac - bc;
    });
    const sos = shuffleSlices(sorted);
    return sos;
  }, [allOffers]);

  const [
    finishedSchoolGradeSelection,
    setFinishedSchoolGradeSelection,
  ] = useState<boolean>(false);
  const [selectedGrade, setSelectedGrade] = useState<number>(5);
  const [selectedSchool, setSelectedSchool] = useState<
    AllSchols_School | undefined
  >();
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedOffers, setSelectedOffers] = useState<SelectedOffers>({});

  const handleFinishSchoolGradeSelection = useCallback(() => {
    setFinishedSchoolGradeSelection(true);
  }, [setFinishedSchoolGradeSelection]);

  const handleResetSchoolGradeSelection = useCallback(() => {
    setSelectedSchool(undefined);
    setFinishedSchoolGradeSelection(false);
    setSelectedOffers({});
    setSearchText("");
    setFilterCategories([]);
    setSelectedGrade(5);
  }, [
    setFinishedSchoolGradeSelection,
    setSelectedSchool,
    setSelectedOffers,
    setSearchText,
    setFilterCategories,
    setSelectedGrade,
  ]);

  const handleToggleSelectDays = useCallback(
    (offer: AllScientistOffers_ScientistOffer, days: number[]) => {
      const newSelected = {
        ...selectedOffers,
      };
      if (days.length === 0) {
        delete newSelected[offer.id];
      } else {
        newSelected[offer.id] = days;
      }

      setSelectedOffers(newSelected);
    },
    [selectedOffers, setSelectedOffers]
  );

  const selectedOffersList = useMemo(() => {
    const ids = Object.keys(selectedOffers).map(Number);
    const ogrp: Record<number, AllScientistOffers_ScientistOffer> = {};
    for (const ao of allOffers) {
      ogrp[ao.id] = ao;
    }
    return ids.map((id) => ogrp[id]).filter((x) => x != null);
  }, [selectedOffers, allOffers]);

  const handleSearchInput = useCallback(
    (event) => {
      setSearchText(event?.target?.value || "");
    },
    [setSearchText]
  );

  const filteredOffers = useMemo(() => {
    const allSchoolSubjects = collectSchoolSubjects(allOffers);
    const result = offers.filter((o) =>
      filterOffer(
        o,
        filterCategories,
        allSchoolSubjects,
        searchText,
        selectedGrade,
        selectedSchool?.postalCode
      )
    );
    return result;
  }, [
    allOffers,
    offers,
    searchText,
    filterCategories,
    selectedSchool,
    selectedGrade,
  ]);

  const handleRemoveSelection = useCallback(
    (offer: AllScientistOffers_ScientistOffer) => {
      const newSelected = {
        ...selectedOffers,
      };
      delete newSelected[offer.id];
      setSelectedOffers(newSelected);
    },
    [selectedOffers, setSelectedOffers]
  );

  const schoolAndGradeSelected = useMemo(() => {
    return selectedGrade > 0 && selectedSchool !== undefined;
  }, [selectedSchool, selectedGrade]);

  const router = useRouter();

  const handleRegister = useCallback(() => {
    const sortedCopy = [...filteredOffers];
    sortedCopy.sort(
      (a, b) =>
        (a.RequestsCount.aggregate?.count || 0) -
        (b.RequestsCount.aggregate?.count || 0)
    );

    if (Object.keys(selectedOffers).length < 5 && sortedCopy.length >= 8) {
      let hasGoodRequest = false;
      for (const oKey of Object.keys(selectedOffers)) {
        const idx = sortedCopy.findIndex((x) => x.id === Number(oKey));
        if (idx < sortedCopy.length / 2) {
          hasGoodRequest = true;
          break;
        }
      }

      if (!hasGoodRequest) {
        const doItAnyway = confirm( // eslint-disable-line
          "Sie haben weniger als 5 Angebote ausgewählt und die Nachfrage nach diesen Angeboten ist bereits sehr hoch.\nUm Ihre Chancen zu erhöhen wählen Sie die maximale Anzahl von 5 Angeboten aus.\nWirklich nicht noch weitere Angebote auswählen?"
        );
        if (!doItAnyway) {
          return;
        }
      }
    }

    console.log("Register", selectedOffers);

    localStorage.setItem( // eslint-disable-line
      "pendingRequest",
      JSON.stringify({
        offers: selectedOffers,
        school: selectedSchool,
        grade: selectedGrade,
        now: new Date().toISOString(),
      })
    );

    router.push("/myrequests");
  }, [filteredOffers, selectedOffers, selectedSchool, selectedGrade, router]);

  return (
    <div className={className}>
      <h1 className="mt-4 text-3xl font-bold">Anmeldung</h1>

      <h1 className="mt-4 text-2xl font-bold">Schule und Klassenstufe</h1>

      {!finishedSchoolGradeSelection && (
        <>
          <SchoolSelector
            className="mb-2"
            id={"index-page-school-selector-id"}
            instanceId={"index-page-school-selector-instance"}
            selectedSchool={selectedSchool}
            onSelectSchool={setSelectedSchool}
          />

          <GradeSelector
            className="mb-2"
            id={"index-page-grade-selector-id"}
            instanceId={"index-page-grade-selector-instance"}
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
          />

          <div className="mb-4 mt-4 pl-5">
            <span className="mr-4">
              Wählen Sie im ersten Schritt Schule und Klassenstufe aus.
            </span>

            <Button
              onClick={handleFinishSchoolGradeSelection}
              disabled={!schoolAndGradeSelected}
              variant="outlined"
            >
              Weiter
            </Button>

            <div>
              Wollen Sie mehrere Klassen anmelden, so können Sie den Prozess
              mehrfach durchlaufen
            </div>
          </div>
        </>
      )}

      {finishedSchoolGradeSelection && (
        <>
          <div className="flex">
            <div>
              Gewählte Schule: {selectedSchool?.name}
              <br />
              Gewählte Klassenstufe: {selectedGrade}
            </div>
            <div className="ml-4">
              <Button
                onClick={handleResetSchoolGradeSelection}
                variant="outlined"
              >
                Auswahlprozess Zurücksetzen
              </Button>
            </div>
          </div>

          {rsaConfig.visibility && (
            <>
              <h1 className="mt-4 text-2xl font-bold">Kursauswahlstatus</h1>
              <RegistrationSelection
                selectedOffers={selectedOffersList}
                className="mb-2"
                onClickRemove={handleRemoveSelection}
                onClickRegister={handleRegister}
              />
            </>
          )}

          {!rsaConfig.visibility && (
            <div className="mt-4 text-xl font-bold">
              Leider ist die Anmeldephase vorbei. Sie können hier aber weiterhin
              die Angebote einsehen
            </div>
          )}

          <h1 className="mt-4 text-2xl font-bold">
            Kursoptionen für Ihre Klasse
          </h1>

          <CategorySelector
            forOffers={allOffers}
            instanceId="index-page-category-selector-instance"
            id="index-page-category-selector-id"
            selected={filterCategories}
            onSelectCategories={setFilterCategories}
            className="mb-2"
          />

          <Input
            className="w-full mb-2 pl-2 pr-2"
            placeholder="Filter Kurse nach Beschreibung"
            value={searchText}
            onChange={handleSearchInput}
          />

          <h1 className="mt-4 text-2xl font-bold">
            {filteredOffers.length} Angebote gefunden
          </h1>

          {filteredOffers.map((fo) => (
            <OfferDisplay
              config={rsaConfig}
              className="mb-8"
              key={fo.id}
              offer={fo}
              onToggleSelectedDays={handleToggleSelectDays}
              selectedDays={selectedOffers[fo.id] || []}
            />
          ))}
        </>
      )}
    </div>
  );
};
