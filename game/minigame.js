let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

window.addEventListener("mousedown", function (event) {
    if (phase == "waiting") {
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        phase = "stretching";
        window.requestAnimationFrame(animate);
    }
});

window.addEventListener("mouseup", function (event) {
    if (phase == "stretching") {
        phase = "turning";
    }
});

// The main game loop
function animate(timestamp) {
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    switch (phase) {
        case "waiting":
            return; // Stop the loop
        case "stretching": {
            sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
            break;
        }
        case "turning": {
            sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

            if (sticks.last().rotation > 90) {
                sticks.last().rotation = 90;

                const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                if (nextPlatform) {
                    // Increase score
                    score += perfectHit ? 2 : 1;
                    scoreElement.innerText = score;

                    if (perfectHit) {
                        perfectElement.style.opacity = 1;
                        setTimeout(() => (perfectElement.style.opacity = 0), 1000);
                    }

                    generatePlatform();
                    generateTree();
                    generateTree();
                }

                phase = "walking";
            }
            break;
        }
        case "walking": {
            heroX += (timestamp - lastTimestamp) / walkingSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (nextPlatform) {
                // If hero will reach another platform then limit it's position at it's edge
                const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "transitioning";
                }
            } else {
                // If hero won't reach another platform then limit it's position at the end of the pole
                const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "falling";
                }
            }
            break;
        }
        case "transitioning": {
            sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
                // Add the next step
                sticks.push({
                    x: nextPlatform.x + nextPlatform.w,
                    length: 0,
                    rotation: 0
                });
                phase = "waiting";
            }
            break;
        }
        case "falling": {
            if (sticks.last().rotation < 180)
                sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

            heroY += (timestamp - lastTimestamp) / fallingSpeed;
            const maxHeroY =
                platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
            if (heroY > maxHeroY) {
                restartButton.style.display = "block";
                return;
            }
            break;
        }
        default:
            throw Error("Wrong phase");
    }

    draw();
    window.requestAnimationFrame(animate);

    lastTimestamp = timestamp;
}

function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();

    // Center main canvas area to the middle of the screen
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );

    // Draw scene
    drawPlatforms();
    drawHero();
    drawSticks();

    // Restore transformation
    ctx.restore();
}

function drawPlatforms() {
    platforms.forEach(({ x, w }) => {
        // Draw platform
        ctx.fillStyle = "black";
        ctx.fillRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2
        );

        // Draw perfect area only if hero did not yet reach the platform
        if (sticks.last().x < x) {
            ctx.fillStyle = "red";
            ctx.fillRect(
                x + w / 2 - perfectAreaSize / 2,
                canvasHeight - platformHeight,
                perfectAreaSize,
                perfectAreaSize
            );
        }
    });
}

function drawSticks() {
    sticks.forEach((stick) => {
        ctx.save();

        // Move the anchor point to the start of the stick and rotate
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        // Draw stick
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        // Restore transformations
        ctx.restore();
    });
}

function drawHero() {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.translate(
        heroX - heroWidth / 2,
        heroY + canvasHeight - platformHeight - heroHeight / 2
    );

    // Body
    drawRoundedRect(
        -heroWidth / 2,
        -heroHeight / 2,
        heroWidth,
        heroHeight - 4,
        5
    );

    // Legs
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    ctx.fill();

    // Band
    ctx.fillStyle = "green";
    ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();

    ctx.restore();
}