const GIFEncoder = require('gif-encoder-2');
const { drawWheelFrame, drawWeightedWheelFrame } = require('./wheelGenerator.js');

// Helper para crear confeti
function createParticles() {
    const particles = [];
    const colors = ['#F4C025', '#CD273F', '#289CD1', '#A5CE40', '#873E92'];
    
    // ¡Aumentamos de 60 a 150 partículas!
    for(let i = 0; i < 150; i++) {
        particles.push({
            x: 200, 
            y: 200,
            vx: (Math.random() - 0.5) * 35, // Explosión más ancha (antes 25)
            vy: (Math.random() - 0.5) * 35 - 5, // Salta un poco más alto
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 6 + 4,
            rotation: Math.random() * 360,
            rv: (Math.random() - 0.5) * 15
        });
    }
    return particles;
}

function drawParticles(ctx, particles) {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 1.5; // Gravedad
        p.rotation += p.rv;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
    });
}

/**
 * Genera el GIF animado de la ruleta y determina el ganador
 */
async function generateSpinGif(options) {
    const numOptions = options.length;
    const winnerIndex = Math.floor(Math.random() * numOptions);
    const winnerName = options[winnerIndex];

    const sectorAngle = (2 * Math.PI) / numOptions;
    const centerAngle = (winnerIndex * sectorAngle) + (sectorAngle / 2);
    
    const vueltasCompletas = 4 * 2 * Math.PI;
    const finalRotation = vueltasCompletas + ((2 * Math.PI) - centerAngle);

    const size = 400;
    const encoder = new GIFEncoder(size, size);
    encoder.start();
    encoder.setRepeat(-1); 
    encoder.setDelay(50);  
    encoder.setQuality(10); 

    // Ajuste de tiempos: Freno más seco
    const totalSpinFrames = 70; // (Antes 100) Frena a los 3.5 segundos

    // 1. Fase de giro
    for (let frame = 0; frame <= totalSpinFrames; frame++) {
        const progress = frame / totalSpinFrames;
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentAngle = ease * finalRotation;

        const canvas = drawWheelFrame(options, currentAngle);
        const ctx = canvas.getContext('2d');
        encoder.addFrame(ctx);
    }

    // 2. Fase de Celebración
    const particles = createParticles();
    const celebrationFrames = 30; // 1.5 segundos de parpadeo y confeti

    for (let frame = 0; frame < celebrationFrames; frame++) {
        const highlight = (Math.floor(frame / 4) % 2 === 0) ? winnerIndex : -1;
        
        const canvas = drawWheelFrame(options, finalRotation, highlight);
        const ctx = canvas.getContext('2d');
        
        drawParticles(ctx, particles);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    const buffer = encoder.out.getData();

    return { buffer, winnerName };
}

/**
 * Genera el GIF para la ruleta con pesos
 */
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
    const encoder = new GIFEncoder(size, size);
    encoder.start();
    encoder.setRepeat(-1);
    encoder.setDelay(50);
    encoder.setQuality(10);

    // Ajuste de tiempos: Freno más seco
    const totalSpinFrames = 70; 

    // 1. Fase de giro
    for (let frame = 0; frame <= totalSpinFrames; frame++) {
        const progress = frame / totalSpinFrames;
        const ease = 1 - Math.pow(1 - progress, 4); 
        const currentAnimAngle = ease * finalRotation;

        const canvas = drawWeightedWheelFrame(sectors, currentAnimAngle);
        const ctx = canvas.getContext('2d');
        encoder.addFrame(ctx);
    }

    // 2. Fase de Celebración
    const particles = createParticles();
    const celebrationFrames = 30;

    for (let frame = 0; frame < celebrationFrames; frame++) {
        const highlight = (Math.floor(frame / 4) % 2 === 0) ? winnerIndex : -1;
        
        const canvas = drawWeightedWheelFrame(sectors, finalRotation, highlight);
        const ctx = canvas.getContext('2d');
        
        drawParticles(ctx, particles);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    const buffer = encoder.out.getData();

    return { buffer, winnerName: winner.name };
}

module.exports = { generateSpinGif, generateWeightedSpinGif };