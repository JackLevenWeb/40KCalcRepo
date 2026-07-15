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
            label: 'Models Killed (At Least)',
            data: cumulativeKilled,
            borderColor: theme.chartColors[1],
            backgroundColor: theme.chartColors[1] + '70',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        },
        {
            label: 'Damage Dealt (At Least)',
            data: cumulativeDamage,
            borderColor: theme.chartColors[0],
            backgroundColor: theme.chartColors[0] + '70',
            fill: true,
            borderWidth: 3, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        }
    ];

    //sort by y axis sum to order chart drawing order
    for (const item of datasets) {
        item.areaSum = item.data.reduce((accum, value) => accum + value, 0);
    }

    datasets.sort((a, b) => {
        return a.areaSum - b.areaSum;

    });



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
                legend: {
                    display: true,
                    labels: { color: '#fff' },
                    // cursor to pointer on hover
                    onHover: function (event, legendItem, legend) {
                        event.native.target.style.cursor = 'pointer';
                    },
                    onLeave: function (event, legendItem, legend) {
                        event.native.target.style.cursor = 'default';
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)',
                    titleColor: theme.chartColors[0],
                    bodyColor: '#DAE6EF',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    borderColor: function (context) {
                        if (context.tooltip.dataPoints && context.tooltip.dataPoints.length > 0) {
                            return context.tooltip.dataPoints[0].dataset.borderColor;
                        }
                        return theme.chartColors[2];
                    },
                    callbacks: {

                        title: function () { return null; },


                        label: function (context) {
                            const xValue = context.label;
                            const labelText = context.dataset.label;
                            const percentage = context.raw.toFixed(2);

                            return `${xValue} ${labelText}: ${percentage}%`;
                        }
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

        const count = cumulativeArray.reduce((accum, value) => accum + value, 0);

        let displayLabel = ModLabels[modName] || modName;
        if (modName === "Base" && category !== "Save") displayLabel = "Base Profile";

        const assignedColor = theme.chartColors[index % theme.chartColors.length];

        return {
            label: displayLabel,
            data: cumulativeArray,
            borderColor: assignedColor,
            backgroundColor: assignedColor + '70',
            fill: true,
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 5,
            cubicInterpolationMode: 'monotone',
            borderDash: displayLabel.includes("Target:") ? [5, 5] : [],
            areaSum: count
        };
    });

    datasets.sort((a, b) => {
        return a.areaSum - b.areaSum;
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
                legend: {
                    display: true,
                    labels: { color: '#fff' },
                    // Change cursor to pointer (hand) on hover
                    onHover: function (event, legendItem, legend) {
                        event.native.target.style.cursor = 'pointer';
                    },
                    onLeave: function (event, legendItem, legend) {
                        event.native.target.style.cursor = 'default';
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)',
                    titleColor: theme.chartColors[0],
                    bodyColor: '#DAE6EF',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    borderColor: function (context) {
                        if (context.tooltip.dataPoints && context.tooltip.dataPoints.length > 0) {
                            return context.tooltip.dataPoints[0].dataset.borderColor;
                        }
                        return theme.chartColors[2];
                    },
                    callbacks: {

                        title: function () { return null; },


                        label: function (context) {
                            const xValue = context.label;
                            const labelText = context.dataset.label;
                            const percentage = context.raw.toFixed(2);

                            return `${xValue} ${category}s (${labelText}: ${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}