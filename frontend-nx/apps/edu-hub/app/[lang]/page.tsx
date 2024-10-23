import { Metadata } from 'next';
import { Page } from '../../components/layout/Page';
import HomeContent from '../../components/pages/HomeContent';
import getT from 'next-translate/getT';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getT(params.lang, ['metadata']);

  return {
    title: t('metadata:impressum.title'),
    description: t('metadata:impressum.description'),
    openGraph: {
      title: t('metadata:impressum.title'),
      images: ['https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png'],
    },
  };
}

export default function Home() {
  return (
    <Page className="text-white">
      <HomeContent />
    </Page>
  );
}
