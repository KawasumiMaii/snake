// 获取canvas元素和2D渲染上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');

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
    if (!gameRunning) return; // 如果游戏未运行，则退出循环

    // 延迟执行，以确保蛇在游戏开始后才移动
    setTimeout(() => {
        clearCanvas(); // 清除画布
        moveSnake();   // 移动蛇
        drawGame();    // 绘制游戏元素

        // 检查游戏结束条件
        if (checkGameOver()) {
            gameRunning = false;
            clearInterval(gameLoopId); // 清除游戏循环
            alert("游戏结束! 你的分数是: " + score); // 弹出游戏结束提示
            return; // 退出函数，不再继续游戏循环
        }
    }, 100); // 这里的100ms是蛇移动的间隔，可以调整以改变速度
}


// 清除画布
function clearCanvas() {
    ctx.fillStyle = 'white'; // 设置背景色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 填充整个画布
}

// 移动蛇的逻辑
function moveSnake() {
    // 根据当前方向(dx, dy)计算蛇头的新位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // 将新蛇头添加到蛇身体数组的头部

    // 检查蛇是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++; // 分数增加
        scoreDisplay.textContent = score; // 更新分数显示
        placeFood(); // 重新放置食物
    } else {
        snake.pop(); // 如果没有吃到食物，则移除蛇尾，保持蛇的长度不变
    }
}

// 绘制游戏元素（蛇和食物）
function drawGame() {
    // 绘制蛇
    ctx.fillStyle = 'green'; // 设置蛇的颜色
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2); // 绘制蛇的每一节，-2是为了格子间的空隙
    });

    // 绘制食物
    ctx.fillStyle = 'red'; // 设置食物的颜色
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2); // 绘制食物
}

// 检查游戏是否结束
function checkGameOver() {
    const head = snake[0];

    // 检查是否撞墙
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true; // 撞墙，游戏结束
    }

    // 检查是否撞到自己
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true; // 撞到自己，游戏结束
        }
    }
    return false; // 游戏未结束
}

// 随机放置食物
function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // 确保食物不会生成在蛇身上
    snake.forEach(segment => {
        if (segment.x === food.x && segment.y === food.y) {
            placeFood(); // 如果位置重叠，重新生成食物
        }
    });
}

// 初始化游戏或重置游戏
function initializeGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0; // 初始不移动，等待用户按键
    dy = 0;
    placeFood();
    score = 0;
    scoreDisplay.textContent = score;
    gameRunning = true;

    if (gameLoopId) clearInterval(gameLoopId); // 清除之前的游戏循环
    // 设置新的游戏循环。注意：mainGameLoop 内部通过 setTimeout 控制实际的蛇移动速度。
    // 此处的 setInterval 调用 mainGameLoop 的频率可以比蛇的实际移动频率高，以确保按键响应等及时处理。
    // 例如，蛇每100ms移动一次，但我们可以每50ms调用一次mainGameLoop来检查状态和准备下一次移动。
    gameLoopId = setInterval(mainGameLoop, 50); // 此处50ms是为了更快的逻辑更新循环，实际蛇移动速度由mainGameLoop内的setTimeout控制

    drawGame(); // 初始绘制
}

// --- 事件监听器 ---

// 监听键盘按键事件，控制蛇的移动方向
document.addEventListener('keydown', (event) => {
    // 阻止蛇立即反向移动
    // 例如，如果蛇正在向右移动 (dx=1, dy=0)，则不能立即向左移动
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
clearCanvas(); // 清除一下，避免重复绘制
drawGame(); // 绘制蛇和食物的初始位置
