import { FC, useCallback, useReducer, useState } from "react";
import { Button } from "../common/Button";
import ModalControl from "../common/ModalController";

const ProjectResultsUpload: FC = () => {
  const [showModal, setShowModal] = useState(false);
  const close = useCallback((show: boolean) => {
    setShowModal(false);
  }, []);

  const chooseAndAchieveMent = useCallback(() => {}, []);
  const upload = useCallback(() => {
    setShowModal(true);
  }, []);
  return (
    <>
      <div className="flex flex-col space-y-1 itmes-start py-2">
        <h1>Leistungsnachweis</h1>
        <p>
          Den Leistungsnachweis musst Du bis spätestens zum 16.02.2021
          hochgeladen haben.
        </p>
        <Button onClick={chooseAndAchieveMent} as="button" filled={false}>
          Wähle einen Leistungsnachweis ↓
        </Button>
        <Button onClick={upload} as="button" filled={true}>
          ↑ Nachweis hochladen
        </Button>
      </div>
      <ModalControl showModal={showModal} onClose={close}>
        <Content />
      </ModalControl>
    </>
  );
};

export default ProjectResultsUpload;

interface State {
  imageName: string;
  zipFileName: string;
  csvFileName: string;
  description: string;
}
interface Type {
  type: string;
  value: any;
}
const Content: FC = () => {
  const initialState: State = {
    imageName: "",
    zipFileName: "",
    csvFileName: "",
    description: "",
  };

  const reducer = (state: State = initialState, action: Type) => {
    return { ...state, [action.type]: action.value };
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const uploadTitleBild = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "imageName", value: name });
    },
    [dispatch]
  );

  const uploadDocumentationsZip = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "zipFileName", value: name });
    },
    [dispatch]
  );

  const uploadResultCsv = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "csvFileName", value: name });
    },
    [dispatch]
  );

  const requestDeleteTag = useCallback((id: number) => {
    console.log(id);
  }, []);

  const save = useCallback(() => {
    console.log("save");
  }, []);
  return (
    <>
      <div className="flex flex-col space-y-2 w-full pb-5">
        <div className="flex flex-row ">
          <h1 className="w-1/2">Nachweis hochladen</h1>
          <p className="text-right w-1/2">
            Einführung in Data Science und maschinelles Lernen
          </p>
        </div>
        <div className="px-8 flex flex-col space-y-5">
          <div className="">
            <p className="">UMSATZVORHERSAGE FÜR EINE BÄCKEREIFILIALE</p>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Titlebild</p>
              <div className="w-4/6">
                <UploadUI
                  bottomText="Optimal ist eine Größe von XXX x XXX Pixel."
                  onChange={uploadTitleBild}
                  uploadFileName={state.imageName}
                  acceptedFileTypes=".png, .jpg"
                  placeholder="Chose an image(.png, .jpg)"
                />
              </div>
            </div>

            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Autoren</p>
              <div className="w-4/6 flex felx-row">
                <div className="items-center pt-1 pr-3">
                  <MdAddCircleOutline size="1.4em" />
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <EhTagEditTag
                    requestDeleteTag={requestDeleteTag}
                    tag={{ display: "Faiz Ahmed", id: 1 }}
                  />
                  <EhTagEditTag
                    requestDeleteTag={requestDeleteTag}
                    tag={{ display: "Faiz Ahmed", id: 1 }}
                  />
                  <EhTagEditTag
                    requestDeleteTag={requestDeleteTag}
                    tag={{ display: "Faiz Ahmed", id: 1 }}
                  />
                  <EhTagEditTag
                    requestDeleteTag={requestDeleteTag}
                    tag={{ display: "Faiz Ahmed", id: 1 }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Beschreibung</p>
              <div className="w-4/6">
                <EhDebounceInput
                  textArea={true}
                  onChangeHandler={(value: string) =>
                    dispatch({
                      type: "description",
                      value,
                    })
                  }
                  placeholder="Write the description"
                  inputText={state.description}
                />
              </div>
            </div>
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Dokumentation</p>
              <div className="w-4/6">
                <UploadUI
                  bottomText="Benutze diese Vorlage zum Hochladen der Dokumentation!"
                  onChange={uploadDocumentationsZip}
                  uploadFileName={state.zipFileName}
                  acceptedFileTypes=".zip"
                  placeholder=".zip"
                />
              </div>
            </div>
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">CSV Ergebnisse</p>
              <div className="w-4/6">
                <UploadUI
                  bottomText="Benutze diese Vorlage zum Hochladen der CSV-Ergebnisse!"
                  onChange={uploadResultCsv}
                  uploadFileName={state.csvFileName}
                  acceptedFileTypes=".csv"
                  placeholder=".csv"
                />
              </div>
            </div>
            <div className="flex justify-center items-center">
              <Button onClick={save} as="button" filled={false}>
                Hochladen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

import { useRef } from "react";
import EhDebounceInput from "../common/EhDebounceInput";
import { MdAddCircleOutline } from "react-icons/md";
import EhTagEditTag from "../common/EhTagEditTag";

export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  bottomText: string;
  onChange: (formData: FormData, fileName: string) => void;
  uploadFileName: string;
  placeholder?: string;
}

const UploadUI: React.FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const onClickHandler = () => {
    fileInputRef.current?.click();
  };

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    const formData = new FormData();

    Array.from(event.target.files).forEach((file) => {
      formData.append(event.target.name, file);
    });

    props.onChange(formData, event.target.files[0].name);

    formRef.current?.reset();
  };

  return (
    <form ref={formRef}>
      <div className="flex-col items-right" onClick={onClickHandler}>
        <div className="border-b border-b-2 border-gray-400 flex flex-row cursor-pointer">
          <input
            placeholder={props.placeholder ?? ""}
            type="text"
            className="w-5/6 pr-1 truncate"
            disabled
            value={props.uploadFileName}
          />
          <p className="w-1/6">^</p>
        </div>
        {props.bottomText && (
          <p className="text-right text-xs">{props.bottomText}</p>
        )}
      </div>

      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        name={props.uploadFileName}
        onChange={onChangeHandler}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </form>
  );
};

UploadUI.defaultProps = {
  acceptedFileTypes: "",
  allowMultipleFiles: false,
};
