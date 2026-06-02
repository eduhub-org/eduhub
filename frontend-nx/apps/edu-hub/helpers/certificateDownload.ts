export const getCertificateDownloadUrl = (certificatePath: string) => (
  `/api/certificates/download?path=${encodeURIComponent(certificatePath)}`
);
