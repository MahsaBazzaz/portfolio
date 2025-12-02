document.addEventListener('DOMContentLoaded', () => {
    const loadSections = async () => {
        const headerContainer = document.getElementById('header-container');
        const mainContainer = document.getElementById('main-container');

        const sections = [
            { container: headerContainer, path: 'sections/header.html' },
            { container: mainContainer, path: 'sections/structured-data.html' },
            { container: mainContainer, path: 'sections/gglc-dataset.html' },
            { container: mainContainer, path: 'sections/robustness-analysis.html' },
            { container: mainContainer, path: 'sections/resources.html' }
        ];

        for (const section of sections) {
            try {
                const response = await fetch(section.path);
                const html = await response.text();
                section.container.innerHTML += html;
            } catch (error) {
                console.error(`Error loading ${section.path}:`, error);
                section.container.innerHTML += `<p>Error loading content.</p>`;
            }
        }

        // Once all content is loaded, initialize the scripts
        initializePageScripts();
    };

    const initializePageScripts = () => {
        // Draw adversarial example comparison
        drawAdversarialExample();

        // Initialize level visualizers
        const solvableViz = new LevelVisualizer('solvable-level', solvableLevel, solvablePath);
        const unsolvableViz = new LevelVisualizer('unsolvable-level', unsolvableLevel, unsolvablePath);

        solvableViz.draw();
        unsolvableViz.draw();

        // Button handlers
        document.getElementById('play-solvable').addEventListener('click', () => {
            solvableViz.animatePath();
        });

        document.getElementById('reset-solvable').addEventListener('click', () => {
            solvableViz.reset();
        });

        document.getElementById('play-unsolvable').addEventListener('click', () => {
            unsolvableViz.animatePath();
        });

        document.getElementById('reset-unsolvable').addEventListener('click', () => {
            unsolvableViz.reset();
        });

        // Draw mini game demos
        drawMiniGame('cave-demo', 'cave');
        drawMiniGame('platform-demo', 'platform');
        drawMiniGame('crates-demo', 'crates');
        drawMiniGame('vertical-demo', 'vertical');

        // Robustness plot
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');

        radiusSlider.addEventListener('input', (e) => {
            updateRobustnessPlot(e.target.value);
        });

        // Initialize robustness plot
        updateRobustnessPlot(10);

        // Embedding visualization
        createEmbeddingPlot();

        // Add smooth scrolling for better UX
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };

    loadSections();
});


// Draw adversarial example comparison
function drawAdversarialExample() {
    const canvas = document.getElementById('adversarial-demo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Draw original "panda" image (simplified representation)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 140, 150);
    
    // Draw a simple panda face
    ctx.fillStyle = '#000';
    // Ears
    ctx.beginPath();
    ctx.arc(40, 40, 15, 0, Math.PI * 2);
    ctx.arc(100, 40, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(70, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(55, 65, 8, 0, Math.PI * 2);
    ctx.arc(85, 65, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.beginPath();
    ctx.arc(70, 80, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Original', 70, 130);
    ctx.fillText('🐼 Panda: 99%', 70, 145);
    
    // Draw arrow
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(145, 75);
    ctx.lineTo(155, 75);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(152, 70);
    ctx.lineTo(160, 75);
    ctx.lineTo(152, 80);
    ctx.closePath();
    ctx.fillStyle = '#667eea';
    ctx.fill();
    
    // Draw "adversarial" version with noise
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(160, 0, 140, 150);
    
    // Add some noise pixels
    for(let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(${Math.random()*100}, ${Math.random()*100}, ${Math.random()*100}, 0.2)`;
        ctx.fillRect(160 + Math.random()*140, Math.random()*110, 2, 2);
    }
    
    // Draw same panda (showing it's still recognizable)
    ctx.fillStyle = '#000';
    // Ears
    ctx.beginPath();
    ctx.arc(200, 40, 15, 0, Math.PI * 2);
    ctx.arc(260, 40, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(230, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(215, 65, 8, 0, Math.PI * 2);
    ctx.arc(245, 65, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.beginPath();
    ctx.arc(230, 80, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('+ Adversarial Noise', 230, 130);
    ctx.fillText('🦒 "Gibbon": 99%', 230, 145);
}

// Game level data and visualization code
const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    PLAYER: 2,
    GOAL: 3,
    KEY: 4,
    DOOR: 5,
    CRATE: 6,
    CRATE_GOAL: 7,
    PLATFORM: 8,
    SPIKE: 9
};

const TILE_COLORS = {
    [TILE_TYPES.EMPTY]: '#f8f9fa',
    [TILE_TYPES.WALL]: '#4a4a4a',
    [TILE_TYPES.PLAYER]: '#4CAF50',
    [TILE_TYPES.GOAL]: '#FFD700',
    [TILE_TYPES.KEY]: '#FF6B6B',
    [TILE_TYPES.DOOR]: '#8B4513',
    [TILE_TYPES.CRATE]: '#CD853F',
    [TILE_TYPES.CRATE_GOAL]: '#FFA500',
    [TILE_TYPES.PLATFORM]: '#8B7355',
    [TILE_TYPES.SPIKE]: '#DC143C'
};

// Sample levels
const solvableLevel = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1]
];

const unsolvableLevel = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,1], // Changed tile here
    [1,0,0,0,0,0,0,1,3,1],
    [1,1,1,1,1,1,1,1,1,1]
];

const solvablePath = [
    {x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 1, y: 4}, 
    {x: 1, y: 5}, {x: 1, y: 6}, {x: 1, y: 7}, {x: 2, y: 7},
    {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7},
    {x: 7, y: 7}, {x: 8, y: 7}, {x: 8, y: 8}
];

const unsolvablePath = [
    {x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 1, y: 4}, 
    {x: 1, y: 5}, {x: 1, y: 6}, {x: 1, y: 7}, {x: 2, y: 7},
    {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7}
    // Can't continue - blocked!
];

class LevelVisualizer {
    constructor(canvasId, levelData, path) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.level = levelData;
        this.path = path;
        this.tileSize = 32;
        this.currentPathIndex = -1;
        this.animating = false;
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tiles
        for (let y = 0; y < this.level.length; y++) {
            for (let x = 0; x < this.level[y].length; x++) {
                const tile = this.level[y][x];
                this.ctx.fillStyle = TILE_COLORS[tile];
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, 
                                 this.tileSize - 1, this.tileSize - 1);
                
                // Draw icons for special tiles
                if (tile === TILE_TYPES.PLAYER) {
                    this.drawPlayer(x * this.tileSize, y * this.tileSize);
                } else if (tile === TILE_TYPES.GOAL) {
                    this.drawGoal(x * this.tileSize, y * this.tileSize);
                }
            }
        }
        
        // Draw path if animating
        if (this.currentPathIndex >= 0) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            
            for (let i = 0; i <= this.currentPathIndex && i < this.path.length; i++) {
                const point = this.path[i];
                const x = point.x * this.tileSize + this.tileSize / 2;
                const y = point.y * this.tileSize + this.tileSize / 2;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawPlayer(x, y) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('😊', x + this.tileSize/2, y + this.tileSize/2);
    }

    drawGoal(x, y) {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🎯', x + this.tileSize/2, y + this.tileSize/2);
    }

    animatePath() {
        if (this.animating || !this.ctx) return;
        this.animating = true;
        this.currentPathIndex = -1;
        
        const animate = () => {
            if (this.currentPathIndex < this.path.length - 1) {
                this.currentPathIndex++;
                this.draw();
                setTimeout(() => animate(), 200);
            } else {
                this.animating = false;
            }
        };
        animate();
    }

    reset() {
        if (!this.ctx) return;
        this.currentPathIndex = -1;
        this.animating = false;
        this.draw();
    }
}

// Draw mini game demos
function drawMiniGame(canvasId, gameType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tileSize = 20;
    
    // Simple representations for each game
    const games = {
        'cave': [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,1,0,0,0,0,3,1],
            [1,1,0,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,0,1,1,1,1,1,0,1],
            [1,2,0,0,0,0,0,0,0,1],
            [1,1,1,0,0,4,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1]
        ],
        'platform': [
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,3,0],
            [0,0,0,0,0,8,8,8,8,8],
            [0,0,0,8,8,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,8,8,0,0,0,0,0,0,0],
            [0,0,0,0,0,8,8,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [8,8,8,0,0,0,0,0,8,8],
            [2,0,0,0,9,9,0,0,0,0]
        ],
        'crates': [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,2,0,0,0,0,0,0,1],
            [1,0,0,6,0,0,0,0,0,1],
            [1,0,0,0,0,7,0,0,0,1],
            [1,0,0,0,0,0,0,6,0,1],
            [1,0,0,0,7,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1]
        ],
        'vertical': [
            [0,0,0,1,0,0,1,0,0,0],
            [0,0,0,1,3,0,1,0,0,0],
            [0,0,0,1,8,8,1,0,0,0],
            [0,0,0,1,0,0,1,0,0,0],
            [0,0,8,8,0,0,8,8,0,0],
            [0,0,0,1,0,0,1,0,0,0],
            [0,8,8,1,0,0,1,8,8,0],
            [0,0,0,1,0,0,1,0,0,0],
            [8,8,8,1,0,0,1,8,8,8],
            [2,0,0,0,0,0,0,0,0,0]
        ]
    };
    
    const level = games[gameType];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const tile = level[y][x];
            ctx.fillStyle = TILE_COLORS[tile];
            ctx.fillRect(x * tileSize, y * tileSize, tileSize - 1, tileSize - 1);
        }
    }
}

// Placeholder for game playing
function playGame(gameType) {
    alert(`Interactive ${gameType} game would load here. In the full implementation, this would be a playable mini-game!`);
}

// Robustness plot
function updateRobustnessPlot(radius) {
    const radiusValue = document.getElementById('radius-value');
    if (!radiusValue) return;

    const radiusVal = radius / 1000;
    radiusValue.textContent = radiusVal.toFixed(3);
    
    // Data from the paper's Table 3
    const datasets = ['CIFAR-10', 'MNIST', 'Cave', 'Platform', 'Crates', 'Vertical'];
    const robustnessData = {
        'CIFAR-10': [0, 0, 0.1, 2.9, 6.7, 12.4, 12.8, 14.4, 18.9],
        'MNIST': [0, 0, 0.1, 1.6, 3.7, 5.8, 6.2, 6.1, 10.1],
        'Cave': [0, 0.7, 2.3, 24.3, 29.6, 32.6, 32.6, 35.2, 36.2],
        'Platform': [0, 0, 0, 2.0, 5.9, 12.5, 14.1, 21.2, 28.1],
        'Crates': [0, 0, 0.3, 2.5, 6.0, 13.1, 15.3, 20.8, 25.8],
        'Vertical': [0, 0, 0.1, 1.1, 3.2, 5.6, 6.7, 10.3, 15.9]
    };
    
    const radiusValues = [0.00001, 0.00005, 0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1];
    
    const traces = datasets.map(dataset => ({
        x: radiusValues,
        y: robustnessData[dataset],
        type: 'scatter',
        mode: 'lines+markers',
        name: dataset,
        line: {
            width: dataset.includes('Cave') || dataset.includes('Platform') || 
                   dataset.includes('Crates') || dataset.includes('Vertical') ? 3 : 2
        }
    }));
    
    // Add vertical line for current radius
    traces.push({
        x: [radiusVal, radiusVal],
        y: [0, 40],
        type: 'scatter',
        mode: 'lines',
        name: 'Current Radius',
        line: {
            color: 'rgba(255, 0, 0, 0.5)',
            width: 2,
            dash: 'dash'
        },
        showlegend: false
    });
    
    const layout = {
        title: 'Non-Robustness Comparison (Higher = More Sensitive)',
        xaxis: {
            title: 'Radius (r)',
            type: 'log',
            range: [-5, -0.5]
        },
        yaxis: {
            title: 'Non-Robustness (%)',
            range: [0, 40]
        },
        legend: {
            x: 0.02,
            y: 0.98
        },
        hovermode: 'x unified'
    };
    
    Plotly.newPlot('robustness-plot', traces, layout, {responsive: true});
}

// Embedding visualization
function createEmbeddingPlot() {
    // Simulated UMAP embeddings for demonstration
    const numPoints = 200;
    const data = [];
    
    // Generate clusters for each game type
    const games = ['Cave', 'Platform', 'Crates', 'Vertical'];
    const centers = [
        {x: -5, y: 5}, {x: 5, y: 5}, {x: -5, y: -5}, {x: 5, y: -5}
    ];
    
    games.forEach((game, i) => {
        for (let j = 0; j < numPoints/4; j++) {
            const solvable = Math.random() > 0.3;
            const x = centers[i].x + (Math.random() - 0.5) * 4;
            const y = centers[i].y + (Math.random() - 0.5) * 4;
            
            data.push({
                x: x,
                y: y,
                game: game,
                solvable: solvable,
                color: solvable ? 'blue' : 'red',
                text: `${game} - ${solvable ? 'Solvable' : 'Unsolvable'}`
            });
        }
    });
    
    const solvableData = data.filter(d => d.solvable);
    const unsolvableData = data.filter(d => !d.solvable);
    
    const trace1 = {
        x: solvableData.map(d => d.x),
        y: solvableData.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Solvable',
        text: solvableData.map(d => d.text),
        marker: {
            size: 8,
            color: '#4CAF50',
            opacity: 0.6
        }
    };
    
    const trace2 = {
        x: unsolvableData.map(d => d.x),
        y: unsolvableData.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Unsolvable',
        text: unsolvableData.map(d => d.text),
        marker: {
            size: 8,
            color: '#f44336',
            opacity: 0.6
        }
    };
    
    const layout = {
        title: 'UMAP Embedding of Game Levels (CLIP Features)',
        xaxis: {
            title: 'UMAP Dimension 1',
            zeroline: false
        },
        yaxis: {
            title: 'UMAP Dimension 2',
            zeroline: false
        },
        hovermode: 'closest',
        showlegend: true
    };
    
    Plotly.newPlot('embedding-plot', [trace1, trace2], layout, {responsive: true});
}