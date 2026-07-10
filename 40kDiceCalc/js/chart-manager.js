// handles the rendering and updating of all chart.js visual graphs.

import { ModLabels } from './db-manager.js';
import { getCurrentTheme } from './theme-manager.js';

let damageChartInstance = null;

// standard chart
export function renderChart(damageDistribution, killedDistribution, totalRuns) {
    const ctx = document.getElementById('damageChart').getContext('2d');
    const theme = getCurrentTheme();

    if (damageChartInstance) {
        damageChartInstance.destroy();
    }

    const rawDamageNumbers = Object.keys(damageDistribution).map(Number);
    const rawKilledNumbers = Object.keys(killedDistribution).map(Number);
    const maxVal = Math.max(...rawDamageNumbers, ...rawKilledNumbers, 0);

    const chartLabels = [];
    const exactDamageData = [];
    const exactKilledData = [];
    const cumulativeDamage = [];
    const cumulativeKilled = [];

    for (let i = 0; i <= maxVal; i++) {
        chartLabels.push(i);
        const dmgCount = damageDistribution[i] || 0;
        const killCount = killedDistribution[i] || 0;
        exactDamageData.push((dmgCount / totalRuns) * 100);
        exactKilledData.push((killCount / totalRuns) * 100);
    }

    let runningDmgTotal = 0;
    let runningKillTotal = 0;
    for (let i = exactDamageData.length - 1; i >= 0; i--) {
        runningDmgTotal += exactDamageData[i];
        cumulativeDamage[i] = runningDmgTotal;

        runningKillTotal += exactKilledData[i];
        cumulativeKilled[i] = runningKillTotal;
    }

    const datasets = [
        {
            label: 'At Least X Models Killed',
            data: cumulativeKilled,
            borderColor: theme.colors.accentSecondary,
            backgroundColor: theme.colors.accentSecondary + '22',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        },
        {
            label: 'At Least X Damage',
            data: cumulativeDamage,
            borderColor: theme.colors.accentPrimary,
            backgroundColor: theme.colors.accentPrimary + '22',
            fill: true,
            borderWidth: 3, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        }
    ];

    damageChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    title: { display: true, text: 'Total Amount (Damage or Models)', color: theme.colors.textMuted, font: { weight: 'bold', family: theme.fontBody } },
                    ticks: { color: theme.colors.textMain, font: { family: theme.fontBody } },
                    grid: { color: theme.colors.border }
                },
                y: {
                    title: { display: true, text: 'Probability (%)', color: theme.colors.textMuted, font: { weight: 'bold', family: theme.fontBody } },
                    ticks: { color: theme.colors.textMain, font: { family: theme.fontBody } },
                    grid: { color: theme.colors.border },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: theme.colors.textMain, font: { family: theme.fontBody } } },
                tooltip: {
                    backgroundColor: theme.colors.bg,
                    titleColor: theme.colors.textMain,
                    bodyColor: theme.colors.textMuted,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.raw.toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

// advChart
export function renderAdvancedChart(canvasElement, category, sqlRows, totalRuns, allowedMods) {
    const ctx = canvasElement.getContext('2d');
    const theme = getCurrentTheme();
    const categoryRows = sqlRows.filter(r => r[2] === category && allowedMods.includes(r[0]));

    let minVal = 0, maxVal = 0;
    categoryRows.forEach(r => {
        if (r[1] > maxVal) maxVal = r[1];
    });

    if (maxVal === 0) {
        maxVal = 1;
        let warningText = category === "ModelsKilled" ? "(ZERO KILLS)" : "(ZERO IMPACT)";
        const card = canvasElement.closest('.report-card');
        if (card) {
            const titleElement = card.querySelector('h4');
            if (titleElement && !titleElement.innerHTML.includes(warningText)) {
                titleElement.innerHTML += ` <span style="color: ${theme.colors.accentSecondary}; font-size: 0.55rem;">${warningText}</span>`;
            }
        }
    }

    const chartLabels = [];
    for (let i = minVal; i <= maxVal; i++) chartLabels.push(i);

    const datasets = allowedMods.map((modName, index) => {
        const modRows = categoryRows.filter(r => r[0] === modName);
        const dataArray = chartLabels.map(label => {
            const row = modRows.find(r => r[1] === label);
            return row ? (row[3] / totalRuns) * 100 : 0;
        });

        const cumulativeArray = [];
        let runningTotal = 0;
        for (let i = dataArray.length - 1; i >= 0; i--) {
            runningTotal += dataArray[i];
            cumulativeArray[i] = runningTotal;
        }

        let displayLabel = ModLabels[modName] || modName;
        if (modName === "Base" && category !== "Save") displayLabel = "Base Profile";

        const cIndex = index % theme.colors.chartColors.length;
        const assignedColor = theme.colors.chartColors[cIndex];

        return {
            label: displayLabel,
            data: cumulativeArray,
            borderColor: assignedColor,
            backgroundColor: assignedColor + '1A',
            fill: true,
            // draw base line thicker and strictly on top
            borderWidth: index === 0 ? 3 : 2,
            order: index === 0 ? 0 : 1,
            tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    title: { display: true, text: `Total Successful ${category}s`, color: theme.colors.textMuted, font: { weight: 'bold', family: theme.fontBody } },
                    ticks: { color: theme.colors.textMain, font: { family: theme.fontBody } },
                    grid: { color: theme.colors.border }
                },
                y: {
                    title: { display: true, text: `At Least - (%) Chance of ${category}`, color: theme.colors.textMuted, font: { weight: 'bold', family: theme.fontBody } },
                    ticks: { color: theme.colors.textMain, font: { family: theme.fontBody } },
                    grid: { color: theme.colors.border },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: theme.colors.textMain, font: { family: theme.fontBody } } },
                tooltip: {
                    backgroundColor: theme.colors.bg, titleColor: theme.colors.textMain, bodyColor: theme.colors.textMuted,
                    borderColor: theme.colors.border, borderWidth: 1, padding: 12,
                    callbacks: {
                        label: function (context) { return context.dataset.label + ': ' + context.raw.toFixed(2) + '%'; }
                    }
                }
            }
        }
    });
}