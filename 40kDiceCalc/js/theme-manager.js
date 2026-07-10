// manages dynamic color palettes, fonts, and css variable injection

export const Themes = {
    space_wolves: {
        name: "Space Wolves",
        fontTitle: "'Uncial Antiqua', cursive",
        fontHeader: "'Cinzel', serif",
        fontBody: "'Roboto', -apple-system, sans-serif",
        colors: {
            bg: "#0F1115",
            surface: "#1A1D24",
            surfaceHover: "#242830",
            border: "#38424D",
            textMain: "#9ac1df",
            textMuted: "#8C9BA8",
            accentPrimary: "#9ac1df", // ice blue
            accentSecondary: "#C48235", // bronze
            accentDanger: "#9B2226", // blood claw red
            btnStdBg: "#9B2226", // distinct red button
            btnStdHover: "#7A1A1E",
            btnAdvBg: "rgb(74, 99, 123)", // distinct armor blue button
            btnAdvHover: "#293846",
            shadow: "rgba(154, 193, 223, 0.15)",
            chartColors: ['#9ac1df', '#C48235', '#9B2226', '#E2A958', '#7A8FA6']
        },
        btnStandard: "FOR THE ALL FATHER! (Standard Sim)",
        btnAdvanced: "FOR RUSS! (Advanced Sim)"
    },
    necrons: {
        name: "Necrons",
        fontTitle: "'Orbitron', sans-serif",
        fontHeader: "'Orbitron', sans-serif",
        fontBody: "'Roboto', -apple-system, sans-serif",
        colors: {
            bg: "#0F1115",
            surface: "#1A1D24",
            surfaceHover: "#242830",
            border: "#38424D",
            textMain: "#E0FFE0",
            textMuted: "#66B39A",
            accentPrimary: "#8FE07F", // neon green
            accentSecondary: "#D4AF37", // brass gold
            accentDanger: "#E63946",
            btnStdBg: "#1F6A3A", // metallic caliban green
            btnStdHover: "#144525",
            btnAdvBg: "#D4AF37", // pure brass button
            btnAdvHover: "#AA8420",
            shadow: "rgba(143, 224, 127, 0.15)",
            chartColors: ['#8FE07F', '#D4AF37', '#00E5FF', '#1F6A3A', '#A0A0A0']
        },
        btnStandard: "Awaken (Standard Sim)",
        btnAdvanced: "We remember. We endure. (Advanced Sim)"
    },
    tyranids: {
        name: "Tyranids",
        fontTitle: "'Creepster', cursive",
        fontHeader: "'Nosifer', cursive",
        fontBody: "'Roboto', -apple-system, sans-serif",
        colors: {
            bg: "#0F1115",
            surface: "#1A1D24",
            surfaceHover: "#242830",
            border: "#38424D",
            textMain: "#F2E6DD",
            textMuted: "#E6C9B0",
            accentPrimary: "#C92A2A", // crimson
            accentSecondary: "#9B4A9E", // chitin purple
            accentDanger: "#E63946",
            btnStdBg: "#9B4A9E", // chitin purple button
            btnStdHover: "#723275",
            btnAdvBg: "#C92A2A", // raw crimson button
            btnAdvHover: "#991D1D",
            shadow: "rgba(201, 42, 42, 0.15)",
            chartColors: ['#C92A2A', '#9B4A9E', '#E6C9B0', '#D182C0', '#7A1C1C']
        },
        btnStandard: "SSSPlllSSSHT! (Standard Sim)",
        btnAdvanced: "RRAAAWWR! (Advanced Sim)"
    },
    votann: {
        name: "Leagues of Votann",
        fontTitle: "'Audiowide', sans-serif",
        fontHeader: "'Audiowide', sans-serif",
        fontBody: "'Roboto', -apple-system, sans-serif",
        colors: {
            bg: "#0F1115",
            surface: "#1A1D24",
            surfaceHover: "#242830",
            border: "#38424D",
            textMain: "#FFFFFF",
            textMuted: "#8BA3C7",
            accentPrimary: "#2AA6D6", // league cyan
            accentSecondary: "#F58F29", // industrial orange
            accentDanger: "#E63946",
            btnStdBg: "#F58F29", // high vis orange button
            btnStdHover: "#C46B12",
            btnAdvBg: "#2F5AA0", // macragge blue button
            btnAdvHover: "#1B3F73",
            shadow: "rgba(42, 166, 214, 0.15)",
            chartColors: ['#2AA6D6', '#F58F29', '#8BA3C7', '#2F5AA0', '#FFFFFF']
        },
        btnStandard: "Data First, Bodies Second",
        btnAdvanced: "Efficiency Above All (Advanced Sim)"
    }
};

let currentThemeKey = "space_wolves";

export function getCurrentTheme() {
    return Themes[currentThemeKey];
}

export function applyTheme(themeKey) {
    if (!Themes[themeKey]) themeKey = "space_wolves";
    currentThemeKey = themeKey;
    const theme = Themes[themeKey];

    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.colors.bg);
    root.style.setProperty('--surface-color', theme.colors.surface);
    root.style.setProperty('--surface-hover', theme.colors.surfaceHover);
    root.style.setProperty('--border-color', theme.colors.border);
    root.style.setProperty('--text-main', theme.colors.textMain);
    root.style.setProperty('--text-muted', theme.colors.textMuted);
    root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
    root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
    root.style.setProperty('--accent-danger', theme.colors.accentDanger);

    root.style.setProperty('--btn-std-bg', theme.colors.btnStdBg);
    root.style.setProperty('--btn-std-hover', theme.colors.btnStdHover);
    root.style.setProperty('--btn-adv-bg', theme.colors.btnAdvBg);
    root.style.setProperty('--btn-adv-hover', theme.colors.btnAdvHover);

    root.style.setProperty('--theme-shadow', theme.colors.shadow);
    root.style.setProperty('--font-title', theme.fontTitle);
    root.style.setProperty('--font-header', theme.fontHeader);
    root.style.setProperty('--font-body', theme.fontBody);

    document.body.style.fontFamily = theme.fontBody;
    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.textMain;

    let styleBlock = document.getElementById("dynamic-theme-styles");
    if (!styleBlock) {
        styleBlock = document.createElement("style");
        styleBlock.id = "dynamic-theme-styles";
        document.head.appendChild(styleBlock);
    }
    styleBlock.innerHTML = `
        h1, h2, h3, .main-title-header { font-family: var(--font-title) !important; color: var(--accent-primary) !important; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        h4, h5, h6, .section-heading-label { font-family: var(--font-header) !important; color: var(--accent-primary) !important; }
        
        input, select, #theme-dropdown {
            background-color: var(--bg-color) !important;
            color: #ffffff !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-body) !important;
            transition: all 0.2s ease;
        }
        input:focus, select:focus {
            border-color: var(--accent-primary) !important;
            outline: none;
            box-shadow: 0 0 6px var(--theme-shadow);
        }
        
        #calculate-btn {
            background-color: var(--btn-std-bg) !important;
            color: #ffffff !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-title) !important;
            font-size: 1.2rem;
            font-weight: bold;
            box-shadow: 0 4px 10px var(--theme-shadow);
        }
        #calculate-btn:hover {
            background-color: var(--btn-std-hover) !important;
            border-color: var(--accent-primary) !important;
        }

        #advanced-analytics-btn {
            background-color: var(--btn-adv-bg) !important;
            color: #ffffff !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-title) !important;
            font-size: 1.2rem;
            font-weight: bold;
            box-shadow: 0 4px 10px var(--theme-shadow);
        }
        #advanced-analytics-btn:hover {
            background-color: var(--btn-adv-hover) !important;
            border-color: var(--accent-primary) !important;
        }

        #add-attacker-btn, #export-roster-btn, #import-roster-btn, .btn-primary {
            background-color: var(--surface-hover) !important;
            color: var(--text-main) !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-body) !important;
        }
        #add-attacker-btn:hover, #export-roster-btn:hover, #import-roster-btn:hover, .btn-primary:hover {
            border-color: var(--accent-primary) !important;
            background-color: var(--surface-color) !important;
        }

        #clear-dashboard-btn {
            background-color: rgba(0,0,0,0.3) !important;
            color: var(--accent-danger) !important;
            border: 1px solid var(--accent-danger) !important;
            font-family: var(--font-body) !important;
        }
        #clear-dashboard-btn:hover {
            background-color: var(--accent-danger) !important;
            color: #ffffff !important;
        }

        .panel {
            background-color: var(--surface-color) !important;
            border: 1px solid var(--border-color) !important;
            border-top: 4px solid var(--accent-primary) !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        }
        .report-card, .attacker-module {
            background-color: var(--surface-color) !important;
            border: 1px solid var(--border-color) !important;
        }
        .report-card:hover, .attacker-module:hover {
            border-color: var(--accent-secondary) !important;
        }
        
        .global-rules-panel {
            background-color: var(--surface-hover) !important;
            border: 1px dashed var(--accent-secondary) !important;
        }
    `;

    const calcBtn = document.getElementById("calculate-btn");
    if (calcBtn) calcBtn.textContent = theme.btnStandard;

    const advBtn = document.getElementById("advanced-analytics-btn");
    if (advBtn) advBtn.textContent = theme.btnAdvanced;

    const dropdown = document.getElementById("theme-dropdown");
    if (dropdown) dropdown.value = themeKey;

    localStorage.setItem("40kTheme", themeKey);
}