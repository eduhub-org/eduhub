import { CircularProgress } from '@mui/material';
import { Page } from '../../../../components/layout/Page';

export default function Loading() {
  return (
    <Page>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    </Page>
  );
}
