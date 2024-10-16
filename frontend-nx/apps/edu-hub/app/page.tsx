import { Metadata } from 'next';
import { Page } from '../components/layout/Page';
import HomeContent from '../components/pages/HomeContent';

export const metadata: Metadata = {
  title: 'EduHub | opencampus.sh',
  openGraph: {
    title: 'EduHub | opencampus.sh',
    images: ['https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png'],
  },
};

export default function Home() {
  return (
    <Page className="text-white">
      <HomeContent />
    </Page>
  );
}
