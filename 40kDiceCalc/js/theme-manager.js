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
        btnStandardText: "FOR THE ALL FATHER",
        btnAdvancedText: "FOR RUSS",
        divider: "#9B2226"
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
        chartColors: ["#8FE07F", "#B0B5B9", "#A04010", "#E8E8E8", "#1F6A3A"],
        btnStandardText: "AWAKEN",
        btnAdvancedText: "WE REMEMBER WE ENDURE",
        divider: "#A04010"
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
        btnStandardText: "DEVOUR",
        btnAdvancedText: "CONSUME THE BIOMASS",
        divider: "#8A1515"
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
        btnStandardText: "DATA FIRST BODIES SECOND",
        btnAdvancedText: "EFFICIENCY ABOVE ALL",
        divider: "#F58F29"
    },
    ultramarines: {
        textLight: "#9bbced",
        textMuted: "#6481a5",
        inputBg: "#bcd4f2",
        mid: "#1f509a",
        midHover: "#163d78",
        btnStandard: "#b32525",
        btnStandardHover: "#8e1c1c",
        accent: "#dfb065",
        accentGlow: "rgba(223, 176, 101, 0.4)",
        chartColors: ["#9bbced", "#dfb065", "#b32525", "#1f509a", "#6481a5"],
        btnStandardText: "COURAGE AND HONOUR",
        btnAdvancedText: "WE MARCH FOR MACRAGGE",
        divider: "#b32525"
    },
    blood_angels: {
        textLight: "#e8a2a4",
        textMuted: "#ba6d6f",
        inputBg: "#f2c9c9",
        mid: "#9a1115",
        midHover: "#730c0f",
        btnStandard: "#2b2b2b",
        btnStandardHover: "#171717",
        accent: "#e5b32e",
        accentGlow: "rgba(229, 179, 46, 0.4)",
        chartColors: ["#e8a2a4", "#e5b32e", "#9a1115", "#595959", "#ba6d6f"],
        btnStandardText: "BY THE BLOOD OF SANGUINIUS",
        btnAdvancedText: "FOR THE EMPEROR AND SANGUINIUS",
        divider: "#9a1115"
    },
    dark_angels: {
        textLight: "#9edbae",
        textMuted: "#6e9f7d",
        inputBg: "#c9ebd2",
        mid: "#134e26",
        midHover: "#0d381b",
        btnStandard: "#9a1115",
        btnStandardHover: "#730c0f",
        accent: "#e4d4b1",
        accentGlow: "rgba(228, 212, 177, 0.4)",
        chartColors: ["#9edbae", "#e4d4b1", "#9a1115", "#134e26", "#6e9f7d"],
        btnStandardText: "REPENT FOR TOMORROW YOU DIE",
        btnAdvancedText: "THE LION AWAKENS",
        divider: "#9a1115"
    },
    orks: {
        textLight: "#f5d033",
        textMuted: "#a38a22",
        inputBg: "#f5e6a4",
        mid: "#d6aa11",
        midHover: "#a3810d",
        btnStandard: "#1a1a1a",
        btnStandardHover: "#000000",
        accent: "#3b7835",
        accentGlow: "rgba(59, 120, 53, 0.4)",
        chartColors: ["#f5d033", "#3b7835", "#595959", "#d6aa11", "#a38a22"],
        btnStandardText: "I AINT THAT EASY TO KILL",
        btnAdvancedText: "WAAAAAGH",
        divider: "#d6aa11"
    },
    tau_empire: {
        textLight: "#ffffff",
        textMuted: "#f8f9fa",
        inputBg: "#ffffff",
        mid: "#fcfcfc",
        midHover: "#f1f1f1",
        btnStandard: "#bc6b10",
        btnStandardHover: "#8f520c",
        accent: "#158b99",
        accentGlow: "rgba(21, 139, 153, 0.4)",
        chartColors: ["#ffffff", "#158b99", "#bc6b10", "#f8f9fa", "#8f520c"],
        btnStandardText: "FOR THE GREATER GOOD",
        btnAdvancedText: "MONTKA IS IN MOTION",
        divider: "#bc6b10"
    },
    aeldari: {
        textLight: "#e4d4b1",
        textMuted: "#93b5c6",
        inputBg: "#f0e6d3",
        mid: "#2e8b57",
        midHover: "#246e45",
        btnStandard: "#c23636",
        btnStandardHover: "#992b2b",
        accent: "#e6c338",
        accentGlow: "rgba(230, 195, 56, 0.4)",
        chartColors: ["#e4d4b1", "#e6c338", "#c23636", "#2e8b57", "#93b5c6"],
        btnStandardText: "STRIKE FAST AND FADE",
        btnAdvancedText: "THE THREADS OF FATE ALIGN",
        divider: "#c23636"
    },
    drukhari: {
        textLight: "#8edadd",
        textMuted: "#5a999c",
        inputBg: "#bfe8e9",
        mid: "#054a4f",
        midHover: "#033236",
        btnStandard: "#252a2b",
        btnStandardHover: "#151819",
        accent: "#b0387e",
        accentGlow: "rgba(176, 56, 126, 0.4)",
        chartColors: ["#8edadd", "#b0387e", "#595959", "#054a4f", "#5a999c"],
        btnStandardText: "EMBRACE THE PAIN",
        btnAdvancedText: "PREY FROM THE SHADOWS",
        divider: "#b0387e"
    },
    thousand_sons: {
        textLight: "#9be1f2",
        textMuted: "#66a1b0",
        inputBg: "#cbf0f8",
        mid: "#006887",
        midHover: "#004d65",
        btnStandard: "#dfb065",
        btnStandardHover: "#b89153",
        accent: "#f4c522",
        accentGlow: "rgba(244, 197, 34, 0.4)",
        chartColors: ["#9be1f2", "#f4c522", "#dfb065", "#006887", "#66a1b0"],
        btnStandardText: "ALL IS DUST",
        btnAdvancedText: "KNOWLEDGE IS POWER",
        divider: "#dfb065"
    },
    death_guard: {
        textLight: "#c1c9aa",
        textMuted: "#888f76",
        inputBg: "#dce0cf",
        mid: "#5a6446",
        midHover: "#414932",
        btnStandard: "#6b453a",
        btnStandardHover: "#4d3129",
        accent: "#b45722",
        accentGlow: "rgba(180, 87, 34, 0.4)",
        chartColors: ["#c1c9aa", "#b45722", "#6b453a", "#5a6446", "#888f76"],
        btnStandardText: "GRANDFATHERS BLESSINGS",
        btnAdvancedText: "MARCH OF THE DEATH GUARD",
        divider: "#b45722"
    },
    adeptus_custodes: {
        textLight: "#f2e2bd",
        textMuted: "#ad9e7a",
        inputBg: "#f7eed6",
        mid: "#c49646",
        midHover: "#9c7532",
        btnStandard: "#9a1115",
        btnStandardHover: "#730c0f",
        accent: "#f4ca55",
        accentGlow: "rgba(244, 202, 85, 0.4)",
        chartColors: ["#f2e2bd", "#f4ca55", "#9a1115", "#c49646", "#ad9e7a"],
        btnStandardText: "BY HIS WILL ALONE",
        btnAdvancedText: "THE TEN THOUSAND STRIKE",
        divider: "#9a1115"
    },
    chaos_undivided: {
        textLight: "#dfb065",
        textMuted: "#a6834b",
        inputBg: "#e6d5b8",
        mid: "#2b2b2b",
        midHover: "#1a1a1a",
        btnStandard: "#9a1115",
        btnStandardHover: "#730c0f",
        accent: "#d99c2b",
        accentGlow: "rgba(217, 156, 43, 0.4)",
        chartColors: ["#dfb065", "#d99c2b", "#9a1115", "#595959", "#a6834b"],
        btnStandardText: "DEATH TO THE FALSE EMPEROR",
        btnAdvancedText: "LET THE GALAXY BURN",
        divider: "#9a1115"
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

    root.style.setProperty('--bg-color', "#0F1115");
    root.style.setProperty('--surface-color', "#1A1D24");
    root.style.setProperty('--surface-hover', "#242830");
    root.style.setProperty('--border-color', "#38424D");
    root.style.setProperty('--danger-red', "#E63946");

    root.style.setProperty('--theme-text-light', theme.textLight);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-input-bg', theme.inputBg);

    root.style.setProperty('--theme-mid', theme.mid);
    root.style.setProperty('--theme-mid-hover', theme.midHover);
    root.style.setProperty('--theme-btn-standard', theme.btnStandard);
    root.style.setProperty('--theme-btn-standard-hover', theme.btnStandardHover);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-accent-glow', theme.accentGlow);
    root.style.setProperty('--theme-divider', theme.divider);

    const calcBtn = document.getElementById("calculate-btn");
    if (calcBtn) calcBtn.textContent = theme.btnStandardText;
    const advBtn = document.getElementById("advanced-analytics-btn");
    if (advBtn) advBtn.textContent = theme.btnAdvancedText;

    localStorage.setItem("40kTheme", themeKey);
}