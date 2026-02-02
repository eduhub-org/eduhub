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
    // Text inputs
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: 'var(--eduhub-label-primary)',
          },
          '& .MuiInputLabel-root': {
            color: 'var(--eduhub-label-secondary)',
          },
          // Outlined variant
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-border-primary)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-border-secondary)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-brand)',
          },
        },
      },
    },
    // FormControl (parent of TextField/Select with standard variant)
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: 'var(--eduhub-label-secondary)',
            '&.Mui-focused': {
              color: 'var(--eduhub-brand)',
            },
            '&.Mui-error': {
              color: 'var(--eduhub-error)',
            },
          },
        },
      },
    },
    // Select dropdowns
    MuiSelect: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-primary)',
          backgroundColor: 'transparent',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-border-primary)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-border-secondary)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--eduhub-brand)',
          },
          // Standard variant (no outline)
          '&.MuiInput-root:before': {
            borderBottomColor: 'var(--eduhub-border-primary)',
          },
          '&.MuiInput-root:hover:not(.Mui-disabled):before': {
            borderBottomColor: 'var(--eduhub-border-secondary)',
          },
          '&.MuiInput-root:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
          '&.MuiInput-root.Mui-focused:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
        },
        icon: {
          color: 'var(--eduhub-label-primary)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-primary)',
          backgroundColor: 'var(--eduhub-fill-primary)',
          '&:hover': {
            backgroundColor: 'var(--eduhub-bg-secondary)',
          },
          '&.Mui-selected': {
            backgroundColor: 'var(--eduhub-bg-secondary)',
            color: 'var(--eduhub-label-primary)',
            '&:hover': {
              backgroundColor: 'var(--eduhub-bg-secondary)',
            },
          },
        },
      },
    },
    // Input labels and helpers
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-secondary)',
          '&.Mui-focused': {
            color: 'var(--eduhub-brand)',
          },
          '&.Mui-error': {
            color: 'var(--eduhub-error)',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-secondary)',
          '&.Mui-error': {
            color: 'var(--eduhub-error)',
          },
        },
      },
    },
    // Input base (for standard variant)
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-primary)',
          '&.MuiInput-root:before': {
            borderBottomColor: 'var(--eduhub-border-primary)',
          },
          '&.MuiInput-root:hover:not(.Mui-disabled):before': {
            borderBottomColor: 'var(--eduhub-border-secondary)',
          },
          '&.MuiInput-root:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
          '&.MuiInput-root.Mui-focused:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
        },
        input: {
          color: 'var(--eduhub-label-primary)',
          '&::placeholder': {
            color: 'var(--eduhub-label-secondary)',
            opacity: 1,
          },
        },
      },
    },
    // Input component (standard variant)
    MuiInput: {
      styleOverrides: {
        root: {
          color: 'var(--eduhub-label-primary)',
          '&:before': {
            borderBottomColor: 'var(--eduhub-border-primary)',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: 'var(--eduhub-border-secondary)',
          },
          '&:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
          '&.Mui-focused:after': {
            borderBottomColor: 'var(--eduhub-brand)',
          },
          '&.Mui-error:after': {
            borderBottomColor: 'var(--eduhub-error)',
          },
        },
        input: {
          color: 'var(--eduhub-label-primary)',
          '&::placeholder': {
            color: 'var(--eduhub-label-secondary)',
            opacity: 1,
          },
        },
      },
    },
    // Menu/Paper for dropdowns
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--eduhub-fill-primary) !important',
          color: 'var(--eduhub-label-primary) !important',
          border: '1px solid var(--eduhub-border-primary)',
        },
        list: {
          padding: '4px 0',
        },
      },
    },
    // Popover (used by some dropdowns)
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--eduhub-fill-primary)',
          color: 'var(--eduhub-label-primary)',
          border: '1px solid var(--eduhub-border-primary)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--eduhub-bg-card)',
          color: 'var(--eduhub-label-primary)',
        },
      },
    },
    // Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'var(--eduhub-bg-card)',
          color: 'var(--eduhub-label-primary)',
          border: '1px solid var(--eduhub-border-primary)',
        },
      },
    },
    // Autocomplete (used in TagSelector)
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--eduhub-fill-primary)',
          color: 'var(--eduhub-label-primary)',
          border: '1px solid var(--eduhub-border-primary)',
        },
        listbox: {
          backgroundColor: 'var(--eduhub-fill-primary)',
          color: 'var(--eduhub-label-primary)',
        },
        option: {
          color: 'var(--eduhub-label-primary)',
          '&:hover': {
            backgroundColor: 'var(--eduhub-bg-secondary)',
          },
          '&[aria-selected="true"]': {
            backgroundColor: 'var(--eduhub-bg-secondary)',
          },
        },
      },
    },
  },
});
