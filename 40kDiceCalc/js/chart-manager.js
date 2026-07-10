// handles the rendering and updating of all chart.js visual graphs.

import { ModLabels } from './db-manager.js';

let damageChartInstance = null;




// standard chart
export function renderChart(distribution, totalRuns) {
    const ctx = document.getElementById('damageChart').getContext('2d');

    if (damageChartInstance) {
        damageChartInstance.destroy();
    }

    const rawDamageNumbers = Object.keys(distribution).map(Number).sort((a, b) => a - b);
    const minDamage = rawDamageNumbers[0] || 0;
    const maxDamage = rawDamageNumbers[rawDamageNumbers.length - 1] || 0;

    const chartLabels = [];
    const exactData = [];
    const cumulativeData = [];

    for (let i = minDamage; i <= maxDamage; i++) {
        chartLabels.push(i);
        const occurrenceCount = distribution[i] || 0;
        exactData.push((occurrenceCount / totalRuns) * 100);
    }

    let runningTotal = 0;
    for (let i = exactData.length - 1; i >= 0; i--) {
        runningTotal += exactData[i];
        cumulativeData[i] = runningTotal;
    }


    const datasets = [
        {
            label: 'Exact Chance',
            data: exactData,
            borderColor: '#9B2226',
            backgroundColor: 'rgba(155, 34, 38, 0.1)',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        },
        {
            label: 'At Least (Cumulative)',
            data: cumulativeData,
            borderColor: '#9ac1df',
            backgroundColor: 'rgba(154, 193, 223, 0.2)',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
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
                    title: { display: true, text: 'Total Damage Done', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: 'Probability (%)', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)',
                    titleColor: '#9ac1df',
                    bodyColor: '#DAE6EF',
                    borderColor: '#C48235',
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

    // only allow rows matching the category AND allowed mods
    const categoryRows = sqlRows.filter(r => r[2] === category && allowedMods.includes(r[0]));

    // fix the X-Axis scale
    let minVal = 0, maxVal = 0;
    categoryRows.forEach(r => {
        if (r[1] > maxVal) maxVal = r[1];
    });

    //acounting for when no damage can be dealt across all sims
    if (maxVal === 0) {
        maxVal = 1;
        let warningColur = "#39FF14"
        let warningText = category === "ModelsKilled" ? "(ZERO MODELS KILLED)" : "(ZERO IMPACT)";
        const card = canvasElement.closest('.report-card');

        if (card) {
            const titleElement = card.querySelector('h3');
            if (titleElement && !titleElement.innerHTML.includes(warningText)) {
                titleElement.innerHTML += ` <span style="color: ${warningColur}; font-size: 0.55rem;">${warningText}</span>`;
            }
        }

    }

    const chartLabels = [];
    for (let i = minVal; i <= maxVal; i++) chartLabels.push(i);

    //  build
    const datasets = allowedMods.map((modName, index) => {
        const modRows = categoryRows.filter(r => r[0] === modName);

        // map exact values to the X-Axis so lines draw correctly
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
        //only want "AP-2 in profile for saves graph"
        let displayLabel = ModLabels[modName] || modName;

        if (modName === "Base" && category !== "Save") {
            displayLabel = "Base Profile";
        }

        const colors = ['#8C9BA8', '#9B2226', '#9ac1df', '#C48235', '#55efc4'];
        return {
            label: displayLabel,
            data: cumulativeArray,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '22',
            fill: true,
            borderWidth: 2, tension: 0.1, pointRadius: 0, pointHoverRadius: 5, cubicInterpolationMode: 'monotone'
        };
    });


    // draw
    new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,


            interaction: { mode: 'nearest', intersect: false },

            scales: {
                x: {
                    title: { display: true, text: `Total Successful ${category}s`, color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: `At Least - (%) Chance of ${category}`, color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' },
                    beginAtZero: true,

                    max: 100
                }
            },
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)', titleColor: '#9ac1df', bodyColor: '#DAE6EF',
                    borderColor: '#C48235', borderWidth: 1, padding: 12,
                    callbacks: {
                        label: function (context) { return context.dataset.label + ': ' + context.raw.toFixed(2) + '%'; }
                    }
                }
            }
        }
    });
}
