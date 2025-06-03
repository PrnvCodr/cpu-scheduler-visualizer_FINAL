// Application state
const appState = {
    processes: [],
    currentAlgorithm: 'FCFS',
    timeQuantum: 3,
    priorityOrder: 'higher',
    simulationResults: null,
    currentTime: 0,
    isPlaying: false,
    playInterval: null,
    theme: 'light'
};

// Default data from JSON
const defaultProcesses = [
    {id: 1, name: "P1", arrivalTime: 0, burstTime: 8, priority: 3},
    {id: 2, name: "P2", arrivalTime: 1, burstTime: 4, priority: 1},
    {id: 3, name: "P3", arrivalTime: 2, burstTime: 9, priority: 4},
    {id: 4, name: "P4", arrivalTime: 3, burstTime: 5, priority: 2}
];

const processColors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
];

const algorithmInfo = {
    "FCFS": { name: "First Come First Serve", preemptive: false },
    "SJF_NP": { name: "Shortest Job First (Non-Preemptive)", preemptive: false },
    "SJF_P": { name: "Shortest Remaining Time First (Preemptive)", preemptive: true },
    "RR": { name: "Round Robin", preemptive: true, requiresQuantum: true },
    "PRIORITY_NP": { name: "Priority Scheduling (Non-Preemptive)", preemptive: false },
    "PRIORITY_P": { name: "Priority Scheduling (Preemptive)", preemptive: true },
    "MLQ": { name: "Multilevel Queue", preemptive: true, complex: true }
};

// Utility functions
function generateId() {
    return Date.now() + Math.random();
}

function validateProcess(process) {
    return process.name && process.name.trim() !== '' &&
           !isNaN(process.arrivalTime) && process.arrivalTime >= 0 && 
           !isNaN(process.burstTime) && process.burstTime > 0 && 
           !isNaN(process.priority) && process.priority > 0;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Process management
function addProcess(processData) {
    const process = {
        id: generateId(),
        name: processData.name?.trim() || `P${appState.processes.length + 1}`,
        arrivalTime: parseInt(processData.arrivalTime) || 0,
        burstTime: parseInt(processData.burstTime) || 1,
        priority: parseInt(processData.priority) || 1,
        color: processColors[appState.processes.length % processColors.length]
    };

    if (validateProcess(process)) {
        appState.processes.push(process);
        updateProcessList();
        clearForm();
        clearError();
        return true;
    }
    return false;
}

function removeProcess(processId) {
    appState.processes = appState.processes.filter(p => p.id !== processId);
    updateProcessList();
}

function clearAllProcesses() {
    appState.processes = [];
    appState.simulationResults = null;
    updateProcessList();
    updateVisualization();
    updateResults();
}

function loadDefaultProcesses() {
    appState.processes = defaultProcesses.map((p, index) => ({
        ...p,
        id: generateId(),
        color: processColors[index % processColors.length]
    }));
    updateProcessList();
    clearError();
}

function generateRandomProcesses() {
    const count = Math.floor(Math.random() * 5) + 3; // 3-7 processes
    const processes = [];
    
    for (let i = 0; i < count; i++) {
        processes.push({
            id: generateId(),
            name: `P${i + 1}`,
            arrivalTime: Math.floor(Math.random() * 10),
            burstTime: Math.floor(Math.random() * 10) + 1,
            priority: Math.floor(Math.random() * 5) + 1,
            color: processColors[i % processColors.length]
        });
    }
    
    appState.processes = processes;
    updateProcessList();
    clearError();
}

// Scheduling Algorithms
function fcfsScheduling(processes) {
    const timeline = [];
    const processQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;

    for (const process of processQueue) {
        const startTime = Math.max(currentTime, process.arrivalTime);
        const endTime = startTime + process.burstTime;
        
        timeline.push({
            processId: process.id,
            processName: process.name,
            startTime,
            endTime,
            color: process.color
        });
        
        currentTime = endTime;
    }
    
    return timeline;
}

function sjfScheduling(processes, preemptive = false) {
    const timeline = [];
    const processQueue = processes.map(p => ({...p, remainingTime: p.burstTime}));
    let currentTime = 0;
    let completed = 0;

    if (!preemptive) {
        // Non-preemptive SJF
        const available = [];
        let i = 0;
        
        while (completed < processes.length) {
            // Add newly arrived processes
            while (i < processQueue.length && processQueue[i].arrivalTime <= currentTime) {
                available.push(processQueue[i]);
                i++;
            }
            
            if (available.length === 0) {
                if (i < processQueue.length) {
                    currentTime = processQueue[i].arrivalTime;
                } else {
                    break;
                }
                continue;
            }
            
            // Select shortest job
            available.sort((a, b) => a.burstTime - b.burstTime);
            const selectedProcess = available.shift();
            
            const startTime = currentTime;
            const endTime = currentTime + selectedProcess.burstTime;
            
            timeline.push({
                processId: selectedProcess.id,
                processName: selectedProcess.name,
                startTime,
                endTime,
                color: selectedProcess.color
            });
            
            currentTime = endTime;
            completed++;
        }
    } else {
        // Preemptive SJF (SRTF)
        while (completed < processes.length) {
            const available = processQueue.filter(p => 
                p.arrivalTime <= currentTime && p.remainingTime > 0
            );
            
            if (available.length === 0) {
                currentTime++;
                continue;
            }
            
            // Select process with shortest remaining time
            available.sort((a, b) => a.remainingTime - b.remainingTime);
            const selectedProcess = available[0];
            
            const startTime = currentTime;
            selectedProcess.remainingTime--;
            currentTime++;
            
            if (selectedProcess.remainingTime === 0) {
                completed++;
            }
            
            // Add to timeline (merge with previous if same process)
            if (timeline.length > 0 && 
                timeline[timeline.length - 1].processId === selectedProcess.id &&
                timeline[timeline.length - 1].endTime === startTime) {
                timeline[timeline.length - 1].endTime = currentTime;
            } else {
                timeline.push({
                    processId: selectedProcess.id,
                    processName: selectedProcess.name,
                    startTime,
                    endTime: currentTime,
                    color: selectedProcess.color
                });
            }
        }
    }
    
    return timeline;
}

function roundRobinScheduling(processes, quantum) {
    const timeline = [];
    const processQueue = processes.map(p => ({...p, remainingTime: p.burstTime}));
    const readyQueue = [];
    let currentTime = 0;
    let completed = 0;
    let i = 0;

    while (completed < processes.length) {
        // Add newly arrived processes to ready queue
        while (i < processQueue.length && processQueue[i].arrivalTime <= currentTime) {
            readyQueue.push(processQueue[i]);
            i++;
        }
        
        if (readyQueue.length === 0) {
            if (i < processQueue.length) {
                currentTime = processQueue[i].arrivalTime;
            } else {
                break;
            }
            continue;
        }
        
        const currentProcess = readyQueue.shift();
        const startTime = currentTime;
        const timeSlice = Math.min(quantum, currentProcess.remainingTime);
        const endTime = startTime + timeSlice;
        
        timeline.push({
            processId: currentProcess.id,
            processName: currentProcess.name,
            startTime,
            endTime,
            color: currentProcess.color
        });
        
        currentProcess.remainingTime -= timeSlice;
        currentTime = endTime;
        
        // Add newly arrived processes
        while (i < processQueue.length && processQueue[i].arrivalTime <= currentTime) {
            readyQueue.push(processQueue[i]);
            i++;
        }
        
        if (currentProcess.remainingTime > 0) {
            readyQueue.push(currentProcess);
        } else {
            completed++;
        }
    }
    
    return timeline;
}

function priorityScheduling(processes, preemptive = false) {
    const timeline = [];
    const processQueue = processes.map(p => ({...p, remainingTime: p.burstTime}));
    let currentTime = 0;
    let completed = 0;

    const isHigherPriority = (a, b) => {
        if (appState.priorityOrder === 'higher') {
            return b.priority - a.priority; // Higher number = higher priority
        } else {
            return a.priority - b.priority; // Lower number = higher priority
        }
    };

    if (!preemptive) {
        // Non-preemptive Priority
        const available = [];
        let i = 0;
        
        while (completed < processes.length) {
            // Add newly arrived processes
            while (i < processQueue.length && processQueue[i].arrivalTime <= currentTime) {
                available.push(processQueue[i]);
                i++;
            }
            
            if (available.length === 0) {
                if (i < processQueue.length) {
                    currentTime = processQueue[i].arrivalTime;
                } else {
                    break;
                }
                continue;
            }
            
            // Select highest priority process
            available.sort(isHigherPriority);
            const selectedProcess = available.shift();
            
            const startTime = currentTime;
            const endTime = currentTime + selectedProcess.burstTime;
            
            timeline.push({
                processId: selectedProcess.id,
                processName: selectedProcess.name,
                startTime,
                endTime,
                color: selectedProcess.color
            });
            
            currentTime = endTime;
            completed++;
        }
    } else {
        // Preemptive Priority
        while (completed < processes.length) {
            const available = processQueue.filter(p => 
                p.arrivalTime <= currentTime && p.remainingTime > 0
            );
            
            if (available.length === 0) {
                currentTime++;
                continue;
            }
            
            // Select highest priority process
            available.sort(isHigherPriority);
            const selectedProcess = available[0];
            
            const startTime = currentTime;
            selectedProcess.remainingTime--;
            currentTime++;
            
            if (selectedProcess.remainingTime === 0) {
                completed++;
            }
            
            // Add to timeline (merge with previous if same process)
            if (timeline.length > 0 && 
                timeline[timeline.length - 1].processId === selectedProcess.id &&
                timeline[timeline.length - 1].endTime === startTime) {
                timeline[timeline.length - 1].endTime = currentTime;
            } else {
                timeline.push({
                    processId: selectedProcess.id,
                    processName: selectedProcess.name,
                    startTime,
                    endTime: currentTime,
                    color: selectedProcess.color
                });
            }
        }
    }
    
    return timeline;
}

function multilevelQueueScheduling(processes) {
    // Simplified MLQ: System processes (priority 1-2), Interactive (3-4), Batch (5+)
    const systemQueue = processes.filter(p => p.priority <= 2);
    const interactiveQueue = processes.filter(p => p.priority >= 3 && p.priority <= 4);
    const batchQueue = processes.filter(p => p.priority >= 5);
    
    let timeline = [];
    let currentTime = 0;
    
    // Process system queue first (FCFS)
    if (systemQueue.length > 0) {
        const systemTimeline = fcfsScheduling(systemQueue);
        systemTimeline.forEach(block => {
            block.startTime += currentTime;
            block.endTime += currentTime;
        });
        timeline = timeline.concat(systemTimeline);
        currentTime = Math.max(...systemTimeline.map(block => block.endTime));
    }
    
    // Then interactive queue (Round Robin with quantum 2)
    if (interactiveQueue.length > 0) {
        const interactiveTimeline = roundRobinScheduling(interactiveQueue, 2);
        interactiveTimeline.forEach(block => {
            block.startTime += currentTime;
            block.endTime += currentTime;
        });
        timeline = timeline.concat(interactiveTimeline);
        currentTime = Math.max(...interactiveTimeline.map(block => block.endTime));
    }
    
    // Finally batch queue (SJF)
    if (batchQueue.length > 0) {
        const batchTimeline = sjfScheduling(batchQueue, false);
        batchTimeline.forEach(block => {
            block.startTime += currentTime;
            block.endTime += currentTime;
        });
        timeline = timeline.concat(batchTimeline);
    }
    
    return timeline;
}

// Results calculation
function calculateMetrics(processes, timeline) {
    const results = processes.map(process => {
        const processBlocks = timeline.filter(block => block.processId === process.id);
        const completionTime = Math.max(...processBlocks.map(block => block.endTime));
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        const responseTime = Math.min(...processBlocks.map(block => block.startTime)) - process.arrivalTime;
        
        return {
            ...process,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime: Math.max(0, responseTime)
        };
    });
    
    const avgTurnaroundTime = results.reduce((sum, p) => sum + p.turnaroundTime, 0) / results.length;
    const avgWaitingTime = results.reduce((sum, p) => sum + p.waitingTime, 0) / results.length;
    const avgResponseTime = results.reduce((sum, p) => sum + p.responseTime, 0) / results.length;
    
    return {
        processes: results,
        averages: {
            turnaroundTime: parseFloat(avgTurnaroundTime.toFixed(2)),
            waitingTime: parseFloat(avgWaitingTime.toFixed(2)),
            responseTime: parseFloat(avgResponseTime.toFixed(2))
        },
        timeline
    };
}

// Simulation execution
function runSimulation() {
    if (appState.processes.length === 0) {
        showError("Please add at least one process before running simulation.");
        return;
    }
    
    const processes = deepClone(appState.processes);
    let timeline = [];
    
    try {
        switch (appState.currentAlgorithm) {
            case 'FCFS':
                timeline = fcfsScheduling(processes);
                break;
            case 'SJF_NP':
                timeline = sjfScheduling(processes, false);
                break;
            case 'SJF_P':
                timeline = sjfScheduling(processes, true);
                break;
            case 'RR':
                timeline = roundRobinScheduling(processes, appState.timeQuantum);
                break;
            case 'PRIORITY_NP':
                timeline = priorityScheduling(processes, false);
                break;
            case 'PRIORITY_P':
                timeline = priorityScheduling(processes, true);
                break;
            case 'MLQ':
                timeline = multilevelQueueScheduling(processes);
                break;
            default:
                timeline = fcfsScheduling(processes);
        }
        
        if (timeline.length === 0) {
            showError("No timeline generated. Please check your process data.");
            return;
        }
        
        appState.simulationResults = calculateMetrics(processes, timeline);
        appState.currentTime = 0;
        updateVisualization();
        updateResults();
        clearError();
        
    } catch (error) {
        console.error("Simulation error:", error);
        showError("Error running simulation: " + error.message);
    }
}

// UI Update functions
function updateProcessList() {
    const container = document.getElementById('processList');
    
    if (appState.processes.length === 0) {
        container.innerHTML = '<div class="empty-state">No processes added yet</div>';
        return;
    }
    
    container.innerHTML = appState.processes.map(process => `
        <div class="process-item" style="border-left-color: ${process.color}">
            <div class="process-info">
                <div class="process-color" style="background-color: ${process.color}"></div>
                <span class="process-name">${process.name}</span>
                <span class="process-details">
                    AT: ${process.arrivalTime}, BT: ${process.burstTime}, P: ${process.priority}
                </span>
            </div>
            <button class="remove-process" onclick="removeProcess(${process.id})">✕</button>
        </div>
    `).join('');
}

function updateVisualization() {
    const container = document.getElementById('ganttChart');
    const legendContainer = document.getElementById('processLegend');
    const playbackControls = document.getElementById('playbackControls');
    
    if (!appState.simulationResults) {
        container.innerHTML = '<div class="gantt-placeholder"><p class="text-secondary">Run a simulation to see the Gantt chart</p></div>';
        legendContainer.classList.add('hidden');
        playbackControls.classList.add('hidden');
        return;
    }
    
    const { timeline } = appState.simulationResults;
    const maxTime = Math.max(...timeline.map(block => block.endTime));
    
    // Create time markers
    const timeMarkers = [];
    for (let i = 0; i <= maxTime; i++) {
        timeMarkers.push(`
            <div class="gantt-time-marker" style="left: ${(i / maxTime) * 100}%">
                <div class="gantt-time-label">${i}</div>
            </div>
        `);
    }
    
    // Create Gantt chart
    const ganttHTML = `
        <div class="gantt-chart">
            <div class="gantt-timeline">
                ${timeMarkers.join('')}
            </div>
            <div class="gantt-blocks">
                <div class="gantt-row">
                    <div class="gantt-label">CPU</div>
                    <div class="gantt-track">
                        ${timeline.map(block => `
                            <div class="gantt-block" 
                                 style="left: ${(block.startTime / maxTime) * 100}%; 
                                        width: ${((block.endTime - block.startTime) / maxTime) * 100}%; 
                                        background-color: ${block.color}"
                                 title="${block.processName}: ${block.startTime}-${block.endTime}">
                                ${block.processName}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = ganttHTML;
    
    // Update legend
    const uniqueProcesses = appState.processes.reduce((acc, process) => {
        acc[process.id] = process;
        return acc;
    }, {});
    
    legendContainer.innerHTML = Object.values(uniqueProcesses).map(process => `
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${process.color}"></div>
            <span>${process.name}</span>
        </div>
    `).join('');
    
    legendContainer.classList.remove('hidden');
    playbackControls.classList.remove('hidden');
}

function updateResults() {
    const container = document.getElementById('resultsTable');
    const exportBtn = document.getElementById('exportCSV');
    
    if (!appState.simulationResults) {
        container.innerHTML = '<div class="results-placeholder"><p class="text-secondary">Results will appear here after running simulation</p></div>';
        exportBtn.classList.add('hidden');
        return;
    }
    
    const { processes, averages } = appState.simulationResults;
    
    const tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Process</th>
                    <th>Arrival Time</th>
                    <th>Burst Time</th>
                    <th>Priority</th>
                    <th>Completion Time</th>
                    <th>Turnaround Time</th>
                    <th>Waiting Time</th>
                    <th>Response Time</th>
                </tr>
            </thead>
            <tbody>
                ${processes.map(process => `
                    <tr>
                        <td>
                            <div class="process-color-cell">
                                <div class="table-color" style="background-color: ${process.color}"></div>
                                ${process.name}
                            </div>
                        </td>
                        <td>${process.arrivalTime}</td>
                        <td>${process.burstTime}</td>
                        <td>${process.priority}</td>
                        <td>${process.completionTime}</td>
                        <td>${process.turnaroundTime}</td>
                        <td>${process.waitingTime}</td>
                        <td>${process.responseTime}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="results-summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${averages.turnaroundTime}</div>
                    <div class="summary-label">Avg Turnaround Time</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${averages.waitingTime}</div>
                    <div class="summary-label">Avg Waiting Time</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${averages.responseTime}</div>
                    <div class="summary-label">Avg Response Time</div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = tableHTML;
    exportBtn.classList.remove('hidden');
}

function updateAlgorithmConfig() {
    const quantumConfig = document.getElementById('quantumConfig');
    const priorityOrderConfig = document.getElementById('priorityOrderConfig');
    
    // Show/hide time quantum input for Round Robin
    if (appState.currentAlgorithm === 'RR') {
        quantumConfig.classList.remove('hidden');
    } else {
        quantumConfig.classList.add('hidden');
    }
    
    // Show/hide priority order for priority scheduling
    if (appState.currentAlgorithm.includes('PRIORITY') || appState.currentAlgorithm === 'MLQ') {
        priorityOrderConfig.classList.remove('hidden');
    } else {
        priorityOrderConfig.classList.add('hidden');
    }
}

function clearForm() {
    document.getElementById('processName').value = '';
    document.getElementById('arrivalTime').value = '';
    document.getElementById('burstTime').value = '';
    document.getElementById('priority').value = '';
}

function showError(message) {
    clearError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.input-section .card__body');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => clearError(), 5000);
}

function clearError() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

// Export functionality
function exportToCSV() {
    if (!appState.simulationResults) return;
    
    const { processes, averages } = appState.simulationResults;
    
    let csv = 'Process,Arrival Time,Burst Time,Priority,Completion Time,Turnaround Time,Waiting Time,Response Time\n';
    
    processes.forEach(process => {
        csv += `${process.name},${process.arrivalTime},${process.burstTime},${process.priority},${process.completionTime},${process.turnaroundTime},${process.waitingTime},${process.responseTime}\n`;
    });
    
    csv += '\nAverages\n';
    csv += `,,,,Avg Turnaround Time,${averages.turnaroundTime}\n`;
    csv += `,,,,Avg Waiting Time,${averages.waitingTime}\n`;
    csv += `,,,,Avg Response Time,${averages.responseTime}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpu_scheduling_results_${appState.currentAlgorithm}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Theme management
function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-color-scheme', appState.theme);
    
    const themeIcon = document.getElementById('themeIcon');
    themeIcon.textContent = appState.theme === 'light' ? '🌙' : '☀️';
}

// Step-by-step simulation controls
function stepForward() {
    if (!appState.simulationResults) return;
    const maxTime = Math.max(...appState.simulationResults.timeline.map(block => block.endTime));
    if (appState.currentTime < maxTime) {
        appState.currentTime++;
        updateCurrentTimeDisplay();
    }
}

function stepBackward() {
    if (appState.currentTime > 0) {
        appState.currentTime--;
        updateCurrentTimeDisplay();
    }
}

function togglePlayPause() {
    if (!appState.simulationResults) return;
    
    if (appState.isPlaying) {
        clearInterval(appState.playInterval);
        appState.isPlaying = false;
        document.getElementById('playPause').textContent = '▶️';
    } else {
        appState.isPlaying = true;
        document.getElementById('playPause').textContent = '⏸️';
        appState.playInterval = setInterval(() => {
            stepForward();
            const maxTime = Math.max(...appState.simulationResults.timeline.map(block => block.endTime));
            if (appState.currentTime >= maxTime) {
                togglePlayPause();
            }
        }, 500);
    }
}

function updateCurrentTimeDisplay() {
    document.getElementById('currentTime').textContent = `Time: ${appState.currentTime}`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("Application loading...");
    
    // Algorithm selection
    document.getElementById('algorithmSelect').addEventListener('change', function(e) {
        appState.currentAlgorithm = e.target.value;
        updateAlgorithmConfig();
        console.log("Algorithm changed to:", appState.currentAlgorithm);
    });
    
    // Time quantum input
    document.getElementById('timeQuantum').addEventListener('change', function(e) {
        appState.timeQuantum = parseInt(e.target.value) || 3;
        console.log("Time quantum changed to:", appState.timeQuantum);
    });
    
    // Priority order selection
    document.getElementById('priorityOrder').addEventListener('change', function(e) {
        appState.priorityOrder = e.target.value;
        console.log("Priority order changed to:", appState.priorityOrder);
    });
    
    // Process form
    document.getElementById('addProcess').addEventListener('click', function() {
        console.log("Add process clicked");
        const processData = {
            name: document.getElementById('processName').value,
            arrivalTime: document.getElementById('arrivalTime').value,
            burstTime: document.getElementById('burstTime').value,
            priority: document.getElementById('priority').value
        };
        
        console.log("Process data:", processData);
        
        if (!addProcess(processData)) {
            showError('Please fill all fields with valid values (positive numbers only).');
        }
    });
    
    // Enter key support for adding processes
    document.querySelectorAll('#processName, #arrivalTime, #burstTime, #priority').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('addProcess').click();
            }
        });
    });
    
    // Other buttons
    document.getElementById('generateRandom').addEventListener('click', function() {
        console.log("Generate random clicked");
        generateRandomProcesses();
    });
    
    document.getElementById('loadDefault').addEventListener('click', function() {
        console.log("Load default clicked");
        loadDefaultProcesses();
    });
    
    document.getElementById('clearAll').addEventListener('click', function() {
        console.log("Clear all clicked");
        clearAllProcesses();
    });
    
    document.getElementById('runSimulation').addEventListener('click', function() {
        console.log("Run simulation clicked");
        runSimulation();
    });
    
    document.getElementById('exportCSV').addEventListener('click', function() {
        console.log("Export CSV clicked");
        exportToCSV();
    });
    
    document.getElementById('themeToggle').addEventListener('click', function() {
        console.log("Theme toggle clicked");
        toggleTheme();
    });
    
    // Simulation controls
    document.getElementById('stepBack').addEventListener('click', stepBackward);
    document.getElementById('stepForward').addEventListener('click', stepForward);
    document.getElementById('playPause').addEventListener('click', togglePlayPause);
    
    // Initialize
    console.log("Initializing application...");
    updateAlgorithmConfig();
    loadDefaultProcesses();
    console.log("Application initialized with", appState.processes.length, "processes");
});

// Make functions globally available for onclick handlers
window.removeProcess = removeProcess;
window.addProcess = addProcess;
window.runSimulation = runSimulation;
window.loadDefaultProcesses = loadDefaultProcesses;
window.generateRandomProcesses = generateRandomProcesses;
window.clearAllProcesses = clearAllProcesses;