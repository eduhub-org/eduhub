import { FC, useCallback, useRef, useState } from "react";
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUploadFile,
} from "react-icons/md";
import EhInputWithTitle from "../common/EhInputWithTitle";
import { UiFileInputButton } from "../common/UiFileInputButton";

const pClass = "text-gray-700 truncate font-medium max-w-xs";
const tdClass = "pl-5";
const AchievementRow: FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  return (
    <>
      <tr className="font-medium bg-edu-row-color h-12">
        <td className={tdClass} colSpan={1}>
          {/* Title */}
          <p className={pClass}>Demo title</p>
        </td>
        <td className={tdClass}>
          {/* Mentoren */}
          <p className={pClass}>Mentor one</p>
        </td>
        <td className={`${tdClass}`} colSpan={2}>
          {/* Course */}
          Kurse with WS291
        </td>

        <td className={tdClass} colSpan={1}>
          {/* Status */}
          <div className="flex">
            <div className="flex px-3 items-center">
              <button
                className="focus:ring-2 rounded-md focus:outline-none"
                role="button"
                aria-label="option"
              >
                {showDetails ? (
                  <MdKeyboardArrowUp size={26} onClick={handleArrowClick} />
                ) : (
                  <MdKeyboardArrowDown size={26} onClick={handleArrowClick} />
                )}
              </button>
            </div>
          </div>
        </td>
      </tr>
      <tr className={showDetails ? "h-0" : "h-1"} />
      {/** Hiden AddAchivementDetails Details */}
      {showDetails && <AddAchivementDetails />}
    </>
  );
};

export default AchievementRow;

const AddAchivementDetails: FC = () => {
  const achievementOptions: string[] = [
    "DOCUMENTATION_AND_CSV",
    "DOCUMENTATION",
  ];
  const [documentType, setDocumentType] = useState(achievementOptions[1]);
  const [fileNameDoc, setFileNameDoc] = useState("");
  const [fileNameDocCSV, setFileNameDocCSV] = useState("");
  const [fileNameScriptFile, setFileNameScriptFile] = useState("");

  const onChangeDescription = useCallback((value: string) => {
    console.log(value);
  }, []);

  const onCheckBoxChange = useCallback((result: ChangeResult) => {
    console.log(result);
  }, []);

  const onAcheivementOptionChange = useCallback(
    (value: string) => {
      setDocumentType(value);
    },
    [setDocumentType]
  );

  const uploadDokumentationsvorlage = useCallback(
    (data: FormData, fileName: string) => {
      console.log(fileName);
      setFileNameDoc(fileName);
    },
    [setFileNameDoc]
  );

  const uploadDokumentationsvorlageCSV = useCallback(
    (data: FormData, fileName: string) => {
      console.log(fileName);
      setFileNameDocCSV(fileName);
    },
    [setFileNameDocCSV]
  );

  const uploadAuswertungsskript = useCallback(
    (data: FormData, fileName: string) => {
      console.log(fileName);
      setFileNameScriptFile(fileName);
    },
    [setFileNameScriptFile]
  );

  return (
    <>
      <tr className="bg-edu-light-gray">
        <td colSpan={1}> </td>
        <td colSpan={4}> more mentors</td>
      </tr>
      <tr className="bg-edu-light-gray">
        <td colSpan={1} />
        <td colSpan={3}>
          <div className="px-5 w-full flex justify-between flex-col space-y-5 pb-4">
            <EhInputWithTitle
              label="Beschreibung (XXX/500 Zeichen)"
              placeholder=""
              onChangeHandler={onChangeDescription}
            />
            <div className="flex flex-row justify-between">
              {/* <EhInputWithTitle
                label="Typ Leistungsnachweis"
                placeholder=""
                onChangeHandler={onChangeDescription}
              /> */}
              <div className="flex flex-col space-y-1">
                <p>Typ Leistungsnachweis</p>
                <EhSelectForEnum
                  selected={documentType}
                  onChange={onAcheivementOptionChange}
                  options={achievementOptions}
                  bg={"white"}
                />
              </div>
              <div className="flex flex-row space-x-1 items-center">
                <EhInputWithTitle
                  label="Dokumentationsvorlage(.doc)"
                  placeholder=".doc"
                  disabled={true}
                  inputText={fileNameDoc}
                />
                <div className="pt-6 pl-1">
                  <UiFileInputButton
                    onChange={uploadDokumentationsvorlage}
                    label="Dokumentationsvorlage(.doc)"
                    uploadFileName="template.doc"
                    acceptedFileTypes=".doc"
                  />
                </div>
              </div>
              <div className="flex flex-row space-x-1 items-center">
                <EhInputWithTitle
                  label="Dokumentationsvorlage CSV(.doc)"
                  placeholder=""
                  disabled={true}
                  inputText={fileNameDocCSV}
                />
                <div className="pt-6 pl-1">
                  <UiFileInputButton
                    onChange={uploadDokumentationsvorlageCSV}
                    label="Dokumentationsvorlage CSV(.doc)"
                    uploadFileName="template.doc"
                    acceptedFileTypes=".doc"
                  />
                </div>
              </div>
            </div>
            {documentType === "DOCUMENTATION_AND_CSV" && (
              <div className="flex justify-end">
                <div className="flex flex-col space-y-2 justify-start">
                  <div className="flex flex-row space-x-1 items-center">
                    <EhInputWithTitle
                      label="Auswertungsskript(.py)"
                      placeholder=""
                      disabled={true}
                      inputText={fileNameScriptFile}
                    />
                    <div className="pt-6 pl-1">
                      <UiFileInputButton
                        onChange={uploadAuswertungsskript}
                        label="Auswertungsskript"
                        uploadFileName="evluation.py"
                        acceptedFileTypes=".py"
                      />
                    </div>
                  </div>
                  <CheckBox
                    isSelected={true}
                    onChange={onCheckBoxChange}
                    text="Autorenspalte anzeigen"
                  />
                </div>
              </div>
            )}
          </div>
        </td>
        <td colSpan={1} />
      </tr>
      <tr className="h-1" />
    </>
  );
};

interface ChangeResult {
  key?: any;
  checked: boolean;
}
interface CheckboxPros {
  isSelected: boolean;
  key?: any;
  text?: string;
  onChange: (result: ChangeResult) => void;
}
const CheckBox: FC<CheckboxPros> = ({ isSelected, key, text, onChange }) => {
  const [checked, setChecked] = useState(isSelected);

  const changeChecked = useCallback(() => {
    onChange({
      key: key ?? undefined,
      checked: !checked,
    });
    setChecked(!checked);
  }, [setChecked, onChange, checked, key]);
  return (
    <div
      className="flex flex-row space-x-1 cursor-pointer"
      onClick={changeChecked}
    >
      {checked === true ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
      {text && (
        <label className="inline-block text-gray-800 cursor-pointer">
          {text}
        </label>
      )}
    </div>
  );
};

interface IProsSelect {
  options: string[];
  selected?: string;
  bg?: string;
  placeholder?: string;
  onChange: (selected: string) => void;
}
const EhSelectForEnum: FC<IProsSelect> = ({
  options,
  selected,
  bg,
  placeholder,
  onChange,
}) => {
  const onSelectChanged = useCallback(
    (event) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const selectStyle = `form-select h-12
    appearance
    block
    w-full
    px-3
    font-normal
    bg-${bg ? bg : "transparent"}
    transition
    ease-in-out
    border-b 
    border-${bg ? "none" : "solid"} border-gray-300
    m-0
    focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none`;

  return (
    <select
      className={selectStyle}
      aria-label={placeholder ?? ""}
      onChange={onSelectChanged}
      value={selected}
      placeholder={placeholder ?? ""}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};
