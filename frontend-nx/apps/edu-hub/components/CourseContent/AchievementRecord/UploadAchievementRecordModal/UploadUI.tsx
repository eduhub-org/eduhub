import React, { ChangeEvent, FC, ReactNode, useCallback, useRef, useState } from 'react';
import { parseFileUploadEvent, UploadFile } from '../../../../helpers/filehandling';
import { NameId } from '../../../../helpers/achievement';

export interface IPropsUpload extends NameId {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  nodeBottom?: ReactNode;
  placeholder?: string;
  onFileSelected: (fieldName: string, file: UploadFile) => void;
}

const UploadUI: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onChangeHandler = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const uFile = await parseFileUploadEvent(event);
      setFileName(uFile.name);
      if (uFile) props.onFileSelected(event.target.name, uFile);
    },
    [props, setFileName]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex-col items-right">
        <div
          onClick={onClickHandler}
          className="cursor-pointer flex justify-between border-b border-b-1 border-gray-400 flex-row"
        >
          <input
            placeholder={props.placeholder ?? ''}
            type="text"
            disabled
            className="cursor-pointer bg-transparent pointer-events-none"
            value={fileName}
          />
          <p>^</p>
        </div>
      </div>
      {props.nodeBottom && <p className="text-right text-xs"> {props.nodeBottom}</p>}

      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        name={props.name}
        id={props.id}
        onChange={onChangeHandler}
        ref={fileInputRef}
        className="bg-transparent"
        style={{ display: 'none' }}
        type="file"
      />
    </div>
  );
};

UploadUI.defaultProps = {
  acceptedFileTypes: '',
  allowMultipleFiles: false,
};

export default UploadUI;
