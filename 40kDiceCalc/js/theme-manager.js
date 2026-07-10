// manages dynamic color palettes and CSS variable injection using Token Mapping

export const Themes = {
    space_wolves: {
        textLight: "#9ac1df",
        textMuted: "#8C9BA8",
        inputBg: "#c5ddef",
        mid: "#4A637B",
        midHover: "#3B4F62",
        btnStandard: "#9B2226",
        btnStandardHover: "#7C1B1E",
        accent: "#C48235",
        accentGlow: "rgba(196, 130, 53, 0.4)",
        chartColors: ["#9ac1df", "#C48235", "#9B2226", "#E2A958", "#7A8FA6"],
        btnStandardText: "FOR THE ALL FATHER! (Base Profile)",
        btnAdvancedText: "FOR RUSS! (Scenario Testing)",
        chartColors: ["#9ac1df", "#C48235", "#9B2226", "#E2A958", "#7A8FA6"],
        btnStandardText: "FOR THE ALL FATHER! (Base Profile)",
        btnAdvancedText: "FOR RUSS! (Scenario Testing)",
        divider: "#9B2226" // Space Wolves Reddish
    },
    necrons: {
        textLight: "#8FE07F",
        textMuted: "#66B39A",
        inputBg: "#C1E8C1",
        mid: "#1F6A3A",
        midHover: "#18542E",
        btnStandard: "#B0B5B9",
        btnStandardHover: "#8C9196",
        accent: "#E8E8E8",
        accentGlow: "rgba(232, 232, 232, 0.4)",
        // Added a rich oxidized rust (#A04010) to break up the silver and green
        chartColors: ["#8FE07F", "#B0B5B9", "#A04010", "#E8E8E8", "#1F6A3A"],
        btnStandardText: "AWAKEN (Base Profile)",
        btnAdvancedText: "WE REMEMBER. WE ENDURE. (Scenario Testing)",
        chartColors: ["#8FE07F", "#B0B5B9", "#A04010", "#E8E8E8", "#1F6A3A"],
        btnStandardText: "AWAKEN (Base Profile)",
        btnAdvancedText: "WE REMEMBER. WE ENDURE. (Scenario Testing)",
        divider: "#A04010" // Necron Rusty Color
    },
    tyranids: {
        textLight: "#E6C9B0",
        textMuted: "#D1A382",
        inputBg: "#E8D3C1",
        mid: "#9B4A9E",
        midHover: "#7C3B7E",
        btnStandard: "#8A1515",
        btnStandardHover: "#660F0F",
        accent: "#8A1515",
        accentGlow: "rgba(138, 21, 21, 0.4)",
        chartColors: ["#E6C9B0", "#9B4A9E", "#8A1515", "#D182C0", "#660F0F"],
        btnStandardText: "SSSPlllSSSHT! (Base Profile)",
        btnAdvancedText: "RRAAAWWR! (Scenario Testing)",
        chartColors: ["#E6C9B0", "#9B4A9E", "#8A1515", "#D182C0", "#660F0F"],
        btnStandardText: "SSSPlllSSSHT! (Base Profile)",
        btnAdvancedText: "RRAAAWWR! (Scenario Testing)",
        divider: "#8A1515" // Tyranid Dark Red
    },
    votann: {
        textLight: "#2AA6D6",
        textMuted: "#8BA3C7",
        inputBg: "#BCE3F0",
        mid: "#2F5AA0",
        midHover: "#254880",
        btnStandard: "#F58F29",
        btnStandardHover: "#C47220",
        accent: "#F58F29",
        accentGlow: "rgba(245, 143, 41, 0.4)",
        chartColors: ["#2AA6D6", "#F58F29", "#8BA3C7", "#2F5AA0", "#FFFFFF"],
        btnStandardText: "DATA FIRST, BODIES SECOND (Base Profile)",
        btnAdvancedText: "EFFICIENCY ABOVE ALL (Scenario Testing)",
        chartColors: ["#2AA6D6", "#F58F29", "#8BA3C7", "#2F5AA0", "#FFFFFF"],
        btnStandardText: "DATA FIRST, BODIES SECOND (Base Profile)",
        btnAdvancedText: "EFFICIENCY ABOVE ALL (Scenario Testing)",
        divider: "#F58F29" // Votann Bright Orange
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
    root.style.setProperty('--theme-divider', theme.divider);

    // Update Button Text dynamically
    const calcBtn = document.getElementById("calculate-btn");
    if (calcBtn) calcBtn.textContent = theme.btnStandardText;
    const advBtn = document.getElementById("advanced-analytics-btn");
    if (advBtn) advBtn.textContent = theme.btnAdvancedText;

    localStorage.setItem("40kTheme", themeKey);
}