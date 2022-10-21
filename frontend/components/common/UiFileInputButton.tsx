import { ChangeEvent, FC, useCallback, useRef } from "react";
import { MdUploadFile } from "react-icons/md";
import { parseFileUploadEvent } from "../../helpers/filehandling";
import { useAdminMutation } from "../../hooks/authedMutation";
import { SAVE_FILE } from "../../queries/actions";
import {
  SaveAFile,
  SaveAFileVariables,
} from "../../queries/__generated__/SaveAFile";

export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  onUploadComplete: (finalUrl: string, fileName: string) => void;
  uploadFileName: string;
  templatePath: string;
}

export const UiFileInputButton: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const [saveFile] = useAdminMutation<SaveAFile, SaveAFileVariables>(SAVE_FILE);

  const handleFileUploadToServer = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const ufile = await parseFileUploadEvent(event);

      if (ufile != null) {
        const url = [props.templatePath, ufile.name].join("/");

        await saveFile({
          variables: {
            base64file: ufile.data,
            fileName: url,
          },
        });

        props.onUploadComplete(url, ufile.name);
      }
    },
    [saveFile, props]
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
        name={props.uploadFileName}
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
