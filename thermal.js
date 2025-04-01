// Thermal Analysis Module for Semiconductor Packaging
class ThermalAnalysis {
    constructor(grid) {
        this.grid = grid;
        this.thermalMap = [];
        this.maxTemperature = 100; // Maximum allowable temperature
        this.heatThreshold = 85;   // Temperature at which warnings should be displayed
        
        // Initialize thermal map
        this.initThermalMap();
    }
    
    initThermalMap() {
        this.thermalMap = [];
        for (let y = 0; y < this.grid.height; y++) {
            const row = [];
            for (let x = 0; x < this.grid.width; x++) {
                row.push({
                    temperature: 25, // Ambient temperature in Celsius
                    heatDissipation: 0
                });
            }
            this.thermalMap.push(row);
        }
    }
    
    // Calculate surface area to volume ratio for a building
    calculateSAVRatio(building) {
        // Calculate volume (width × height × 1 unit depth)
        const volume = building.width * building.height * 1;
        
        // Calculate surface area (4 sides + top + bottom)
        // For a rectangular prism: 2(width × height) + 2(width × depth) + 2(height × depth)
        const surfaceArea = 2 * (building.width * building.height) + 
                           2 * (building.width * 1) + 
                           2 * (building.height * 1);
        
        // Return the ratio
        return surfaceArea / volume;
    }
    
    // Calculate heat dissipation based on surface area to volume ratio
    calculateHeatDissipation(building) {
        const ratio = this.calculateSAVRatio(building);
        
        // Base heat output is proportional to processing power
        const baseHeat = building.processing * 0.8;
        
        // Higher ratio means better heat dissipation
        // This is a simplified model - in reality, it would be more complex
        const dissipationEfficiency = 0.7 + (ratio * 0.1);
        
        // Stacking reduces dissipation efficiency
        const stackPenalty = building.isStacked ? 0.2 * building.stackLevel : 0;
        
        // Final heat dissipation rate (lower means more heat buildup)
        return baseHeat * (dissipationEfficiency - stackPenalty);
    }
    
    // Update thermal map based on building placements
    updateThermalMap() {
        // Reset to ambient temperature
        this.initThermalMap();
        
        // Calculate heat for each building
        for (const building of this.grid.buildings) {
            const heatOutput = building.processing;
            const dissipation = this.calculateHeatDissipation(building);
            
            // Heat accumulates more with poor dissipation
            const heatAccumulation = heatOutput / dissipation;
            
            // Update temperatures for each cell the building occupies
            for (let dy = 0; dy < building.height; dy++) {
                for (let dx = 0; dx < building.width; dx++) {
                    const x = building.x + dx;
                    const y = building.y + dy;
                    
                    if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
                        this.thermalMap[y][x].temperature += heatAccumulation;
                        this.thermalMap[y][x].heatDissipation = dissipation;
                    }
                }
            }
        }
        
        // Simulate heat spreading to adjacent cells (simplified heat diffusion)
        this.simulateHeatDiffusion();
    }
    
    // Simplified heat diffusion to adjacent cells
    simulateHeatDiffusion() {
        const diffusionMap = JSON.parse(JSON.stringify(this.thermalMap));
        
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.thermalMap[y][x];
                
                // Only spread heat above ambient temperature
                if (cell.temperature > 25) {
                    const excessHeat = cell.temperature - 25;
                    const spreadAmount = excessHeat * 0.1; // 10% of excess heat spreads
                    
                    // Update adjacent cells in diffusion map
                    const adjacentCells = [
                        {x: x-1, y: y}, {x: x+1, y: y},
                        {x: x, y: y-1}, {x: x, y: y+1}
                    ];
                    
                    for (const adj of adjacentCells) {
                        if (adj.x >= 0 && adj.x < this.grid.width && 
                            adj.y >= 0 && adj.y < this.grid.height) {
                            diffusionMap[adj.y][adj.x].temperature += spreadAmount / 4;
                        }
                    }
                    
                    // Reduce the original cell's temperature
                    diffusionMap[y][x].temperature -= spreadAmount;
                }
            }
        }
        
        // Update thermal map with diffused temperatures
        this.thermalMap = diffusionMap;
    }
    
    // Check for thermal issues
    checkThermalIssues() {
        const issues = [];
        
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.thermalMap[y][x];
                
                if (cell.temperature > this.maxTemperature) {
                    issues.push({
                        x, y,
                        temperature: cell.temperature,
                        severity: 'critical',
                        message: `Critical temperature of ${cell.temperature.toFixed(1)}°C at (${x},${y})`
                    });
                } else if (cell.temperature > this.heatThreshold) {
                    issues.push({
                        x, y,
                        temperature: cell.temperature,
                        severity: 'warning',
                        message: `High temperature of ${cell.temperature.toFixed(1)}°C at (${x},${y})`
                    });
                }
            }
        }
        
        return issues;
    }
    
    // Render thermal overlay on grid
    renderThermalOverlay() {
        const gridContainer = this.grid.element;
        const existingOverlay = gridContainer.querySelectorAll('.thermal-overlay');
        existingOverlay.forEach(el => el.remove());
        
        // Create and append new overlay
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.thermalMap[y][x];
                const temp = cell.temperature;
                
                if (temp > 25) {  // Only show if above ambient
                    const intensity = Math.min(1, (temp - 25) / (this.maxTemperature - 25));
                    const red = Math.floor(255 * intensity);
                    const green = Math.floor(255 * (1 - intensity));
                    const blue = 0;
                    
                    const overlay = document.createElement('div');
                    overlay.className = 'thermal-overlay';
                    overlay.style.position = 'absolute';
                    overlay.style.left = `${x * this.grid.cellSize}px`;
                    overlay.style.top = `${y * this.grid.cellSize}px`;
                    overlay.style.width = `${this.grid.cellSize}px`;
                    overlay.style.height = `${this.grid.cellSize}px`;
                    overlay.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, 0.3)`;
                    overlay.style.zIndex = 2;
                    overlay.dataset.temperature = temp.toFixed(1);
                    
                    gridContainer.appendChild(overlay);
                }
            }
        }
    }
    
    getThermalEfficiencyScore() {
        let totalTemp = 0;
        let cellCount = 0;

    for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                totalTemp += this.thermalMap[y][x].temperature;
                cellCount++;
            }
        }
        
        const avgTemp = totalTemp / cellCount;
        const normalizedScore = Math.max(0, 100 - ((avgTemp - 25) * 2));
        
        return {
            averageTemperature: avgTemp,
            score: normalizedScore
        };
    }
    
    // Display thermal analysis report
    displayReport() {
        const efficiency = this.getThermalEfficiencyScore();
        const issues = this.checkThermalIssues();
        
        let report = `<h3>Thermal Analysis Report</h3>`;
        report += `<p>Average Temperature: ${efficiency.averageTemperature.toFixed(1)}°C</p>`;
        report += `<p>Thermal Efficiency Score: ${efficiency.score.toFixed(1)}/100</p>`;
        
        if (issues.length > 0) {
            report += `<h4>Thermal Issues (${issues.length})</h4><ul>`;
            for (let i = 0; i < Math.min(issues.length, 5); i++) {
                report += `<li class="${issues[i].severity}">${issues[i].message}</li>`;
            }
            if (issues.length > 5) {
                report += `<li>...and ${issues.length - 5} more issues</li>`;
            }
            report += `</ul>`;
        } else {
            report += `<p>No thermal issues detected.</p>`;
        }
        
        report += `<h4>Surface Area/Volume Analysis</h4><ul>`;
        for (const building of this.grid.buildings) {
            const ratio = this.calculateSAVRatio(building);
            const dissipation = this.calculateHeatDissipation(building);
            report += `<li>${building.type} at (${building.x},${building.y}): 
                      SA/V Ratio: ${ratio.toFixed(2)}, 
                      Heat Dissipation: ${dissipation.toFixed(2)}</li>`;
        }
        report += `</ul>`;
        
        return report;
    }
    
    // Toggle thermal overlay visibility
    toggleThermalOverlay() {
        const overlays = document.querySelectorAll('.thermal-overlay');
        const isVisible = overlays.length > 0 && 
                         window.getComputedStyle(overlays[0]).opacity !== '0';
        
        overlays.forEach(overlay => {
            overlay.style.opacity = isVisible ? '0' : '1';
        });
        
        return !isVisible;
    }
}

// Visually in unity, finzliaed version, next to each other, Hottenst visual level. 