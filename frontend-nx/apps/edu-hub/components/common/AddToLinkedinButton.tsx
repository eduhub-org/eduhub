import React, { FC } from 'react';

interface IProps {
  cert: {
    name: string;
    id: string;
    issueMonth: string;
    issueYear: string;
    url: string;
  }
}

const AddToLinkedInButton: FC<IProps> = ({ cert }) => {
  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${cert.name}&organizationId=5186963&issueYear=${cert.issueYear}&issueMonth=${cert.issueMonth}&certUrl=${cert.url}&certId=${cert.id}`;

  return (
    <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
      <button className="btn-linkedin">Add to LinkedIn</button>
    </a>
  );
}

export default AddToLinkedInButton;
