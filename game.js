// 画像のパス
const IMAGE_PATH = ".";  

// 画面の幅と高さ
const WIDTH = 800, HEIGHT = 600;

// キャンバスとコンテキストの設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// スケーリング用の変数
let scale;
let offsetX;
let offsetY;

// 画像の読み込み
const loadImage = (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
};

// グローバル変数として追加
let lastNikuTime = 0;
const nikuInterval = 2000; // 2秒ごとに生成

// ゲームの初期化
const init = async () => {
    const background = await loadImage(`${IMAGE_PATH}/images/background2.png`);
    const playerImages = [
        await loadImage(`${IMAGE_PATH}/images/dog1.png`),
        await loadImage(`${IMAGE_PATH}/images/dog2.png`)
    ];
    const leftButtonImg = await loadImage(`${IMAGE_PATH}/images/left1.png`);
    const rightButtonImg = await loadImage(`${IMAGE_PATH}/images/right1.png`);
    const nikuImg = await loadImage(`${IMAGE_PATH}/images/niku.png`);
    const heartImg = await loadImage(`${IMAGE_PATH}/images/heart1.png`);

    // プレイヤーの初期位置と設定
    let playerX = WIDTH / 2 - playerImages[0].width / 2;
    const playerY = 400;
    let playerIndex = 0;
    const playerSpeed = 2;
    const nikuList = [];
    const nikuSpeed = 5;

    // ボタンの位置とサイズ
    const newButtonWidth = 50;
    const newButtonHeight = 50;
    const leftButtonX = 10;
    const leftButtonY = HEIGHT - 150;
    const rightButtonX = WIDTH - 100;
    const rightButtonY = HEIGHT - 150;

    let heartTimer = 0;
    let moveLeft = false;
    let moveRight = false;
    let facingRight = false;

    // スケーリングの設定
    function setScale() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        scale = Math.min(windowWidth / WIDTH, windowHeight / HEIGHT);
        canvas.width = WIDTH * scale;
        canvas.height = HEIGHT * scale;
        offsetX = (windowWidth - canvas.width) / 2;
        offsetY = (windowHeight - canvas.height) / 2;
        canvas.style.position = 'absolute';
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
    }

    // 初期スケール設定
    setScale();

    // ウィンドウリサイズ時にスケールを再設定
    window.addEventListener('resize', setScale);

    // niku.pngを生成する関数
    function createNiku() {
        const nikuX = Math.random() * (WIDTH - nikuImg.width);
        const nikuY = 0;
        nikuList.push({ x: nikuX, y: nikuY });
    }

    // メインループ
    const gameLoop = () => {
        ctx.save();
        ctx.scale(scale, scale);

        // 背景の描画
        ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

        // プレイヤーの移動と向きの設定
        if (moveLeft) {
            playerX -= playerSpeed;
            facingRight = false;
        } else if (moveRight) {
            playerX += playerSpeed;
            facingRight = true;
        }

        // プレイヤーアイコンが画面外に出ないように制御
        if (playerX < 0) {
            playerX = 0;
        } else if (playerX + playerImages[playerIndex].width > WIDTH) {
            playerX = WIDTH - playerImages[playerIndex].width;
        }

        // プレイヤーのアニメーション
        if (moveLeft || moveRight) {
            playerIndex = (playerIndex + 1) % playerImages.length;
        } else {
            playerIndex = 0;
        }

        // niku.pngの生成
        const currentTime = Date.now();
        if (currentTime - lastNikuTime > nikuInterval) {
            createNiku();
            lastNikuTime = currentTime;
        }

        // 画面上のniku.pngが3未満の場合、即座に新しいものを生成
        while (nikuList.length < 3) {
            createNiku();
        }

        // niku.png の落下処理
        for (let i = nikuList.length - 1; i >= 0; i--) {
            const niku = nikuList[i];
            niku.y += nikuSpeed;
            ctx.drawImage(nikuImg, niku.x, niku.y);

            // 画面外に出たniku.pngを削除
            if (niku.y > HEIGHT) {
                nikuList.splice(i, 1);
                continue;
            }

            // プレイヤーと niku.png の衝突判定
            if (niku.y >= playerY - nikuImg.height &&
                niku.y <= playerY + playerImages[playerIndex].height &&
                niku.x >= playerX - nikuImg.width / 2 &&
                niku.x <= playerX + playerImages[playerIndex].width - nikuImg.width / 2) {
                nikuList.splice(i, 1);
                heartTimer = 3;
                i--;
            }
        }

        // heart.png の表示
        if (heartTimer > 0) {
            ctx.drawImage(heartImg, playerX + playerImages[playerIndex].width - heartImg.width + 10, playerY, heartImg.width / 10, heartImg.height / 10);
            heartTimer --;
        }

        // プレイヤーの描画
        let playerImg = playerImages[playerIndex];
        ctx.save();
        if (facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-WIDTH, 0);
        }
        ctx.drawImage(playerImg, facingRight ? WIDTH - playerX - playerImg.width : playerX, playerY);
        ctx.restore();

        // left.png と right.png の描画
        ctx.drawImage(leftButtonImg, leftButtonX, leftButtonY, newButtonWidth, newButtonHeight);
        ctx.drawImage(rightButtonImg, rightButtonX, rightButtonY, newButtonWidth, newButtonHeight);

        ctx.restore();
        requestAnimationFrame(gameLoop);
    };

    // イベント処理
    function handleInput(x, y) {
        const scaledX = (x - offsetX) / scale;
        const scaledY = (y - offsetY) / scale;

        if (scaledX > leftButtonX && scaledX < leftButtonX + newButtonWidth &&
            scaledY > leftButtonY && scaledY < leftButtonY + newButtonHeight) {
            moveLeft = true;
            moveRight = false;
            facingRight = false;
        } else if (scaledX > rightButtonX && scaledX < rightButtonX + newButtonWidth &&
            scaledY > rightButtonY && scaledY < rightButtonY + newButtonHeight) {
            moveRight = true;
            moveLeft = false;
            facingRight = true;
        }
    }

    canvas.addEventListener('mousedown', (event) => {
        handleInput(event.clientX, event.clientY);
    });

    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        handleInput(touch.clientX, touch.clientY);
    });

    function stopMovement() {
        moveLeft = false;
        moveRight = false;
    }

    canvas.addEventListener('mouseup', stopMovement);
    canvas.addEventListener('touchend', stopMovement);

    gameLoop();
};

init();
