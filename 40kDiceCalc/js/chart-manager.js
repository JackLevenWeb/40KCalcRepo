// handles the rendering and updating of all chart.js visual graphs.

import { ModLabels } from './db-manager.js';
import { getCurrentTheme } from './theme-manager.js';

let damageChartInstance = null;

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
            borderColor: theme.chartColors[1],
            backgroundColor: theme.chartColors[1] + '22',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        },
        {
            label: 'At Least X Damage',
            data: cumulativeDamage,
            borderColor: theme.chartColors[0],
            backgroundColor: theme.chartColors[0] + '22',
            fill: true,
            borderWidth: 3, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        }
    ];

    damageChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    title: { display: true, text: 'Total Amount (Damage or Models)', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: theme.chartColors[0] },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: 'Probability (%)', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: theme.chartColors[0] },
                    grid: { color: '#38424D' },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)', titleColor: theme.chartColors[0], bodyColor: '#DAE6EF',
                    borderColor: theme.chartColors[2], borderWidth: 1, padding: 12,
                    callbacks: {
                        label: function (context) { return context.dataset.label + ': ' + context.raw.toFixed(2) + '%'; }
                    }
                }
            }
        }
    });
}

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
        let warningText = category === "ModelsKilled" ? "(ZERO MODELS KILLED)" : "(ZERO IMPACT)";
        const card = canvasElement.closest('.report-card');
        if (card) {
            const titleElement = card.querySelector('h4');
            if (titleElement && !titleElement.innerHTML.includes(warningText)) {
                titleElement.innerHTML += ` <span style="color: ${theme.chartColors[1]}; font-size: 0.55rem;">${warningText}</span>`;
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

        const assignedColor = theme.chartColors[index % theme.chartColors.length];

        return {
            label: displayLabel,
            data: cumulativeArray,
            borderColor: assignedColor,
            backgroundColor: assignedColor + '22',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
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
                    title: { display: true, text: `Total Successful ${category}s`, color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: theme.chartColors[0] },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: `At Least - (%) Chance of ${category}`, color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: theme.chartColors[0] },
                    grid: { color: '#38424D' },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)', titleColor: theme.chartColors[0], bodyColor: '#DAE6EF',
                    borderColor: theme.chartColors[2], borderWidth: 1, padding: 12,
                    callbacks: {
                        label: function (context) { return context.dataset.label + ': ' + context.raw.toFixed(2) + '%'; }
                    }
                }
            }
        }
    });
}