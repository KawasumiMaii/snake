// 获取canvas元素和2D渲染上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
// const startButton = document.getElementById('startButton'); // Old button
const scoreDisplay = document.getElementById('score');
const lengthDisplay = document.getElementById('length'); // 获取长度显示元素

// 新增：获取设置相关的DOM元素
const settingsPanel = document.getElementById('settingsPanel');
const gameArea = document.getElementById('gameArea');
const initialLengthInput = document.getElementById('initialLength');
const speedRadioButtons = document.querySelectorAll('input[name="speed"]'); // NodeList
const startGameButton = document.getElementById('startGameButton'); // New start button

// 游戏参数
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 蛇的状态 - 将在 initializeGame 中根据设置进行初始化
let snake = []; // Initialize as empty, will be populated in initializeGame
let dx = 0;
let dy = 0;

// 食物初始状态
let food = { x: 15, y: 15 }; // Will be placed properly in initializeGame

// 分数
let score = 0;

// 游戏是否正在进行
let gameRunning = false;

// 主游戏循环的ID
let gameLoopId;

// 新增：保存当前游戏速度的延迟值
let currentSpeedDelay = 350; // Default to slow, will be updated by settings

// --- 主要游戏逻辑函数 ---

// 主游戏循环
function mainGameLoop() {
    if (!gameRunning) {
        if (gameLoopId) clearInterval(gameLoopId);
        gameLoopId = null; // Ensure it's nulled if game stops
        return;
    }

    setTimeout(() => {
        // 在 setTimeout 回调开始时再次检查 gameRunning
        // 这是因为从 mainGameLoop 开始到 setTimeout 回调执行之间，状态可能已经改变
        if (!gameRunning) {
             if (gameLoopId) { // Ensure loop is cleared if it hasn't been by game over logic
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
            // clearInterval(gameLoopId); // Already handled by the check at the start of mainGameLoop or its callback
            // gameLoopId = null; // Handled above
            alert("游戏结束! 你的分数是: " + score);
            // 新增：游戏结束后显示设置界面，隐藏游戏区域
            settingsPanel.style.display = 'block'; // Or 'flex' if it was that
            gameArea.style.display = 'none';
            // No return needed here as gameRunning is false, loop will stop
        }
    }, currentSpeedDelay); // 使用 currentSpeedDelay
}

// 清除画布
function clearCanvas() {
    ctx.fillStyle = '#2c3e50'; // New OPAQUE dark background color for active game area
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 移动蛇的逻辑
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

// 绘制游戏元素（蛇和食物）
function drawGame() {
    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#76ff03'; // 蛇头使用亮绿色，更突出
        } else {
            ctx.fillStyle = '#4caf50'; // 蛇身体使用较深的绿色
        }
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1); // 绘制蛇的每一节
    });

    // 绘制食物
    ctx.fillStyle = '#ff6b6b'; // 食物颜色 (ensure this is still a good contrast)
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

// 检查游戏是否结束
function checkGameOver() {
    // if (!gameRunning) return true; // This check is good but gameRunning is primary driver
    const head = snake[0];
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}

// 随机放置食物
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

// 初始化游戏或重置游戏 - 现在接收设置参数
function initializeGame(initialLength, speedSetting) {
    // 设置速度
    switch (speedSetting) {
        case 'slow':
            currentSpeedDelay = 350;
            break;
        case 'medium':
            currentSpeedDelay = 200; // 中速
            break;
        case 'fast':
            currentSpeedDelay = 100; // 快速
            break;
        default:
            currentSpeedDelay = 350;
    }

    // 初始化蛇的位置和长度
    snake = [];
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    for (let i = 0; i < initialLength; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    
    dx = 0; 
    dy = 0;
    if(initialLength > 1 && snake.length > 1 && snake[0].x !== snake[1].x) { // Ensure not a single block and actually horizontal
        dx = 1; 
    } else if (initialLength > 1 && snake.length > 1 && snake[0].y !== snake[1].y) { // Vertical initial snake
        dy = 1;
    } else if (initialLength === 1) {
        dx = 0; // Single block, stationary
        dy = 0;
    } else { // Default for safety, though covered by above
        dx = 1; 
    }


    score = 0;
    scoreDisplay.textContent = score;
    lengthDisplay.textContent = snake.length; 

    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    // gameRunning = false; // Set to false briefly to ensure clean state before starting
    
    placeFood(); 

    gameRunning = true; // Set to true just before starting the loop
    gameLoopId = setInterval(mainGameLoop, 50); 

    clearCanvas();
    drawGame();
}

// --- 事件监听器 ---

// 修改后的开始游戏按钮事件监听器
startGameButton.addEventListener('click', () => {
    const selectedLength = parseInt(initialLengthInput.value, 10);
    let selectedSpeed = 'slow'; 
    speedRadioButtons.forEach(radio => {
        if (radio.checked) {
            selectedSpeed = radio.value;
        }
    });

    if (selectedLength < 1 || selectedLength > 10 || isNaN(selectedLength)) {
        alert("初始长度必须在 1 到 10 之间。");
        initialLengthInput.value = Math.max(1, Math.min(10, selectedLength || 1)); // Correct invalid input
        return;
    }

    settingsPanel.style.display = 'none'; 
    gameArea.style.display = 'flex';    // Show game area, use flex for centering if its CSS is set up for it.
                                        // Otherwise 'block' might be more appropriate. Assuming flex based on typical layouts.
    initializeGame(selectedLength, selectedSpeed); 
});


document.addEventListener('keydown', (event) => {
    if (!gameRunning && event.key.startsWith("Arrow")) return;

    const prevDx = dx; 
    const prevDy = dy;

    switch (event.key) {
        case 'ArrowUp':
            if (prevDy === 0) { dx = 0; dy = -1; } 
            break;
        case 'ArrowDown':
            if (prevDy === 0) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (prevDx === 0) { dx = -1; dy = 0; } 
            break;
        case 'ArrowRight':
            if (prevDx === 0) { dx = 1; dy = 0; }
            break;
    }
});

// 初始状态：不自动开始游戏，等待用户点击 startGameButton
settingsPanel.style.display = 'block'; 
gameArea.style.display = 'none';
// No initial clearCanvas() or drawGame() here, as game starts after settings.
