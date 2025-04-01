// Connection Class - Conveyor belts between buildings
class Connection {
    constructor(sourceBuilding, targetBuilding) {
        this.sourceBuilding = sourceBuilding;
        this.targetBuilding = targetBuilding;
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    render(cellSize) {
        const sourceX = (this.sourceBuilding.x + this.sourceBuilding.width / 2) * cellSize;
        const sourceY = (this.sourceBuilding.y + this.sourceBuilding.height / 2) * cellSize;
        const targetX = (this.targetBuilding.x + this.targetBuilding.width / 2) * cellSize;
        const targetY = (this.targetBuilding.y + this.targetBuilding.height / 2) * cellSize;
        
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const element = document.createElement('div');
        element.className = 'connection-line conveyor';
        element.style.width = `${length}px`;
        element.style.left = `${sourceX}px`;
        element.style.top = `${sourceY}px`;
        element.style.transform = `rotate(${angle}deg)`;
        element.dataset.id = this.id;
        
        // Add conveyor belt pattern
        const pattern = document.createElement('div');
        pattern.className = 'conveyor-pattern';
        element.appendChild(pattern);
        
        return element;
    }
}