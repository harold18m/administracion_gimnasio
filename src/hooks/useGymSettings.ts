import { useState, useEffect } from "react";

const STORAGE_KEY_LOGO = "gym_logo_url";
const STORAGE_KEY_COLOR = "gym_sidebar_color";

// Helper to convert hex to HSL (simplified approximation for now)
// Actually better to let the browser handle it or use a library, 
// but since we need to inject into Tailwind HSL vars 'H S% L%', we need values.
function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  
  const cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

export function useGymSettings() {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [sidebarColor, setSidebarColor] = useState<string>("#1e293b"); // Default dark slate

  useEffect(() => {
    // Load from storage
    const storedLogo = localStorage.getItem(STORAGE_KEY_LOGO);
    if (storedLogo) setLogoUrl(storedLogo);

    const storedColor = localStorage.getItem(STORAGE_KEY_COLOR);
    if (storedColor) {
      setSidebarColor(storedColor);
      applySidebarColor(storedColor);
    }
  }, []);

  const updateLogo = (url: string) => {
    setLogoUrl(url);
    localStorage.setItem(STORAGE_KEY_LOGO, url);
  };

  const updateSidebarColor = (color: string) => {
    setSidebarColor(color);
    localStorage.setItem(STORAGE_KEY_COLOR, color);
    applySidebarColor(color);
  };

  const applySidebarColor = (color: string) => {
    const hsl = hexToHSL(color);
    document.documentElement.style.setProperty('--sidebar-background', hsl);
    // For simplicity, we make 'foreground' white if background is dark, 
    // or black if background is light.
    // Very naive contrast check:
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    if (brightness > 128) {
        document.documentElement.style.setProperty('--sidebar-foreground', '0 0% 0%');
        document.documentElement.style.setProperty('--sidebar-primary', '0 0% 0%');
        document.documentElement.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
        document.documentElement.style.setProperty('--sidebar-accent', '0 0% 90%');
        document.documentElement.style.setProperty('--sidebar-accent-foreground', '0 0% 0%');
        document.documentElement.style.setProperty('--sidebar-border', '0 0% 80%');
    } else {
        document.documentElement.style.setProperty('--sidebar-foreground', '0 0% 100%');
        document.documentElement.style.setProperty('--sidebar-primary', '0 0% 100%');
        document.documentElement.style.setProperty('--sidebar-primary-foreground', '0 0% 0%');
        document.documentElement.style.setProperty('--sidebar-accent', '0 0% 20%');
        document.documentElement.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
        document.documentElement.style.setProperty('--sidebar-border', '0 0% 30%');
    }
  };

  return {
    logoUrl,
    updateLogo,
    sidebarColor,
    updateSidebarColor
  };
}
