import React from 'react';
import { useForm } from 'react-hook-form';
import { useFileUploader } from '../../../hooks/fileUpload';

const FileUpload = ({ uploadMutation, submitMutation, uploadVariables, submitVariables, refetchQueries }) => {
  const { register, handleSubmit } = useForm();
  const { getFileBase64, isLoading } = useFileUploader();

  const handleFileUploadAndSubmit = async (data) => {
    let fileUrl = null;
    if (data.file[0]) {
      const base64 = await getFileBase64(data.file[0]);
      // Upload the file
      const uploadResult = await uploadMutation({
        variables: {
          base64File: base64,
          fileName: data.file[0].name,
          ...uploadVariables
        },
      });
      const resultData = uploadResult.data;
      const key = Object.keys(resultData)[0];
      fileUrl = resultData[key].path;
    }

    // Submit the entire form data, including the file URL
    await submitMutation({
      variables: {
        ...submitVariables,
        url: fileUrl,
      },
      refetchQueries,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFileUploadAndSubmit)}>
      {/* Other form inputs here */}
      <input type="file" {...register('file')} disabled={isLoading} />
      <button type="submit" disabled={isLoading}>
        Submit
      </button>
    </form>
  );
};

export default FileUpload;
