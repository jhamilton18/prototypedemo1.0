// Rover Class - Represents data flow
class Rover {
    constructor(sourceBuildingId, targetBuildingId) {
        this.sourceBuildingId = sourceBuildingId;
        this.targetBuildingId = targetBuildingId;
        this.id = Math.random().toString(36).substr(2, 9);
        this.progress = 0; // 0 to 1
        this.speed = 0.01; // Progress per frame
    }
    
    update() {
        this.progress += this.speed;
        if (this.progress > 1) {
            this.progress = 0;
        }
    }
    
    render(buildings, cellSize) {
        const source = buildings.find(b => b.id === this.sourceBuildingId);
        const target = buildings.find(b => b.id === this.targetBuildingId);
        
        if (!source || !target) return null;
        
        const sourceX = (source.x + source.width / 2) * cellSize;
        const sourceY = (source.y + source.height / 2) * cellSize;
        const targetX = (target.x + target.width / 2) * cellSize;
        const targetY = (target.y + target.height / 2) * cellSize;
        
        const currentX = sourceX + (targetX - sourceX) * this.progress;
        const currentY = sourceY + (targetY - sourceY) * this.progress;
        
        const element = document.createElement('div');
        element.className = 'rover';
        element.style.left = `${currentX - 5}px`;
        element.style.top = `${currentY - 5}px`;
        element.dataset.id = this.id;
        
        return element;
    }
}