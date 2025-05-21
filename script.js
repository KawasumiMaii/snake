// 获取canvas元素和2D渲染上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');
const lengthDisplay = document.getElementById('length'); // 获取长度显示元素

// 游戏参数
const gridSize = 20; // 游戏区域中每个格子的大小
const tileCount = canvas.width / gridSize; // 游戏区域的宽度（以格子为单位）

// 蛇的初始状态
let snake = [
    { x: 10, y: 10 } // 蛇头初始位置
];
let dx = 0; // 蛇在x轴上的初始移动速度
let dy = 0; // 蛇在y轴上的初始移动速度

// 食物初始状态
let food = { x: 15, y: 15 }; // 食物初始位置

// 分数
let score = 0;

// 游戏是否正在进行
let gameRunning = false;

// 主游戏循环的ID
let gameLoopId;

// --- 主要游戏逻辑函数 ---

// 主游戏循环
function mainGameLoop() {
    // 首先检查 gameRunning 状态，如果已经是 false，说明游戏结束逻辑已处理或正在处理，直接返回
    if (!gameRunning) {
        // 如果 gameLoopId 还存在，清除它以确保不会再调用 mainGameLoop
        // 这可以处理一种边缘情况：在 checkGameOver 之后，但在 clearInterval 之前，又一次循环被触发
        if (gameLoopId) {
            clearInterval(gameLoopId);
            gameLoopId = null; // Explicitly set to null after clearing
        }
        return;
    }

    // 延迟执行，以确保蛇在游戏开始后才移动 (这个setTimeout控制实际的“帧率”或蛇的移动速度)
    // 注意：这个setTimeout本身不会导致多次弹窗，问题在于 setInterval 和 gameRunning 状态的管理
    setTimeout(() => {
        // 在 setTimeout 回调开始时再次检查 gameRunning
        // 这是因为从 mainGameLoop 开始到 setTimeout 回调执行之间，状态可能已经改变
        if (!gameRunning) {
            // If game stopped while timeout was pending, ensure loop ID is also cleared if not already
            if (gameLoopId) {
                clearInterval(gameLoopId);
                gameLoopId = null;
            }
            return;
        }

        clearCanvas(); // 清除画布
        moveSnake();   // 移动蛇 (如果移动导致游戏结束，checkGameOver会发现)
        drawGame();    // 绘制游戏元素

        // 检查游戏结束条件
        if (checkGameOver()) {
            // 关键：在执行游戏结束逻辑之前，立即设置 gameRunning 为 false
            gameRunning = false; // 防止后续的循环或此回调中的代码再次触发游戏结束逻辑
            
            clearInterval(gameLoopId); // 清除 setInterval，停止新的 mainGameLoop 调用
            gameLoopId = null; // 将 gameLoopId 设置为 null，表示循环已停止

            alert("游戏结束! 你的分数是: " + score); // 弹出游戏结束提示
            // 此时因为 gameRunning 是 false, mainGameLoop 的开头和 setTimeout 回调的开头都会直接返回，
            // 不会再执行游戏逻辑或再次调用 checkGameOver
            return; // 从 setTimeout 回调中返回
        }
    }, 350); // 蛇移动的间隔，可以调整以改变速度 (从250ms增加到350ms，使蛇更慢)
}


// 清除画布
function clearCanvas() {
    // 使用 style.css 中定义的 body 背景色作为画布的 "清除" 色，或者用一个接近的 RGBA 值
    // ctx.fillStyle = 'rgba(102, 126, 234, 0.1)'; // Example, if background is #667eea, adjust for transparency
    // For simplicity, using the canvas background from style.css
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // 画布背景色，带透明度 (from style.css #gameCanvas)
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 填充整个画布
}

// 移动蛇的逻辑
function moveSnake() {
    if (!gameRunning) return; // 如果游戏结束，则不移动

    let head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 实现墙壁环绕（穿墙）功能
    if (head.x >= tileCount) { // 如果蛇头超出右边界
        head.x = 0; // 从左边界出现
    } else if (head.x < 0) { // 如果蛇头超出左边界
        head.x = tileCount - 1; // 从右边界出现
    }
    if (head.y >= tileCount) { // 如果蛇头超出下边界
        head.y = 0; // 从上边界出现
    } else if (head.y < 0) { // 如果蛇头超出上边界
        head.y = tileCount - 1; // 从下边界出现
    }

    snake.unshift(head); // 将（可能已调整过位置的）新蛇头添加到蛇的身体数组的头部

    // 检查蛇是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++; // 分数增加
        scoreDisplay.textContent = score; // 更新分数显示
        // lengthDisplay.textContent = snake.length; // 长度已经因为unshift增加，placeFood后长度不变
        placeFood(); // 重新放置食物
    } else {
        snake.pop(); // 如果没有吃到食物，则移除蛇尾，保持蛇的长度不变
    }
    // 更新长度显示 AFTER snake array modification
    lengthDisplay.textContent = snake.length;
}

// 绘制游戏元素（蛇和食物）
function drawGame() {
    // 绘制蛇
    ctx.fillStyle = '#6ab04c'; // 更鲜亮的绿色 (Updated color)
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1); // 微调大小留出缝隙 (Updated size)
    });

    // 绘制食物
    ctx.fillStyle = '#ff6b6b'; // 与按钮颜色一致或近似 (Updated color)
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1); // (Updated size)
}

// 检查游戏是否结束
function checkGameOver() {
    // 如果游戏已经标记为结束 (gameRunning is false)，则直接返回true，避免不必要的检查或逻辑
    if (!gameRunning) return true;

    const head = snake[0];

    // 检查是否撞到自己
    // 从索引1开始遍历蛇的身体（不包括蛇头），检查是否有任何一节与蛇头位置重合
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true; // 撞到自己，游戏结束
        }
    }
    return false; // 游戏未结束 (没有撞到自己)
}

// 随机放置食物
function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // 确保食物不会生成在蛇身上
    for (const segment of snake) { // Changed from forEach to a for...of for easier return from recursive call
        if (segment.x === food.x && segment.y === food.y) {
            placeFood(); // 如果位置重叠，重新生成食物
            return; // Crucial: exit current call after recursion
        }
    }
}

// 初始化游戏或重置游戏
function initializeGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0; // 初始不移动，等待用户按键
    dy = 0;
    score = 0;
    scoreDisplay.textContent = score;
    lengthDisplay.textContent = snake.length; // 设置初始长度显示
    
    // 关键: 在启动新的游戏循环之前，确保旧的已完全停止
    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    // gameRunning = false; // Set to false before placing food and other setup

    placeFood(); // 放置食物要在蛇初始化之后

    gameRunning = true; // 现在可以安全地设置为 true
    
    // 启动游戏循环
    gameLoopId = setInterval(mainGameLoop, 50); // 这个50ms是检查是否要执行下一帧的频率

    // 初始绘制画布和游戏元素 (call after gameRunning is true and loop is set)
    clearCanvas(); 
    drawGame(); 
}

// --- 事件监听器 ---
document.addEventListener('keydown', (event) => {
    // Only process arrow keys if the game is running
    if (!gameRunning && event.key.startsWith("Arrow")) {
        return; // Do not change direction if game is not running
    }
    // If game is not running and it's not an arrow key, do nothing specific here.
    // (e.g. if we had a pause key, it might be handled differently)

    switch (event.key) {
        case 'ArrowUp':
            if (dy === 0) { // 只有当蛇不是垂直移动时，才允许向上
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy === 0) { // 只有当蛇不是垂直移动时，才允许向下
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx === 0) { // 只有当蛇不是水平移动时，才允许向左
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx === 0) { // 只有当蛇不是水平移动时，才允许向右
                dx = 1;
                dy = 0;
            }
            break;
    }
});

startButton.addEventListener('click', initializeGame);

// 初始绘制（游戏开始前）
// 在initializeGame被调用前，先画一次初始状态
clearCanvas(); 
drawGame();
