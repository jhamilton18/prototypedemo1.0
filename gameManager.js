// Game Manager Class
class MarsBaseGame {
    constructor() {
        this.grid = new Grid(10, 8, 50);
        this.buildingTypes = [
            { type: 'CPU Center', width: 2, height: 2, processing: 10 },
            { type: 'Memory Mall', width: 1, height: 2, processing: 5 },
            { type: 'IO Market', width: 2, height: 1, processing: 7 }
        ];
        
        this.selectedBuildingType = null;
        this.isStackMode = false;
        this.isConnectionMode = false;
        this.selectedConnectionSource = null;
        this.showThermalOverlay = false;
        
        this.statusPanel = document.getElementById('status-panel');
        
        // Initialize thermal analysis
        this.thermalAnalysis = new ThermalAnalysis(this.grid);
    }
    
    initialize() {
        // Initialize grid
        this.grid.initialize();
        
        // Set up stack zones
        this.grid.setStackZones([
            [2, 2], [3, 2], [4, 2],
            [2, 3], [3, 3], [4, 3],
            [2, 4], [3, 4], [4, 4]
        ]);
        
        // Set up building palette
        this.initializeBuildingPalette();
        
        // Set up grid event handlers
        this.initializeGridEvents();
        
        // Set up control buttons
        this.initializeControls();
        
        // Add thermal analysis controls
        this.initializeThermalControls();
        
        this.updateStatus('Welcome to Mars Base Layout. Select a building and place it on the grid.');
    }
    
    initializeBuildingPalette() {
        const palette = document.getElementById('building-palette');
        palette.innerHTML = '';
        
        this.buildingTypes.forEach(buildingType => {
            const option = document.createElement('div');
            option.className = 'building-option';
            option.textContent = `${buildingType.type} (${buildingType.width}x${buildingType.height})`;
            option.dataset.type = buildingType.type;
            
            // Add info about processing power and thermal properties
            const info = document.createElement('div');
            info.className = 'building-info';
            info.innerHTML = `Processing: ${buildingType.processing}<br>`;
            
            // Calculate the SA/V ratio for this building type
            const tempBuilding = new Building(
                buildingType.type,
                buildingType.width,
                buildingType.height,
                buildingType.processing
            );
            
            const ratio = this.thermalAnalysis.calculateSAVRatio(tempBuilding);
            info.innerHTML += `SA/V Ratio: ${ratio.toFixed(2)}`;
            
            option.appendChild(info);
            
            option.addEventListener('click', () => {
                this.selectBuildingType(buildingType.type);
            });
            
            palette.appendChild(option);
        });
    }
    
    initializeGridEvents() {
        const gridContainer = this.grid.element;
        
        // Cell hover event
        gridContainer.addEventListener('mousemove', (event) => {
            if (!event.target.classList.contains('grid-cell')) return;
            
            // Clear previous hover states
            const cells = gridContainer.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.classList.remove('hovering');
                cell.classList.remove('invalid');
            });
            
            if (this.isConnectionMode) {
                // In connection mode, just highlight the current cell
                event.target.classList.add('hovering');
            } else if (this.selectedBuildingType) {
                // In building placement mode, highlight all cells that would be covered
                const type = this.selectedBuildingType;
                const buildingConfig = this.buildingTypes.find(b => b.type === type);
                
                const x = parseInt(event.target.dataset.x);
                const y = parseInt(event.target.dataset.y);
                
                // Create a temporary building to check placement
                const tempBuilding = new Building(
                    buildingConfig.type,
                    buildingConfig.width,
                    buildingConfig.height,
                    buildingConfig.processing
                );
                
                const isValid = this.grid.canPlaceBuilding(tempBuilding, x, y, this.isStackMode);
                
                // Highlight cells
                for (let dy = 0; dy < buildingConfig.height; dy++) {
                    for (let dx = 0; dx < buildingConfig.width; dx++) {
                        const cellX = x + dx;
                        const cellY = y + dy;
                        
                        if (cellX >= 0 && cellX < this.grid.width && 
                            cellY >= 0 && cellY < this.grid.height) {
                            const cell = gridContainer.querySelector(
                                `.grid-cell[data-x="${cellX}"][data-y="${cellY}"]`
                            );
                            
                            if (cell) {
                                cell.classList.add(isValid ? 'hovering' : 'invalid');
                            }
                        }
                    }
                }
            }
        });
        
        // Cell click event
        gridContainer.addEventListener('click', (event) => {
            // Check if we clicked on a grid cell
            let cellElement = event.target;
            if (!cellElement.classList.contains('grid-cell')) {
                // Check if we clicked on a building
                if (cellElement.classList.contains('building')) {
                    this.handleBuildingClick(cellElement);
                    return;
                }
                return;
            }
            
            const x = parseInt(cellElement.dataset.x);
            const y = parseInt(cellElement.dataset.y);
            
            if (this.isConnectionMode) {
                this.handleConnectionClick(x, y);
            } else if (this.selectedBuildingType) {
                this.handleBuildingPlacement(x, y);
            }
        });
        
        // Thermal overlay tooltip
        gridContainer.addEventListener('mouseover', (event) => {
            if (event.target.classList.contains('thermal-overlay')) {
                const temp = event.target.dataset.temperature;
                
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = `${temp}°C`;
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${event.clientX + 10}px`;
                tooltip.style.top = `${event.clientY + 10}px`;
                tooltip.style.backgroundColor = 'black';
                tooltip.style.color = 'white';
                tooltip.style.padding = '5px';
                tooltip.style.borderRadius = '3px';
                tooltip.style.zIndex = 100;
                
                document.body.appendChild(tooltip);
                
                event.target.addEventListener('mouseout', () => {
                    tooltip.remove();
                }, { once: true });
            }
        });
    }
    
    initializeControls() {
        // Stack mode toggle
        const stackModeButton = document.getElementById('toggle-stack-mode');
        stackModeButton.addEventListener('click', () => {
            this.isStackMode = !this.isStackMode;
            stackModeButton.textContent = this.isStackMode ? 'Disable Stack Mode' : 'Enable Stack Mode';
            
            // Exit connection mode if it's active
            if (this.isConnectionMode) {
                this.exitConnectionMode();
            }
            
            this.updateStatus(this.isStackMode ? 
                'Stack Mode enabled. Buildings can be placed in stack zones.' : 
                'Stack Mode disabled. Buildings will be placed on the ground level.');
        });
        
        // Clear grid button
        const clearButton = document.getElementById('clear-grid');
        clearButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the grid?')) {
                this.grid.clear();
                this.thermalAnalysis.updateThermalMap();
                if (this.showThermalOverlay) {
                    this.thermalAnalysis.renderThermalOverlay();
                }
                this.updateStatus('Grid cleared.');
            }
        });
        
        // Connection mode button
        const connectionButton = document.getElementById('add-connection');
        connectionButton.addEventListener('click', () => {
            if (this.isConnectionMode) {
                this.exitConnectionMode();
            } else {
                this.enterConnectionMode();
            }
        });
        
        // Add rover button
        const roverButton = document.getElementById('add-rover');
        roverButton.addEventListener('click', () => {
            if (this.grid.buildings.length < 2) {
                this.updateStatus('Need at least two connected buildings to add a rover.');
                return;
            }
            
            if (this.grid.connections.length === 0) {
                this.updateStatus('Create connections between buildings first.');
                return;
            }
            
            // Get a random connection
            const randomConnection = this.grid.connections[
                Math.floor(Math.random() * this.grid.connections.length)
            ];
            
            this.grid.addRover(
                randomConnection.sourceBuilding.id,
                randomConnection.targetBuilding.id
            );
            
            this.updateStatus('Rover added to simulate data flow.');
        });
    }
    
    initializeThermalControls() {
        // Add thermal overlay toggle button
        const controlsDiv = document.querySelector('.controls');
        
        const thermalButton = document.createElement('button');
        thermalButton.id = 'toggle-thermal';
        thermalButton.textContent = 'Show Thermal Map';
        thermalButton.addEventListener('click', () => {
            this.thermalAnalysis.updateThermalMap();
            this.showThermalOverlay = this.thermalAnalysis.toggleThermalOverlay();
            thermalButton.textContent = this.showThermalOverlay ? 
                'Hide Thermal Map' : 'Show Thermal Map';
        });
        
        const analysisButton = document.createElement('button');
        analysisButton.id = 'show-analysis';
        analysisButton.textContent = 'Thermal Analysis';
        analysisButton.addEventListener('click', () => {
            this.thermalAnalysis.updateThermalMap();
            const report = this.thermalAnalysis.displayReport();
            this.updateStatus(report);
        });
        
        controlsDiv.appendChild(thermalButton);
        controlsDiv.appendChild(analysisButton);
        
        // Add CSS for thermal indicators
        const style = document.createElement('style');
        style.textContent = `
            .thermal-overlay {
                transition: opacity 0.3s;
                opacity: 0;
                pointer-events: none;
            }
            
            .tooltip {
                pointer-events: none;
                font-size: 12px;
            }
            
            .building-info {
                font-size: 10px;
                margin-top: 5px;
                color: #555;
            }
            
            .critical {
                color: red;
                font-weight: bold;
            }
            
            .warning {
                color: orange;
            }
            
            #status-panel {
                max-height: 300px;
                overflow-y: auto;
            }
            
            #status-panel h3, #status-panel h4 {
                margin: 10px 0 5px 0;
                color: #c1440e;
            }
            
            #status-panel ul {
                margin: 5px 0;
                padding-left: 20px;
            }
        `;
        document.head.appendChild(style);
    }
    
    selectBuildingType(type) {
        this.selectedBuildingType = type;
        
        if (this.isConnectionMode) {
            this.exitConnectionMode();
        }
        
        const options = document.querySelectorAll('.building-option');
        options.forEach(option => {
            if (option.dataset.type === type) {
                option.style.backgroundColor = '#e0e0e0';
            } else {
                option.style.backgroundColor = '#fff';
            }
        });
        
        const buildingConfig = this.buildingTypes.find(b => b.type === type);
        this.updateStatus(`Selected ${type} (${buildingConfig.width}x${buildingConfig.height}).`);
    }
    
    handleBuildingPlacement(x, y) {
        const buildingConfig = this.buildingTypes.find(b => b.type === this.selectedBuildingType);
        
        const building = new Building(
            buildingConfig.type,
            buildingConfig.width,
            buildingConfig.height,
            buildingConfig.processing
        );
        
        const placed = this.grid.placeBuilding(building, x, y, this.isStackMode);

        if (placed) {
            const stackText = this.isStackMode ? ` at stack level ${building.stackLevel}` : '';
            this.updateStatus(`${building.type} placed at (${x},${y})${stackText}.`);
            
            // Update thermal analysis
            this.thermalAnalysis.updateThermalMap();
            if (this.showThermalOverlay) {
                this.thermalAnalysis.renderThermalOverlay();
            }
            
            // Force a re-render to ensure the building appears
            this.grid.render();
            
            // Check if we've reached critical temperature
            const issues = this.thermalAnalysis.checkThermalIssues();
            const criticalIssues = issues.filter(issue => issue.severity === 'critical');
            
            if (criticalIssues.length > 0) {
                this.updateStatus(`Warning: Critical temperature detected! ${criticalIssues[0].message}`);
            }
        } else {
            this.updateStatus(`Cannot place ${building.type} at (${x},${y}).`);
        }
    }
    
    handleBuildingClick(buildingElement) {
        const buildingId = buildingElement.dataset.id;
        const building = this.grid.buildings.find(b => b.id === buildingId);
        
        if (!building) return;
        
        if (this.isConnectionMode) {
            if (!this.selectedConnectionSource) {
                this.selectedConnectionSource = building;
                buildingElement.style.outline = '2px solid yellow';
                this.updateStatus(`Selected ${building.type} as connection source. Click another building to connect.`);
            } else if (this.selectedConnectionSource !== building) {
                // Connect to target
                const source = this.selectedConnectionSource;
                const created = this.grid.createConnection(source, building);
                
                if (created) {
                    this.updateStatus(`Connected ${source.type} to ${building.type}.`);
                    
                    // Update thermal analysis after connection
                    this.thermalAnalysis.updateThermalMap();
                    if (this.showThermalOverlay) {
                        this.thermalAnalysis.renderThermalOverlay();
                    }
                } else {
                    this.updateStatus(`Buildings are already connected.`);
                }
                
                // Exit connection mode
                this.exitConnectionMode();
            }
        } else if (this.isStackMode && this.selectedBuildingType) {
            // NEW CODE: Stack a new building on top of the clicked building
            const buildingConfig = this.buildingTypes.find(b => b.type === this.selectedBuildingType);
            
            const newBuilding = new Building(
                buildingConfig.type,
                buildingConfig.width,
                buildingConfig.height,
                buildingConfig.processing
            );
            
            // Place at the same position as the clicked building
            const placed = this.grid.placeBuilding(newBuilding, building.x, building.y, true);
            
            if (placed) {
                this.updateStatus(`${newBuilding.type} stacked on top of ${building.type} at level ${newBuilding.stackLevel}.`);
                
                // Update thermal analysis
                this.thermalAnalysis.updateThermalMap();
                if (this.showThermalOverlay) {
                    this.thermalAnalysis.renderThermalOverlay();
                }
            } else {
                this.updateStatus(`Cannot stack ${newBuilding.type} on top of ${building.type}.`);
            }
        } else {
            // Display building info with thermal properties
            const ratio = this.thermalAnalysis.calculateSAVRatio(building);
            const dissipation = this.thermalAnalysis.calculateHeatDissipation(building);
            
            let info = `${building.type} at (${building.x},${building.y}).<br>`;
            info += `Processing: ${building.processing}<br>`;
            info += `Surface Area/Volume Ratio: ${ratio.toFixed(2)}<br>`;
            info += `Heat Dissipation Rate: ${dissipation.toFixed(2)}<br>`;
            info += `Stack Level: ${building.stackLevel}`;
            
            this.updateStatus(info);
        }
    }
    
    handleConnectionClick(x, y) {
        const building = this.grid.getBuildingAt(x, y);
        
        if (building) {
            const buildingElement = document.querySelector(`.building[data-id="${building.id}"]`);
            if (buildingElement) {
                this.handleBuildingClick(buildingElement);
            }
        } else if (this.selectedConnectionSource) {
            // Clicked on empty cell, cancel connection
            this.exitConnectionMode();
        }
    }
    
    enterConnectionMode() {
        this.isConnectionMode = true;
        this.selectedConnectionSource = null;
        this.selectedBuildingType = null;

        document.getElementById('add-connection').textContent = 'Cancel Connection';
        
        // Reset building palette selection
        const options = document.querySelectorAll('.building-option');
        options.forEach(option => {
            option.style.backgroundColor = '#fff';
        });
        
        this.updateStatus('Connection Mode: Click on a building to select as connection source.');
    }
    
    exitConnectionMode() {
        this.isConnectionMode = false;
        
        // Reset any selected building
        if (this.selectedConnectionSource) {
            const element = document.querySelector(`.building[data-id="${this.selectedConnectionSource.id}"]`);
            if (element) {
                element.style.outline = '';
            }
            this.selectedConnectionSource = null;
        }
        
        document.getElementById('add-connection').textContent = 'Connect Buildings';
        
        this.updateStatus('Connection Mode exited.');
    }
    
    updateStatus(message) {
        this.statusPanel.innerHTML = `<div>${message}</div>`;
    }
    
    startAnimationLoop() {
        const animate = () => {
            this.grid.update();
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Check win condition: optimal stacking with good thermal management
    checkWinCondition() {
        // Need at least 5 buildings
        if (this.grid.buildings.length < 5) return false;
        
        // Need at least 2 stacked buildings
        const stackedBuildings = this.grid.buildings.filter(b => b.isStacked);
        if (stackedBuildings.length < 2) return false;
        
        // Need good thermal efficiency (score > 75)
        const efficiency = this.thermalAnalysis.getThermalEfficiencyScore();
        if (efficiency.score < 75) return false;
        
        // Need all buildings to be connected
        const connectedBuildings = new Set();
        for (const connection of this.grid.connections) {
            connectedBuildings.add(connection.sourceBuilding.id);
            connectedBuildings.add(connection.targetBuilding.id);
        }
        
        if (connectedBuildings.size < this.grid.buildings.length) return false;
        
        return true;
    }
}