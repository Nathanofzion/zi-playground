import { createTheme } from '@mui/material';
import { opacify } from './utils';

export const theme = (mode) => {
  //
  const isDark = mode === 'dark';
  //

  const newTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#D9D9D9' : '#181A25',
      },
      secondary: {
        main: isDark ? '#98A1C0' : '#98A1C0',
        light: '#B8C0DC',
      },
      background: {
        default: isDark ? '#0F1016' : '#FFFFFF',
        paper: isDark ? '#181A25' : opacify(10, '#00615F'),
      },
      error: {
        main: '#FD766B',
      },
      customBackground: {
        surface: isDark ? '#0F1016' : '#F8F8F8',
        module: isDark ? '#13141E' : '#F8F8F8',
        outputBackground: isDark ? '#181A25' : '#F8F8F8',
        bg1: isDark ? '#181A25' : '#FFFFFF',
        bg2: isDark ? '#13141E' : '#FFFFFF',
        bg3: isDark ? '#404A67' : '#B8C0DC',
        bg4: isDark ? '#5D6785' : '#98A1C0',
        bg5: isDark ? '#7780A0' : '#7780A0',
        bg6: isDark ? '#2A2E44' : opacify(10, '#00615F'),
        interactive: isDark ? '#293249' : '#E8ECFB',
        accentAction: isDark ? '#00615F' : '#00615F',
        accentActionSoft: isDark ? opacify(24, '#00615F') : opacify(24, '#00615F'),
        accentSuccess: '#B4EFAF',
        accentWarning: '#EEB317',
        accentWarningSoft: opacify(24, '#EEB317'),
        accentCritical: '#FD766B',
        accentFailureSoft: opacify(12, '#FD766B'),
        backdrop: '#080B11',
        floating: opacify(12, '#000000'),
        outline: opacify(24, '#98A1C0'),
        scrim: opacify(72, '#0D111C'),
        scrolledSurface: opacify(72, '#0D111C'),
      },
      custom: {
        textPrimary: isDark ? '#FFFFFF' : '#00615F',
        textSecondary: isDark ? '#4E4E4E' : '#E0E0E0',
        textTertiary: isDark ? '#E0E0E0' : '#4E4E4E',
        textQuaternary: isDark ? '#B4EFAF' : '#F66B3C',
        textLinks: isDark ? '#00615F' : '#F66B3C',
        borderColor: isDark ? '#00615F' : '#00615F',
        stateOverlayHover: opacify(8, '#98A1C0'),
        stateOverlayPressed: opacify(24, '#B8C0DC'),
        deprecated_primary2: isDark ? '#4C82FB' : '#FF6FA3',
        deprecated_primary3: isDark ? '#869EFF' : '#FBA4C0',
        deprecated_primary4: isDark ? '#376bad70' : '#F6DDE8',
        deprecated_primary5: isDark ? '#153d6f70' : '#FDEAF1',
        deprecated_yellow3: '#5D4204',
        accentTextLightPrimary: isDark ? '#F5F6FC' : '#F5F6FC',
        accentTextLightSecondary: isDark ? '#4E4E4E' : '#A3A3A3',
        accentTextLightTertiary: opacify(12, '#F5F6FC'),
        accentTextDarkPrimary: opacify(80, '#0D111C'),
        accentTextDarkSecondary: opacify(60, '#0D111C'),
        accentTextDarkTertiary: opacify(24, '#0D111C'),
        accentFailure: '#D15858',
        shadow1: isDark ? '#000' : '#2F80ED',
      },
    },
    typography: {
      fontFamily: ['Inter', 'Darker Grotesque'].join(','),
      subtitle1: {
        color: isDark ? '#FFFFFF' : '#0D111C',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@global': {
            body: {
              backgroundImage:
                'url(https://designshack.net/wp-content/uploads/gradient-background.jpg)',
            },
          },
        },
      },
    },
  });

  return newTheme;
};
