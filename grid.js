class Grid {
    constructor(width, height, cellSize) {
        this.width = width;         
        this.height = height;        
        this.cellSize = cellSize;   
        this.cells = [];             
        this.stackZones = [];        
        this.buildings = [];         
        this.connections = [];       
        this.rovers = [];            
        this.element = null;        
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push({
                    x: x,
                    y: y,
                    isStackZone: false,
                    buildings: [] 
                });
            }
            this.cells.push(row);
        }
    }
    
    initialize() {
        const container = document.getElementById('grid-container');
        container.innerHTML = '';
        
        for (let y = 0; y < this.height; y++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'grid-row';
            
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                const cellElement = document.createElement('div');
                cellElement.className = 'grid-cell';
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                
                if (cell.isStackZone) {
                    cellElement.classList.add('stack-zone');
                }
                
                rowElement.appendChild(cellElement);
            }
            
            container.appendChild(rowElement);
        }
        
        this.element = container;
    }
    
    setStackZones(zones) {
        this.stackZones = zones;
        
        // Update cell properties
        for (const [x, y] of zones) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.cells[y][x].isStackZone = true;
            }
        }
        
        const cells = this.element.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            if (this.cells[y][x].isStackZone) {
                cell.classList.add('stack-zone');
            } else {
                cell.classList.remove('stack-zone');
            }
        });
    }
    
    canPlaceBuilding(building, x, y, isStackMode) {
        // Check if the building is within grid boundaries
        if (x < 0 || y < 0 || x + building.width > this.width || y + building.height > this.height) {
            return false;
        }
        
        if (isStackMode) {
            // Check if all cells are in stack zones
            for (let dy = 0; dy < building.height; dy++) {
                for (let dx = 0; dx < building.width; dx++) {
                    if (!this.cells[y + dy][x + dx].isStackZone) {
                        return false;
                    }
                }
            }
            
            // Find the highest stack level in the area
            let maxStackLevel = -1;
            for (let dy = 0; dy < building.height; dy++) {
                for (let dx = 0; dx < building.width; dx++) {
                    const cellBuildings = this.cells[y + dy][x + dx].buildings;
                    if (cellBuildings.length > 0) {
                        for (const b of cellBuildings) {
                            maxStackLevel = Math.max(maxStackLevel, b.stackLevel);
                        }
                    }
                }
            }
            
            // Set the new building's stack level
            building.stackLevel = maxStackLevel + 1;
            building.isStacked = true;
            
            return true;
        } else {
            // In normal mode, check for overlapping non-stacked buildings
            for (let dy = 0; dy < building.height; dy++) {
                for (let dx = 0; dx < building.width; dx++) {
                    const cellBuildings = this.cells[y + dy][x + dx].buildings;
                    
                    // Check if there are any buildings on level 0 (ground)
                    if (cellBuildings.some(b => b.stackLevel === 0)) {
                        return false;
                    }
                }
            }
            
            building.stackLevel = 0;
            building.isStacked = false;
            
            return true;
        }
    }
    
    placeBuilding(building, x, y, isStackMode) {
        if (!this.canPlaceBuilding(building, x, y, isStackMode)) {
            return false;
        }
        
        building.place(x, y);
        this.buildings.push(building);
        
        for (let dy = 0; dy < building.height; dy++) {
            for (let dx = 0; dx < building.width; dx++) {
                this.cells[y + dy][x + dx].buildings.push(building);
            }
        }
        
        this.render();
        return true;
    }
    
    createConnection(source, target) {
        if (source === target) return false;
        
        // Check if connection already exists
        const exists = this.connections.some(c => 
            (c.sourceBuilding === source && c.targetBuilding === target) ||
            (c.sourceBuilding === target && c.targetBuilding === source)
        );
        
        if (exists) return false;
        
        const connection = new Connection(source, target);
        this.connections.push(connection);
        
        source.connections.push(connection);
        target.connections.push(connection);
        
        this.render();
        return true;
    }

    addRover(sourceId, targetId) {
        // Verify buildings are connected
        const connection = this.connections.find(c => 
            (c.sourceBuilding.id === sourceId && c.targetBuilding.id === targetId) ||
            (c.sourceBuilding.id === targetId && c.targetBuilding.id === sourceId)
        );
        
        if (!connection) return false;
        
        const rover = new Rover(sourceId, targetId);
        this.rovers.push(rover);
        this.render();
        return true;
    }
    
    getBuildingAt(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return null;
        }
        
        const buildings = this.cells[y][x].buildings;
        return buildings.length > 0 ? buildings[buildings.length - 1] : null;
    }
    
    clear() {
        this.buildings = [];
        this.connections = [];
        this.rovers = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].buildings = [];
            }
        }
        
        this.render();
    }
    
    render() {
        // Clear existing buildings
        const gridContainer = this.element;
        const existingBuildings = gridContainer.querySelectorAll('.building');
        existingBuildings.forEach(el => el.remove());
        
        // Clear existing connections
        const existingConnections = gridContainer.querySelectorAll('.connection-line');
        existingConnections.forEach(el => el.remove());
        
        // Clear existing rovers
        const existingRovers = gridContainer.querySelectorAll('.rover');
        existingRovers.forEach(el => el.remove());
        
        // Render connections first (so they're behind buildings)
        this.connections.forEach(connection => {
            const element = connection.render(this.cellSize);
            gridContainer.appendChild(element);
        });
        
        // Render buildings
        this.buildings.forEach(building => {
            const element = building.render(this.cellSize);
            gridContainer.appendChild(element);
        });
        
        // Render rovers
        this.rovers.forEach(rover => {
            const element = rover.render(this.buildings, this.cellSize);
            if (element) {
                gridContainer.appendChild(element);
            }
        });
    }
    
    update() {
        this.rovers.forEach(rover => rover.update());
        
        // Rerender rovers
        const gridContainer = this.element;
        const existingRovers = gridContainer.querySelectorAll('.rover');
        existingRovers.forEach(el => el.remove());
        
        this.rovers.forEach(rover => {
            const element = rover.render(this.buildings, this.cellSize);
            if (element) {
                gridContainer.appendChild(element);
            }
        });
    }
}