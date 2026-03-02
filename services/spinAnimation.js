const GIFEncoder = require('gif-encoder-2');
const { Canvas } = require('skia-canvas');
const { createWheelSprite, createWeightedWheelSprite, createStaticOverlaySprite, GLOBAL_COLORS } = require('./wheelGenerator.js');

function createParticles() {
    const particles = [];
    const colors = ['#F4C025', '#CD273F', '#289CD1', '#A5CE40', '#873E92'];
    for(let i = 0; i < 150; i++) {
        particles.push({
            x: 200, y: 200,
            vx: (Math.random() - 0.5) * 35, 
            vy: (Math.random() - 0.5) * 35 - 5, 
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 6 + 4
        });
    }
    return particles;
}

function drawParticles(ctx, particles) {
    particles.forEach(p => {
        p.x += p.vx; 
        p.y += p.vy; 
        p.vy += 1.5; 
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
}

async function generateSpinGif(options) {
    const numOptions = options.length;
    const winnerIndex = Math.floor(Math.random() * numOptions);
    const winnerName = options[winnerIndex];

    const sectorAngle = (2 * Math.PI) / numOptions;
    const centerAngle = (winnerIndex * sectorAngle) + (sectorAngle / 2);
    const vueltasCompletas = 4 * 2 * Math.PI;
    const finalRotation = vueltasCompletas + ((2 * Math.PI) - centerAngle);

    const size = 400;
    
    const normalSprite = createWheelSprite(options, -1);
    const highlightSprite = createWheelSprite(options, winnerIndex);
    const overlaySprite = createStaticOverlaySprite();
    
    const canvas = new Canvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const encoder = new GIFEncoder(size, size);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(100); 
    encoder.setQuality(30); 

    const totalSpinFrames = 25; 

    for (let frame = 0; frame <= totalSpinFrames; frame++) {
        const progress = frame / totalSpinFrames;
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentAngle = ease * finalRotation;

        ctx.fillStyle = GLOBAL_COLORS.bgDiscord;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(currentAngle);
        ctx.drawImage(normalSprite, -size/2, -size/2);
        ctx.restore();

        ctx.drawImage(overlaySprite, 0, 0); 
        encoder.addFrame(ctx);
    }

    const particles = createParticles();
    const celebrationFrames = 10; 

    for (let frame = 0; frame < celebrationFrames; frame++) {
        const isFlashing = (Math.floor(frame / 2) % 2 === 0);
        const activeSprite = isFlashing ? highlightSprite : normalSprite;
        
        ctx.fillStyle = GLOBAL_COLORS.bgDiscord;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(finalRotation);
        ctx.drawImage(activeSprite, -size/2, -size/2);
        ctx.restore();

        ctx.drawImage(overlaySprite, 0, 0);
        drawParticles(ctx, particles);
        
        encoder.addFrame(ctx);
    }

    encoder.finish();
    const buffer = encoder.out.getData();

    return { buffer, winnerName };
}

async function generateWeightedSpinGif(parsedOptions) {
    const totalWeight = parsedOptions.reduce((sum, opt) => sum + opt.weight, 0);
    
    let currentAngle = 0;
    const sectors = parsedOptions.map(opt => {
        const angleSize = (opt.weight / totalWeight) * (2 * Math.PI);
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSize;
        const centerAngle = currentAngle + (angleSize / 2);
        currentAngle += angleSize;
        return { ...opt, startAngle, endAngle, centerAngle };
    });

    let randomVal = Math.random() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < sectors.length; i++) {
        randomVal -= sectors[i].weight;
        if (randomVal <= 0) {
            winnerIndex = i;
            break;
        }
    }

    const winner = sectors[winnerIndex];
    const vueltasCompletas = 4 * 2 * Math.PI;
    const finalRotation = vueltasCompletas + ((2 * Math.PI) - winner.centerAngle);

    const size = 400;
    
    const normalSprite = createWeightedWheelSprite(sectors, -1);
    const highlightSprite = createWeightedWheelSprite(sectors, winnerIndex);
    const overlaySprite = createStaticOverlaySprite();
    
    const canvas = new Canvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const encoder = new GIFEncoder(size, size);
    encoder.start();
    encoder.setRepeat(-1);
    encoder.setDelay(100);
    encoder.setQuality(30);

    const totalSpinFrames = 25; 

    for (let frame = 0; frame <= totalSpinFrames; frame++) {
        const progress = frame / totalSpinFrames;
        const ease = 1 - Math.pow(1 - progress, 4); 
        const currentAnimAngle = ease * finalRotation;

        ctx.fillStyle = GLOBAL_COLORS.bgDiscord;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(currentAnimAngle);
        ctx.drawImage(normalSprite, -size/2, -size/2);
        ctx.restore();

        ctx.drawImage(overlaySprite, 0, 0);
        encoder.addFrame(ctx);
    }

    const particles = createParticles();
    const celebrationFrames = 10;

    for (let frame = 0; frame < celebrationFrames; frame++) {
        const isFlashing = (Math.floor(frame / 2) % 2 === 0);
        const activeSprite = isFlashing ? highlightSprite : normalSprite;
        
        ctx.fillStyle = GLOBAL_COLORS.bgDiscord;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(finalRotation);
        ctx.drawImage(activeSprite, -size/2, -size/2);
        ctx.restore();

        ctx.drawImage(overlaySprite, 0, 0);
        drawParticles(ctx, particles);
        
        encoder.addFrame(ctx);
    }

    encoder.finish();
    const buffer = encoder.out.getData();

    return { buffer, winnerName: winner.name };
}

module.exports = { generateSpinGif, generateWeightedSpinGif };