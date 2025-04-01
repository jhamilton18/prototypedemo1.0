// Building Class
class Building {
    constructor(type, width, height, processing) {
        this.type = type;        
        this.width = width;      
        this.height = height;    
        this.processing = processing;  // Processing capacity (heat generation)    
        this.x = 0;              
        this.y = 0;              
        this.id = Math.random().toString(36).substr(2, 9); 
        this.isStacked = false;  
        this.stackLevel = 0;     
        this.connections = [];   
        this.thermalEfficiency = 1.0;  // Base thermal efficiency
    }
    
    place(x, y) {
        this.x = x;
        this.y = y;
    }
    
    containsPoint(x, y) {
        return x >= this.x && 
               x < this.x + this.width && 
               y >= this.y && 
               y < this.y + this.height;
    }
    
    getSurfaceArea() {
        // For a 3D rectangular prism: 2(width × height) + 2(width × depth) + 2(height × depth)
        // Assuming depth = 1 unit
        return 2 * (this.width * this.height) + 
               2 * (this.width * 1) + 
               2 * (this.height * 1);
    }
    
    getVolume() {
        // For a 3D rectangular prism: width × height × depth
        // Assuming depth = 1 unit
        return this.width * this.height * 1;
    }
    
    getSurfaceAreaToVolumeRatio() {
        return this.getSurfaceArea() / this.getVolume();
    }
    
    // Calculate heat output based on processing and thermal properties
    getHeatOutput() {
        // Higher processing = more heat
        const baseHeat = this.processing;
        
        // Stacking reduces heat dissipation
        const stackingFactor = this.isStacked ? (1 + (this.stackLevel * 0.2)) : 1;
        
        // Surface area to volume ratio affects cooling
        // Higher ratio = better cooling = less heat
        const sav = this.getSurfaceAreaToVolumeRatio();
        const savFactor = 1 - (sav * 0.1);
        
        return baseHeat * stackingFactor * savFactor * (1 / this.thermalEfficiency);
    }
    
    updateThermalEfficiency(connectedBuildings, totalBuildings) {
        // More connections = better thermal management through network effects
        if (connectedBuildings.has(this.id)) {
            // Calculate what percentage of total buildings this building is connected to
            const connectionRatio = this.connections.length / (totalBuildings - 1);
            // Improve efficiency based on connections (up to 30% improvement)
            this.thermalEfficiency = 1.0 + (connectionRatio * 0.3);
        } else {
            // Not connected to anything - baseline efficiency
            this.thermalEfficiency = 1.0;
        }
        
        // Stack level reduces efficiency
        if (this.isStacked) {
            this.thermalEfficiency -= this.stackLevel * 0.1;
        }
        
        // Ensure efficiency doesn't drop below 0.5
        this.thermalEfficiency = Math.max(0.5, this.thermalEfficiency);
    }
    
    render(cellSize) {
        const element = document.createElement('div');
        element.className = `building ${this.type.trim().replace(/\s+/g, '-').toLowerCase()}`;
        element.style.width = `${this.width * cellSize - 4}px`;
        element.style.height = `${this.height * cellSize - 4}px`;
        element.style.left = `${this.x * cellSize + 2}px`;
        element.style.top = `${this.y * cellSize + 2}px`;
        element.textContent = this.type;
        element.dataset.id = this.id;
        
        element.dataset.processing = this.processing;
        element.dataset.sav = this.getSurfaceAreaToVolumeRatio().toFixed(2);
        
        if (this.isStacked) {
            const stackedIndicator = document.createElement('div');
            stackedIndicator.className = 'stacked-indicator';
            stackedIndicator.textContent = `L${this.stackLevel}`;
            element.appendChild(stackedIndicator);
            
            // Darker color for stacked buildings to represent heat concentration
            const opacity = 0.7 + (this.stackLevel * 0.1);
            element.style.opacity = opacity;
        }
              
        const heatIndicator = document.createElement('div');
        heatIndicator.className = 'heat-indicator';
        
        const heatOutput = this.getHeatOutput();
        let color;
        if (heatOutput > 15) {
            color = 'red';
        } else if (heatOutput > 10) {
            color = 'orange';
        } else {
            color = 'green';
        }        
        
        heatIndicator.style.backgroundColor = color;
        heatIndicator.style.width = '8px';
        heatIndicator.style.height = '8px';
        heatIndicator.style.borderRadius = '50%';
        heatIndicator.style.position = 'absolute';
        heatIndicator.style.bottom = '3px';
        heatIndicator.style.right = '3px';
        
        element.appendChild(heatIndicator);
        
        return element;
    }
}