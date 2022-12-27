import { ChangeEvent, FC, useCallback, useRef } from "react";
import { MdUploadFile } from "react-icons/md";
import { UploadFile, parseFileUploadEvent } from "../../helpers/filehandling";

export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  onFileChoosed: (file: UploadFile | null) => void;
}

export const UiFileInputButton: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUploadToServer = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const ufile = await parseFileUploadEvent(event);
      props.onFileChoosed(ufile);
    },
    [props]
  );

  return (
    <form ref={formRef}>
      <div className="h-10 w-10  rounded-full border-2 border-gray-400 flex justify-center items-center">
        <MdUploadFile
          size="1.5em"
          className="cursor-pointer"
          onClick={onClickHandler}
        />
      </div>

      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        onChange={handleFileUploadToServer}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </form>
  );
};

UiFileInputButton.defaultProps = {
  acceptedFileTypes: "",
  allowMultipleFiles: false,
};
