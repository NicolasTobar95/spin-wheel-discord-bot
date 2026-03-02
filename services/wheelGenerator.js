const { Canvas } = require('skia-canvas');

const GLOBAL_COLORS = {
    outerBorder: '#394e63',   
    indicator: '#EBB31C',     
    dotsAndCenter: '#FFFFFF', 
    text: '#FFFFFF',          
    bgDiscord: '#FFFFFF'      
};

const SECTOR_COLORS = [
    { main: '#F4C025', shadow: '#D4A31A' }, 
    { main: '#F08A1E', shadow: '#CC7015' }, 
    { main: '#CD273F', shadow: '#A51C2C' }, 
    { main: '#D54282', shadow: '#B03066' }, 
    { main: '#873E92', shadow: '#6C2D75' }, 
    { main: '#289CD1', shadow: '#1B7FA8' }, 
    { main: '#21B0B1', shadow: '#169292' }, 
    { main: '#A5CE40', shadow: '#85A82B' }  
];

const SIZES = {
    canvas: 400, center: 200, totalRadius: 170,     
    borderWidth: 14, sliceRadius: 156, shadowWidth: 10,      
    mainRadius: 146, centerRadius: 18, dotRadius: 4          
};

function getColorsForIndex(index) {
    return SECTOR_COLORS[index % SECTOR_COLORS.length];
}

function drawHybridText(ctx, textRaw, sectorAngle, isHighlighted, minFontSize) {
    const maxWidth = 100; // Reducido levemente para mayor margen de seguridad
    const baseX = 90;     
    const maxFontSize = 24;
    
    const availableHeight = baseX * sectorAngle;
    
    // 👑 CORRECCIÓN MATEMÁTICA: Usamos 0.45 en lugar de 0.8 para respetar la forma triangular
    let fontSize = Math.min(maxFontSize, Math.max(minFontSize, availableHeight * 0.45));
    
    let text = textRaw.toUpperCase().trim();
    ctx.font = `bold ${Math.floor(fontSize)}px "Segoe UI"`;
    
    while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
        fontSize -= 1;
        ctx.font = `bold ${Math.floor(fontSize)}px "Segoe UI"`;
    }

    let lines = [text];
    const lineHeight = fontSize * 1.1;
    
    // 👑 CORRECCIÓN: Solo permite 2 líneas si hay espacio de sobra (2.5 veces la altura de la línea)
    if (ctx.measureText(text).width > maxWidth && availableHeight >= lineHeight * 2.5) {
        const words = text.split(' ');
        if (words.length > 1) {
            let line1 = '';
            let line2 = '';
            for (let i = 0; i < words.length; i++) {
                const testLine = line1 + (line1 === '' ? '' : ' ') + words[i];
                if (ctx.measureText(testLine).width <= maxWidth || i === 0) {
                    line1 = testLine;
                } else {
                    line2 = words.slice(i).join(' ');
                    break;
                }
            }
            lines = [line1, line2];
        }
    }

    lines = lines.map(line => {
        let temp = line;
        if (ctx.measureText(temp).width > maxWidth) {
            while (temp.length > 0 && ctx.measureText(temp + '...').width > maxWidth) {
                temp = temp.slice(0, -1);
            }
            temp += '...';
        }
        return temp;
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHighlighted ? '#000000' : GLOBAL_COLORS.text;
    
    if (!isHighlighted) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
    } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    const yOffset = 0; 

    if (lines.length === 1) {
        ctx.fillText(lines[0], baseX, yOffset); 
    } else {
        ctx.fillText(lines[0], baseX, (-lineHeight / 2) + yOffset); 
        ctx.fillText(lines[1], baseX, (lineHeight / 2) + yOffset);  
    }
}

function createWheelSprite(options, highlightIndex = -1) {
    const sprite = new Canvas(SIZES.canvas, SIZES.canvas);
    const ctx = sprite.getContext('2d');
    ctx.translate(SIZES.center, SIZES.center);

    const numOptions = options.length;
    const sectorAngle = (2 * Math.PI) / numOptions;
    const bleed = 6; 

    for (let i = 0; i < numOptions; i++) {
        const baseColors = getColorsForIndex(i);
        const isHighlighted = i === highlightIndex;
        
        const colors = {
            main: isHighlighted ? '#FFFFFF' : baseColors.main,
            shadow: isHighlighted ? '#E0E0E0' : baseColors.shadow
        };

        const startAngle = i * sectorAngle;
        const endAngle = (i + 1) * sectorAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SIZES.sliceRadius + bleed, startAngle, endAngle);
        ctx.fillStyle = colors.shadow;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SIZES.mainRadius + bleed, startAngle, endAngle);
        ctx.fillStyle = colors.main;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo((SIZES.sliceRadius + bleed) * Math.cos(startAngle), (SIZES.sliceRadius + bleed) * Math.sin(startAngle));
        ctx.lineWidth = 2;
        ctx.strokeStyle = GLOBAL_COLORS.dotsAndCenter;
        ctx.stroke();

        ctx.save();
        ctx.rotate((i * sectorAngle) + (sectorAngle / 2));
        drawHybridText(ctx, options[i], sectorAngle, isHighlighted, 10);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, SIZES.totalRadius - (SIZES.borderWidth/2), 0, 2 * Math.PI);
    ctx.lineWidth = SIZES.borderWidth;
    ctx.strokeStyle = GLOBAL_COLORS.outerBorder;
    ctx.stroke();

    for (let i = 0; i < numOptions; i++) {
        const startAngle = i * sectorAngle;
        ctx.beginPath();
        const dotRadius_mid = SIZES.totalRadius - (SIZES.borderWidth/2);
        ctx.arc(dotRadius_mid * Math.cos(startAngle), dotRadius_mid * Math.sin(startAngle), SIZES.dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = GLOBAL_COLORS.dotsAndCenter;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, SIZES.centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = GLOBAL_COLORS.dotsAndCenter;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();

    return sprite;
}

function createWeightedWheelSprite(sectors, highlightIndex = -1) {
    const sprite = new Canvas(SIZES.canvas, SIZES.canvas);
    const ctx = sprite.getContext('2d');
    ctx.translate(SIZES.center, SIZES.center);

    const bleed = 6;

    for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        const baseColors = getColorsForIndex(i);
        const isHighlighted = i === highlightIndex;

        const colors = {
            main: isHighlighted ? '#FFFFFF' : baseColors.main,
            shadow: isHighlighted ? '#E0E0E0' : baseColors.shadow
        };

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SIZES.sliceRadius + bleed, sector.startAngle, sector.endAngle);
        ctx.fillStyle = colors.shadow;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SIZES.mainRadius + bleed, sector.startAngle, sector.endAngle);
        ctx.fillStyle = colors.main;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo((SIZES.sliceRadius + bleed) * Math.cos(sector.startAngle), (SIZES.sliceRadius + bleed) * Math.sin(sector.startAngle));
        ctx.lineWidth = 2;
        ctx.strokeStyle = GLOBAL_COLORS.dotsAndCenter;
        ctx.stroke();

        ctx.save();
        ctx.rotate(sector.centerAngle);
        const currentSectorAngle = sector.endAngle - sector.startAngle;
        if (currentSectorAngle > 0.08) {
            drawHybridText(ctx, sector.name, currentSectorAngle, isHighlighted, 8);
        }
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, SIZES.totalRadius - (SIZES.borderWidth/2), 0, 2 * Math.PI);
    ctx.lineWidth = SIZES.borderWidth;
    ctx.strokeStyle = GLOBAL_COLORS.outerBorder;
    ctx.stroke();

    for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        ctx.beginPath();
        const dotRadius_mid = SIZES.totalRadius - (SIZES.borderWidth/2);
        ctx.arc(dotRadius_mid * Math.cos(sector.startAngle), dotRadius_mid * Math.sin(sector.startAngle), SIZES.dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = GLOBAL_COLORS.dotsAndCenter;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, SIZES.centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = GLOBAL_COLORS.dotsAndCenter;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();

    return sprite;
}

// 👑 MODO DIOS: Esta función ahora crea una "foto" solo de la flecha
function createStaticOverlaySprite() {
    const sprite = new Canvas(SIZES.canvas, SIZES.canvas);
    const ctx = sprite.getContext('2d');

    const tipX = SIZES.center + SIZES.sliceRadius - 6; 
    const cx = SIZES.center + SIZES.totalRadius + 10;   
    const r = 16; 

    ctx.beginPath();
    ctx.moveTo(cx, SIZES.center - r);
    ctx.arc(cx, SIZES.center, r, -Math.PI/2, Math.PI/2);
    ctx.lineTo(tipX, SIZES.center);
    ctx.lineTo(cx, SIZES.center - r);
    ctx.closePath();
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = GLOBAL_COLORS.indicator;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, SIZES.center, 6, 0, 2 * Math.PI);
    ctx.fillStyle = GLOBAL_COLORS.bgDiscord; 
    ctx.fill();

    return sprite;
}

module.exports = { createWheelSprite, createWeightedWheelSprite, createStaticOverlaySprite, GLOBAL_COLORS };