// 获取canvas元素和2D渲染上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
const scoreDisplay = document.getElementById('score');
const lengthDisplay = document.getElementById('length');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');

// 新增：获取设置相关的DOM元素
const settingsPanel = document.getElementById('settingsPanel');
const gameArea = document.getElementById('gameArea');
const initialLengthInput = document.getElementById('initialLength');
const speedRadioButtons = document.querySelectorAll('input[name="speed"]');
const startGameButton = document.getElementById('startGameButton');
const growthFactorInput = document.getElementById('growthFactor'); // New input

// 游戏参数
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 蛇的状态
let snake = [];
let dx = 0;
let dy = 0;
let nextDx = null; // Buffer for the next intended X direction
let nextDy = null; // Buffer for the next intended Y direction


// 食物初始状态
let food = { x: 15, y: 15 };

// 分数
let score = 0;

// 游戏是否正在进行 (也用于暂停状态)
let gameRunning = false;

// 主游戏循环的Timeout ID
let gameLoopTimeoutId = null; 

// 当前游戏速度的延迟值
let currentSpeedDelay = 350; // Default to slow (reflecting new default)

// 保存上次使用的游戏设置
let lastUsedLength = 3; 
let lastUsedSpeed = 'slow'; 
let lastUsedGrowthFactor = 1; // New global for restart

// 当前游戏增长因子
let currentGrowthFactor = 1; // New global for current game

// --- 主要游戏逻辑函数 ---

function mainGameLoop() {
    if (!gameRunning) {
        if (gameLoopTimeoutId) {
            clearTimeout(gameLoopTimeoutId);
            gameLoopTimeoutId = null;
        }
        return;
    }

    // Apply buffered input before moving
    if (nextDx !== null) { // Check if there's a buffered move
        // Additional safety check: ensure buffered move is not opposite to current direction
        // This prevents a quick 180 if input was buffered rapidly before previous move applied.
        if (!(dx === -nextDx && dx !== 0) && !(dy === -nextDy && dy !== 0)) {
             dx = nextDx;
             dy = nextDy;
             // console.log(`Applied buffered move: dx=${dx}, dy=${dy}`); // Optional debug
        }
        nextDx = null; // Clear buffer after applying or discarding
        nextDy = null;
    }

    // Game logic for one step
    clearCanvas();
    moveSnake(); // moveSnake will now use the updated dx, dy
    drawGame();

    if (checkGameOver()) {
        gameRunning = false; 
        alert("游戏结束! 你的分数是: " + score);
        settingsPanel.style.display = 'block';
        gameArea.style.display = 'none';
        if (pauseButton) pauseButton.textContent = '暂停'; 
        return; 
    }

    // Schedule the next execution of mainGameLoop
    gameLoopTimeoutId = setTimeout(mainGameLoop, currentSpeedDelay);
}

function clearCanvas() {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.1, // Inner circle (center, radius)
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7  // Outer circle (center, radius)
    );
    // A subtle gradient from a slightly lighter center to the existing dark color
    gradient.addColorStop(0, '#34495e'); // Slightly lighter than #2c3e50
    gradient.addColorStop(1, '#2c3e50'); // Existing dark background color

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    if (!gameRunning) return;

    let currentTickDx = dx; 
    let currentTickDy = dy;

    // This logic for stationary snake eating food has been simplified because
    // the main input buffering now handles initial dx/dy changes more smoothly.
    // If dx/dy are still 0 here, it means no input has been processed yet.
    // The original fix for stationary snake eating is still relevant if it eats before any key press.
    if (dx === 0 && dy === 0 && snake.length > 0 && snake[0].x === food.x && snake[0].y === food.y) {
        currentTickDx = 1; 
        currentTickDy = 0;
        dx = currentTickDx; // Persist this change
        dy = currentTickDy;
    }
    
    // Ensure snake is not empty before trying to access snake[0]
    if (snake.length === 0) return; // Should not happen in normal gameplay after init

    let head = { x: snake[0].x + currentTickDx, y: snake[0].y + currentTickDy };

    if (head.x >= tileCount) head.x = 0;
    else if (head.x < 0) head.x = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    else if (head.y < 0) head.y = tileCount - 1;

    snake.unshift(head); 

    if (head.x === food.x && head.y === food.y) { 
        score++; 
        scoreDisplay.textContent = score;
        
        if (currentGrowthFactor > 1) {
            const tailSegmentToCopy = snake[snake.length - 1]; 
            for (let i = 0; i < currentGrowthFactor - 1; i++) {
                snake.push({ x: tailSegmentToCopy.x, y: tailSegmentToCopy.y });
            }
        }
        placeFood();
    } else {
        snake.pop(); 
    }
    lengthDisplay.textContent = snake.length; 
}


function drawGame() {
    // 绘制蛇
    const segmentSize = gridSize - 1; 
    const borderThickness = 2; 
    const innerSize = Math.max(0, segmentSize - (borderThickness * 2)); 

    snake.forEach((segment, index) => {
        let fillStyle;
        let borderStyle;

        if (index === 0) {
            fillStyle = '#76ff03';   
            borderStyle = '#5a9e02'; 
        } else {
            fillStyle = '#4caf50';   
            borderStyle = '#388e3c'; 
        }

        const segX = segment.x * gridSize;
        const segY = segment.y * gridSize;

        ctx.fillStyle = borderStyle;
        ctx.fillRect(segX, segY, segmentSize, segmentSize);
        ctx.fillStyle = fillStyle;
        ctx.fillRect(
            segX + borderThickness, 
            segY + borderThickness, 
            innerSize, 
            innerSize
        );
    });

    // 绘制食物 (圆形 "苹果")
    const foodRadius = (gridSize - 2) / 2; 
    const foodX = food.x * gridSize + gridSize / 2; 
    const foodY = food.y * gridSize + gridSize / 2; 

    ctx.fillStyle = '#e74c3c'; 
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2); 
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; 
    ctx.beginPath();
    ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(foodX, foodY - foodRadius); 
    ctx.lineTo(foodX + 1, foodY - foodRadius - gridSize * 0.2); 
    ctx.lineWidth = gridSize * 0.1; 
    ctx.strokeStyle = '#7f4f24'; 
    ctx.stroke();
    ctx.lineWidth = 1; 
}


function checkGameOver() {
    if (snake.length === 0) return false; // Can't be game over if no snake
    const head = snake[0];
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}

function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    for (const segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            placeFood();
            return;
        }
    }
}

function initializeGame(initialLength, speedSetting, growthFactor) { 
    gameRunning = false; 
    if (gameLoopTimeoutId) { 
        clearTimeout(gameLoopTimeoutId);
        gameLoopTimeoutId = null;
    }
    
    currentGrowthFactor = growthFactor; 
    
    switch (speedSetting) {
        case 'slow': 
            currentSpeedDelay = 350; 
            break;
        case 'medium': 
            currentSpeedDelay = 180; 
            break;
        case 'fast': 
            currentSpeedDelay = 75;  
            break;
        default: 
            currentSpeedDelay = 350; 
    }

    snake = [];
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    for (let i = 0; i < initialLength; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    dx = 0; 
    dy = 0;
    nextDx = null; // Clear input buffer on new game
    nextDy = null; 
    if(initialLength > 1) {
        dx = 1; // Start moving right
        // nextDx = 1; // Optionally pre-buffer initial move, but dx suffices
    }

    score = 0;
    scoreDisplay.textContent = score;
    lengthDisplay.textContent = snake.length;
    if (pauseButton) {
        pauseButton.textContent = '暂停';
    }
    
    placeFood(); 

    clearCanvas(); 
    drawGame();    

    gameRunning = true; 
    mainGameLoop(); 
}

// --- Event Listeners ---

startGameButton.addEventListener('click', () => {
    const selectedLength = parseInt(initialLengthInput.value, 10);
    let selectedSpeed = 'slow';
    speedRadioButtons.forEach(radio => {
        if (radio.checked) selectedSpeed = radio.value;
    });
    const selectedGrowthFactor = parseInt(growthFactorInput.value, 10); 

    if (selectedLength < 1 || selectedLength > 10 || isNaN(selectedLength)) {
        alert("初始长度必须在 1 到 10 之间。");
        initialLengthInput.value = Math.max(1, Math.min(10, selectedLength || 1));
        return;
    }

    if (selectedGrowthFactor < 1 || selectedGrowthFactor > 5 || isNaN(selectedGrowthFactor)) {
        alert("每食物增长长度必须在 1 到 5 之间。");
        growthFactorInput.value = Math.max(1, Math.min(5, selectedGrowthFactor || 1)); 
        return;
    }

    lastUsedLength = selectedLength;
    lastUsedSpeed = selectedSpeed;
    lastUsedGrowthFactor = selectedGrowthFactor; 

    settingsPanel.style.display = 'none';
    gameArea.style.display = 'flex';
    initializeGame(selectedLength, selectedSpeed, selectedGrowthFactor); 
});

pauseButton.addEventListener('click', () => {
    if (gameRunning) { 
        gameRunning = false; 
        if (gameLoopTimeoutId) {
            clearTimeout(gameLoopTimeoutId);
            gameLoopTimeoutId = null;
        }
        pauseButton.textContent = '继续';
    } else { 
        if (settingsPanel.style.display === 'block' || settingsPanel.style.display !== 'none') { 
            return;
        }
        if (gameArea.style.display !== 'none') {
            gameRunning = true;
            pauseButton.textContent = '暂停';
            mainGameLoop(); 
        }
    }
});

restartButton.addEventListener('click', () => {
    if (settingsPanel.style.display === 'block' || settingsPanel.style.display !== 'none') {
        return;
    }
    initializeGame(lastUsedLength, lastUsedSpeed, lastUsedGrowthFactor); 
});

document.addEventListener('keydown', (event) => {
    if (!gameRunning && event.key.startsWith("Arrow")) return; // Ignore if game not running

    // Temp variables to store the potential next direction
    let intendedDx = null;
    let intendedDy = null;

    switch (event.key) {
        case 'ArrowUp':
            if (dy === 0) { intendedDx = 0; intendedDy = -1; } // Check against current dy
            break;
        case 'ArrowDown':
            if (dy === 0) { intendedDx = 0; intendedDy = 1; } // Check against current dy
            break;
        case 'ArrowLeft':
            if (dx === 0) { intendedDx = -1; intendedDy = 0; } // Check against current dx
            break;
        case 'ArrowRight':
            if (dx === 0) { intendedDx = 1; intendedDy = 0; } // Check against current dx
            break;
        default:
            return; // Not an arrow key, or no change based on current direction
    }

    // If a valid new direction was intended, buffer it
    if (intendedDx !== null) { // Check if intendedDx was set (implies intendedDy was also set)
        nextDx = intendedDx;
        nextDy = intendedDy;
        // console.log(`Buffered next move: dx=${nextDx}, dy=${nextDy}`); // Optional debug
    }
});

// Initial page state
settingsPanel.style.display = 'block';
gameArea.style.display = 'none';
