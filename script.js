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

// 食物初始状态
let food = { x: 15, y: 15 };

// 分数
let score = 0;

// 游戏是否正在进行 (也用于暂停状态)
let gameRunning = false;

// 主游戏循环的Timeout ID
let gameLoopTimeoutId = null; 

// 当前游戏速度的延迟值
let currentSpeedDelay = 350; // Default to slow

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

    // Game logic for one step
    clearCanvas();
    moveSnake();
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
    // console.log("[mainGameLoop] Scheduling next step with currentSpeedDelay:", currentSpeedDelay); // REMOVED
    gameLoopTimeoutId = setTimeout(mainGameLoop, currentSpeedDelay);
}

function clearCanvas() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    if (!gameRunning) return;

    let currentTickDx = dx; 
    let currentTickDy = dy;

    if (dx === 0 && dy === 0 && snake[0].x === food.x && snake[0].y === food.y) {
        currentTickDx = 1; 
        currentTickDy = 0;
        dx = currentTickDx;
        dy = currentTickDy;
    }

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
    snake.forEach((segment, index) => {
        ctx.fillStyle = (index === 0) ? '#76ff03' : '#4caf50';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

function checkGameOver() {
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
    // console.log("[initializeGame] Received speedSetting:", speedSetting); // REMOVED
    
    currentGrowthFactor = growthFactor; 
    // console.log("[initializeGame] Received growthFactor:", growthFactor); // This was duplicated or meant to be currentGrowthFactor
    
    switch (speedSetting) {
        case 'slow': currentSpeedDelay = 400; break;
        case 'medium': currentSpeedDelay = 220; break;
        case 'fast': currentSpeedDelay = 100; break;
        default: currentSpeedDelay = 400;
    }
    // console.log("[initializeGame] Set currentSpeedDelay to:", currentSpeedDelay); // REMOVED
    // console.log("[initializeGame] Set currentGrowthFactor to:", currentGrowthFactor); // REMOVED


    snake = [];
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    for (let i = 0; i < initialLength; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    dx = 0; 
    dy = 0;
    if(initialLength > 1) {
        dx = 1;
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
    if (!gameRunning && event.key.startsWith("Arrow")) return;

    const prevDx = dx;
    const prevDy = dy;

    switch (event.key) {
        case 'ArrowUp': if (prevDy === 0) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (prevDy === 0) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (prevDx === 0) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (prevDx === 0) { dx = 1; dy = 0; } break;
    }
});

// Initial page state
settingsPanel.style.display = 'block';
gameArea.style.display = 'none';
