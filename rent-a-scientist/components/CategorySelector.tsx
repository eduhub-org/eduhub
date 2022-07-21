import {FC, useCallback, useMemo} from "react";
import { AllScientistOffers_ScientistOffer } from "../queries/__generated__/AllScientistOffers";
import Select from "react-select";
import { collectCategories } from "../helpers/offerhelp";

interface IProps {
    forOffers: AllScientistOffers_ScientistOffer[],
    selected?: string[],
    onSelectCategories?: (cats: string[]) => any,
    instanceId: string,
    id: string,
    className?: string,
}

export const CategorySelector: FC<IProps> = ({
    forOffers,
    selected,
    onSelectCategories,
    instanceId,
    id,
    className,
}) => {

    const options = useMemo(() => {
        const os = collectCategories(forOffers).map(c => ({
            value: c,
            label: c
        }));
        return os;
    }, [forOffers]);

    const values = useMemo(() => {
        const mySelected = selected || [];
        return mySelected.map(s => options.find(o => o.value === s)).filter(x => x != null);
    }, [selected, options]);

    const handleSelect = useCallback((event) => {
        if (onSelectCategories !== undefined) {
            onSelectCategories(event.map((e: any) => e.value));
        }
    }, [onSelectCategories]);

    return <>
        
        <Select 
            placeholder="Wähle Kategorien"
            options={options}
            instanceId={instanceId}
            id={id}
            className={className}
            isMulti={true}
            value={values}
            onChange={handleSelect}
        />

    </>;
}