// manages dynamic color palettes and CSS variable injection using Token Mapping

export const Themes = {
    space_wolves: {
        textLight: "#9ac1df",
        textMuted: "#8C9BA8",
        inputBg: "#c5ddef",
        mid: "rgb(74, 99, 123)",
        midHover: "#293846",
        btnStandard: "#9B2226",
        btnStandardHover: "#7A1A1E",
        accent: "#C48235",
        accentGlow: "rgba(196, 130, 53, 0.4)",
        chartColors: ["#9ac1df", "#C48235", "#9B2226", "#E2A958", "#7A8FA6"],
        btnStandardText: "FOR THE EMPEROR! (Standard)",
        btnAdvancedText: "FOR THE ADVANCED EMPEROR!"
    },
    necrons: {
        textLight: "#8FE07F",
        textMuted: "#66B39A",
        inputBg: "#C1E8C1",
        mid: "#1F6A3A",
        midHover: "#144525",
        btnStandard: "#D4AF37",
        btnStandardHover: "#AA8420",
        accent: "#A0A0A0",
        accentGlow: "rgba(160, 160, 160, 0.4)",
        chartColors: ["#8FE07F", "#D4AF37", "#A0A0A0", "#1F6A3A", "#E0FFE0"],
        btnStandardText: "Awaken (Standard Sim)",
        btnAdvancedText: "We remember. We endure. (Advanced)"
    },
    tyranids: {
        textLight: "#E6C9B0",
        textMuted: "#D1A382",
        inputBg: "#E8D3C1",
        mid: "#9B4A9E",
        midHover: "#6D346F",
        btnStandard: "#C92A2A",
        btnStandardHover: "#991D1D",
        accent: "#D182C0",
        accentGlow: "rgba(209, 130, 192, 0.4)",
        chartColors: ["#E6C9B0", "#9B4A9E", "#C92A2A", "#D182C0", "#7A1C1C"],
        btnStandardText: "SSSPlllSSSHT! (Standard Sim)",
        btnAdvancedText: "RRAAAWWR! (Advanced Sim)"
    },
    votann: {
        textLight: "#2AA6D6",
        textMuted: "#8BA3C7",
        inputBg: "#BCE3F0",
        mid: "#2F5AA0",
        midHover: "#1B3F73",
        btnStandard: "#F58F29",
        btnStandardHover: "#C46B12",
        accent: "#2AA6D6",
        accentGlow: "rgba(42, 166, 214, 0.4)",
        chartColors: ["#2AA6D6", "#F58F29", "#8BA3C7", "#2F5AA0", "#FFFFFF"],
        btnStandardText: "Data First, Bodies Second",
        btnAdvancedText: "Efficiency Above All (Advanced)"
    }
};

let currentThemeKey = "space_wolves";

export function getCurrentTheme() {
    return Themes[currentThemeKey];
}

export function applyTheme(themeKey) {
    if (!Themes[themeKey]) themeKey = "space_wolves";
    currentThemeKey = themeKey;
    const theme = Themes[currentThemeKey];
    const root = document.documentElement;

    // Structural Backgrounds (Shared Dark Neutrals across all themes)
    root.style.setProperty('--bg-color', "#0F1115");
    root.style.setProperty('--surface-color', "#1A1D24");
    root.style.setProperty('--surface-hover', "#242830");
    root.style.setProperty('--border-color', "#38424D");
    root.style.setProperty('--danger-red', "#E63946");

    // Dynamic Text & Trims
    root.style.setProperty('--theme-text-light', theme.textLight);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-input-bg', theme.inputBg);

    // Dynamic Buttons & Accents
    root.style.setProperty('--theme-mid', theme.mid);
    root.style.setProperty('--theme-mid-hover', theme.midHover);
    root.style.setProperty('--theme-btn-standard', theme.btnStandard);
    root.style.setProperty('--theme-btn-standard-hover', theme.btnStandardHover);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-accent-glow', theme.accentGlow);

    // Update Button Text dynamically
    const calcBtn = document.getElementById("calculate-btn");
    if (calcBtn) calcBtn.textContent = theme.btnStandardText;
    const advBtn = document.getElementById("advanced-analytics-btn");
    if (advBtn) advBtn.textContent = theme.btnAdvancedText;

    const dropdown = document.getElementById("theme-dropdown");
    if (dropdown) dropdown.value = themeKey;

    localStorage.setItem("40kTheme", themeKey);
}