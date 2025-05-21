// 获取canvas元素和2D渲染上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
const scoreDisplay = document.getElementById('score');
const lengthDisplay = document.getElementById('length');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton'); // 获取重新开始按钮元素

// 新增：获取设置相关的DOM元素
const settingsPanel = document.getElementById('settingsPanel');
const gameArea = document.getElementById('gameArea');
const initialLengthInput = document.getElementById('initialLength');
const speedRadioButtons = document.querySelectorAll('input[name="speed"]');
const startGameButton = document.getElementById('startGameButton');

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

// 主游戏循环的ID
let gameLoopId;

// 当前游戏速度的延迟值
let currentSpeedDelay = 350; // Default to slow

// 新增：保存上次使用的游戏设置
let lastUsedLength = 3; // Default initial length
let lastUsedSpeed = 'slow'; // Default initial speed

// --- 主要游戏逻辑函数 ---

function mainGameLoop() {
    if (!gameRunning) {
        if (gameLoopId) {
            clearInterval(gameLoopId);
            gameLoopId = null;
        }
        return;
    }

    setTimeout(() => {
        if (!gameRunning) {
            if (gameLoopId) {
                clearInterval(gameLoopId);
                gameLoopId = null;
            }
            return;
        }

        clearCanvas();
        moveSnake();
        drawGame();

        if (checkGameOver()) {
            gameRunning = false;
            alert("游戏结束! 你的分数是: " + score);
            settingsPanel.style.display = 'block';
            gameArea.style.display = 'none';
            pauseButton.textContent = '暂停';
        }
    }, currentSpeedDelay);
}

function clearCanvas() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    if (!gameRunning) return;

    let head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x >= tileCount) head.x = 0;
    else if (head.x < 0) head.x = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    else if (head.y < 0) head.y = tileCount - 1;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
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

function initializeGame(initialLength, speedSetting) {
    switch (speedSetting) {
        case 'slow': currentSpeedDelay = 350; break;
        case 'medium': currentSpeedDelay = 200; break;
        case 'fast': currentSpeedDelay = 100; break;
        default: currentSpeedDelay = 350;
    }

    snake = [];
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    for (let i = 0; i < initialLength; i++) {
        snake.push({ x: startX - i, y: startY });
    }

    dx = 0; dy = 0;
    if (initialLength > 1 && snake.length > 1 && snake[0].x !== snake[1].x) {
        dx = 1;
    } else if (initialLength > 1 && snake.length > 1 && snake[0].y !== snake[1].y) {
        dy = 1;
    }

    score = 0;
    scoreDisplay.textContent = score;
    lengthDisplay.textContent = snake.length;
    pauseButton.textContent = '暂停';

    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    
    gameRunning = true;
    gameLoopId = setInterval(mainGameLoop, 50);

    clearCanvas();
    drawGame();
}

// --- Event Listeners ---

startGameButton.addEventListener('click', () => {
    const selectedLength = parseInt(initialLengthInput.value, 10);
    let selectedSpeed = 'slow';
    speedRadioButtons.forEach(radio => {
        if (radio.checked) selectedSpeed = radio.value;
    });

    if (selectedLength < 1 || selectedLength > 10 || isNaN(selectedLength)) {
        alert("初始长度必须在 1 到 10 之间。");
        initialLengthInput.value = Math.max(1, Math.min(10, selectedLength || 1));
        return;
    }

    // Store settings for potential restart
    lastUsedLength = selectedLength;
    lastUsedSpeed = selectedSpeed;

    settingsPanel.style.display = 'none';
    gameArea.style.display = 'flex';
    initializeGame(selectedLength, selectedSpeed);
});

pauseButton.addEventListener('click', () => {
    if (gameRunning) {
        gameRunning = false;
        pauseButton.textContent = '继续';
        if (gameLoopId) {
            clearInterval(gameLoopId);
            gameLoopId = null; 
        }
    } else {
        // Check if gameArea is visible, implying it's a paused game not a game-over state
        if (gameArea.style.display !== 'none') {
            gameRunning = true;
            pauseButton.textContent = '暂停';
            if (!gameLoopId) { 
                gameLoopId = setInterval(mainGameLoop, 50); 
            }
        }
    }
});

restartButton.addEventListener('click', () => {
    // Ensure the game is actually running or paused, not in the settings menu
    if (gameArea.style.display === 'none') {
        // If game area is hidden, it means we are in settings or game hasn't started
        // For now, let's make it do nothing if settings are visible.
        return;
    }

    // Clear any existing game loop just in case (e.g., if restarting from a paused state)
    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    // Initialize the game with the last used settings
    initializeGame(lastUsedLength, lastUsedSpeed);
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
