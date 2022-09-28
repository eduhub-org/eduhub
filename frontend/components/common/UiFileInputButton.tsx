import { useRef } from "react";
import { MdUploadFile } from "react-icons/md";

export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  label: string;
  onChange: (formData: FormData, fileName: string) => void;
  uploadFileName: string;
}

export const UiFileInputButton: React.FC<IPropsUpload> = (props) => {
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
        onChange={onChangeHandler}
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
