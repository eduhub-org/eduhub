import { useQuery } from "@apollo/client";
import { FC, useCallback, useMemo } from "react";
import { ALL_SCHOOLS } from "../queries/ras_offer";
import {
  AllSchols,
  AllSchols_School,
} from "../queries/__generated__/AllSchols";
import Select from "react-select";

interface IProps {
  onSelectSchool?: (school: AllSchols_School) => any;
  selectedSchool?: AllSchols_School;
  instanceId: string;
  id: string;
  className?: string;
}

export const SchoolSelector: FC<IProps> = ({
  onSelectSchool,
  selectedSchool,
  instanceId,
  id,
  className,
}) => {
  const allSchoolsQuery = useQuery<AllSchols>(ALL_SCHOOLS);

  const allSchools = useMemo(() => {
    return allSchoolsQuery.data?.School || [];
  }, [allSchoolsQuery]);

  const handleSelectSchool = useCallback(
    (event) => {
      const school = allSchools.find((s) => s.dstnr === event.value);
      if (school != null) {
        if (onSelectSchool != null) {
          onSelectSchool(school);
        }
      } else {
        console.log("could not find school by dstr", event.value);
      }
    },
    [onSelectSchool, allSchools]
  );

  const options = allSchools
    .map((school) => ({
      value: school.dstnr,
      label: `${school.name}; ${school.city} ${school.street}`,
    }))
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

  const value = options.find((o) => o.value === selectedSchool?.dstnr);

  return (
    <>
      <Select
        className={className}
        value={value}
        onChange={handleSelectSchool}
        placeholder={"Schule auswählen"}
        instanceId={instanceId}
        id={id}
        options={options}
        isSearchable={true}
      />
    </>
  );
};
