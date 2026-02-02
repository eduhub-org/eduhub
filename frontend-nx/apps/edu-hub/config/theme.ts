import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark', // Current dark aesthetic
    primary: {
      main: '#00A398', // eduhub-brand
    },
    secondary: {
      main: '#F2F2F2',
    },
    error: {
      main: '#D45A5A',
    },
    success: {
      main: '#A2EBA0',
    },
    warning: {
      main: '#FFA665',
    },
    background: {
      default: '#222222', // eduhub-bg-primary
      paper: '#2a2a2a',   // eduhub-bg-card
    },
    text: {
      primary: '#F2F2F2',   // eduhub-label-primary
      secondary: '#D8D8D8', // eduhub-label-secondary
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
