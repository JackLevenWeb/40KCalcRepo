// manages dynamic color palettes, fonts, and css variable injection

export const Themes = {
    space_wolves: {
        name: "Space Wolves",
        fontTitle: "'Uncial Antiqua', cursive",
        fontHeader: "'Cinzel', serif",
        fontBody: "'Roboto', sans-serif",
        colors: {
            bg: "#0F1115",
            surface: "#1A1D24",
            surfaceHover: "#242830",
            border: "#38424D",
            textMain: "#9ac1df",
            textMuted: "#8C9BA8",
            accentPrimary: "#9ac1df", // ice blue
            accentSecondary: "#C48235", // bronze
            accentDanger: "#9B2226", // red
            btnBg: "rgb(74, 99, 123)",
            btnHover: "#293846",
            // highly distinct chart colors: blue, bronze, red, gold, steel
            chartColors: ['#9ac1df', '#C48235', '#9B2226', '#E2A958', '#7A8FA6']
        },
        btnStandard: "FOR THE ALL FATHER! (Standard Sim)",
        btnAdvanced: "FOR RUSS! (Advanced Sim)"
    },
    necrons: {
        name: "Necrons",
        fontTitle: "'Orbitron', sans-serif",
        fontHeader: "'Rajdhani', sans-serif",
        fontBody: "'Roboto', sans-serif",
        colors: {
            bg: "#0A0D0B",
            surface: "#141A16",
            surfaceHover: "#1E2922",
            border: "#2A4032",
            textMain: "#E0FFE0",
            textMuted: "#66B39A",
            accentPrimary: "#8FE07F", // neon green
            accentSecondary: "#D4AF37", // brass/gold
            accentDanger: "#1F6A3A", // deep green
            btnBg: "#1F6A3A",
            btnHover: "#144525",
            // distinct chart colors: neon green, brass, silver, deep green, white
            chartColors: ['#8FE07F', '#D4AF37', '#A0A0A0', '#1F6A3A', '#FFFFFF']
        },
        btnStandard: "Awaken (Standard Sim)",
        btnAdvanced: "We remember. We endure. (Advanced Sim)"
    },
    tyranids: {
        name: "Tyranids",
        fontTitle: "'Creepster', cursive",
        fontHeader: "'Nosifer', cursive",
        fontBody: "'Roboto', sans-serif",
        colors: {
            bg: "#120808",
            surface: "#1C1010",
            surfaceHover: "#2B1717",
            border: "#4A2020",
            textMain: "#F2E6DD",
            textMuted: "#E6C9B0",
            accentPrimary: "#C92A2A", // blood red
            accentSecondary: "#9B4A9E", // alien purple
            accentDanger: "#E6C9B0", // bone
            btnBg: "#7A1C1C",
            btnHover: "#4A0E0E",
            // distinct chart colors: red, purple, bone, pink, dark crimson
            chartColors: ['#C92A2A', '#9B4A9E', '#E6C9B0', '#D182C0', '#7A1C1C']
        },
        btnStandard: "SSSPlllSSSHT! (Standard Sim)",
        btnAdvanced: "RRAAAWWR! (Advanced Sim)"
    },
    votann: {
        name: "Leagues of Votann",
        fontTitle: "'Audiowide', sans-serif",
        fontHeader: "'Montserrat', sans-serif",
        fontBody: "'Roboto', sans-serif",
        colors: {
            bg: "#080A0D",
            surface: "#12161D",
            surfaceHover: "#1A212B",
            border: "#2F5AA0",
            textMain: "#FFFFFF",
            textMuted: "#8BA3C7",
            accentPrimary: "#2AA6D6", // cyan
            accentSecondary: "#F58F29", // industrial orange
            accentDanger: "#E63946", // warning red
            btnBg: "#2F5AA0",
            btnHover: "#1B3F73",
            // distinct chart colors: cyan, orange, steel, dark blue, white
            chartColors: ['#2AA6D6', '#F58F29', '#8BA3C7', '#2F5AA0', '#FFFFFF']
        },
        btnStandard: "Data First, Bodies Second (Standard Sim)",
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

    root.style.setProperty('--btn-bg', theme.colors.btnBg);
    root.style.setProperty('--btn-hover', theme.colors.btnHover);

    root.style.setProperty('--font-title', theme.fontTitle);
    root.style.setProperty('--font-header', theme.fontHeader);
    root.style.setProperty('--font-body', theme.fontBody);

    document.body.style.fontFamily = theme.fontBody;
    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.textMain;

    // dynamic styles for inputs, dropdowns, and aggressively targeting main buttons
    let styleBlock = document.getElementById("dynamic-theme-styles");
    if (!styleBlock) {
        styleBlock = document.createElement("style");
        styleBlock.id = "dynamic-theme-styles";
        document.head.appendChild(styleBlock);
    }
    styleBlock.innerHTML = `
        h1, h2, h3 { font-family: var(--font-title); }
        h4, h5, h6 { font-family: var(--font-header); }
        
        input, select, #theme-dropdown {
            background-color: var(--surface-color) !important;
            color: var(--text-main) !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-body);
            transition: all 0.2s ease;
        }
        input:focus, select:focus {
            border-color: var(--accent-primary) !important;
            outline: none;
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
        }
        
        /* force main buttons to adopt theme colors */
        #calculate-btn, #advanced-analytics-btn, #add-attacker-btn, 
        #export-roster-btn, #import-roster-btn, .btn-primary {
            background-color: var(--btn-bg) !important;
            color: #ffffff !important;
            border: 1px solid var(--border-color) !important;
            font-family: var(--font-header) !important;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        #calculate-btn:hover, #advanced-analytics-btn:hover, #add-attacker-btn:hover, 
        #export-roster-btn:hover, #import-roster-btn:hover, .btn-primary:hover {
            background-color: var(--btn-hover) !important;
            border-color: var(--accent-primary) !important;
        }

        #clear-dashboard-btn {
            background-color: rgba(0,0,0,0.3) !important;
            color: var(--accent-danger) !important;
            border: 1px solid var(--accent-danger) !important;
            font-family: var(--font-header) !important;
        }
        #clear-dashboard-btn:hover {
            background-color: var(--accent-danger) !important;
            color: #ffffff !important;
        }

        .report-card, .attacker-module {
            transition: border-color 0.3s ease;
        }
        .report-card:hover, .attacker-module:hover {
            border-color: var(--accent-secondary);
        }
    `;

    // update static button texts
    const calcBtn = document.getElementById("calculate-btn");
    if (calcBtn) calcBtn.textContent = theme.btnStandard;

    const advBtn = document.getElementById("advanced-analytics-btn");
    if (advBtn) advBtn.textContent = theme.btnAdvanced;

    const dropdown = document.getElementById("theme-dropdown");
    if (dropdown) dropdown.value = themeKey;

    localStorage.setItem("40kTheme", themeKey);
}