(function(){
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    const qrText = document.getElementById('qrText');
    const qrColor = document.getElementById('qrColor');
    const bgColor = document.getElementById('bgColor');
    const qrSize = document.getElementById('qrSize');
    const qrMargin = document.getElementById('qrMargin');
    const noiseIntensity = document.getElementById('noiseIntensity');
    const filmEffect = document.getElementById('filmEffect');
    const generateBtn = document.getElementById('generateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const cornerRadius = document.getElementById('cornerRadius');
    const radiusValue = document.getElementById('radiusValue');
    const captionText = document.getElementById('captionText');
    const captionColor = document.getElementById('captionColor');
    const captionSize = document.getElementById('captionSize');
    const captionSizeValue = document.getElementById('captionSizeValue');
    const sizeValue = document.getElementById('sizeValue');
    const marginValue = document.getElementById('marginValue');
    const noiseValue = document.getElementById('noiseValue');

    let currentQRImage = null;

    async function generateQR() {
        const text = qrText.value.trim();
        if (!text) {
            alert("Введите текст или ссылку");
            return null;
        }
        const size = parseInt(qrSize.value);
        const margin = parseInt(qrMargin.value);
        const color = qrColor.value;
        const bg = bgColor.value;

        const qrCanvas = document.createElement('canvas');
        try {
            await QRCode.toCanvas(qrCanvas, text, {
                width: size,
                margin: margin,
                color: { dark: color, light: bg },
                errorCorrectionLevel: 'H'
            });
            return qrCanvas;
        } catch(err) {
            console.error(err);
            alert("Ошибка генерации QR");
            return null;
        }
    }

    function applyEffects(sourceCanvas) {
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const effectCanvas = document.createElement('canvas');
        effectCanvas.width = w;
        effectCanvas.height = h;
        const effCtx = effectCanvas.getContext('2d');
        effCtx.drawImage(sourceCanvas, 0, 0);

        const intensity = parseFloat(noiseIntensity.value);
        if (intensity > 0) {
            const imageData = effCtx.getImageData(0, 0, w, h);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 255 * intensity;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
                data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
            }
            effCtx.putImageData(imageData, 0, 0);
        }

        const film = filmEffect.value;
        if (film === 'scanlines') {
            effCtx.globalCompositeOperation = 'overlay';
            effCtx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let y = 0; y < h; y += 4) {
                effCtx.fillRect(0, y, w, 2);
            }
            effCtx.globalCompositeOperation = 'source-over';
        } else if (film === 'grain') {
            const imgData = effCtx.getImageData(0, 0, w, h);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                const g = Math.random() * 40;
                d[i] = Math.min(255, d[i] + g);
                d[i+1] = Math.min(255, d[i+1] + g);
                d[i+2] = Math.min(255, d[i+2] + g);
            }
            effCtx.putImageData(imgData, 0, 0);
        } else if (film === 'vintage') {
            effCtx.fillStyle = 'rgba(30,20,10,0.2)';
            effCtx.fillRect(0, 0, w, h);
            effCtx.globalCompositeOperation = 'multiply';
            effCtx.fillStyle = '#aa8844';
            effCtx.globalAlpha = 0.07;
            effCtx.fillRect(0, 0, w, h);
            effCtx.globalCompositeOperation = 'source-over';
            effCtx.globalAlpha = 1.0;
        }
        return effectCanvas;
    }

    function roundCorners(sourceCanvas, radius) {
        if (radius <= 0) return sourceCanvas;
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const rounded = document.createElement('canvas');
        rounded.width = w;
        rounded.height = h;
        const rCtx = rounded.getContext('2d');
        rCtx.save();
        rCtx.beginPath();
        rCtx.moveTo(radius, 0);
        rCtx.lineTo(w - radius, 0);
        rCtx.quadraticCurveTo(w, 0, w, radius);
        rCtx.lineTo(w, h - radius);
        rCtx.quadraticCurveTo(w, h, w - radius, h);
        rCtx.lineTo(radius, h);
        rCtx.quadraticCurveTo(0, h, 0, h - radius);
        rCtx.lineTo(0, radius);
        rCtx.quadraticCurveTo(0, 0, radius, 0);
        rCtx.closePath();
        rCtx.clip();
        rCtx.drawImage(sourceCanvas, 0, 0);
        rCtx.restore();
        return rounded;
    }

    function addCaption(sourceCanvas, caption, color, fontSizePx) {
        if (!caption || caption.trim() === "") return sourceCanvas;
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const textHeight = fontSizePx + 12;
        const result = document.createElement('canvas');
        result.width = w;
        result.height = h + textHeight;
        const resCtx = result.getContext('2d');
        resCtx.fillStyle = bgColor.value;
        resCtx.fillRect(0, 0, w, h + textHeight);
        resCtx.drawImage(sourceCanvas, 0, 0);
        resCtx.font = `${fontSizePx}px 'Courier New', monospace`;
        resCtx.fillStyle = color;
        resCtx.textAlign = 'center';
        resCtx.textBaseline = 'top';
        resCtx.fillText(caption, w/2, h + (textHeight - fontSizePx)/2);
        return result;
    }

    async function renderFinal() {
        let qrCanvasRaw = await generateQR();
        if (!qrCanvasRaw) return;

        let effectCanvas = applyEffects(qrCanvasRaw);
        const radius = parseInt(cornerRadius.value) || 0;
        if (radius > 0) effectCanvas = roundCorners(effectCanvas, radius);
        
        const caption = captionText.value.trim();
        if (caption) {
            effectCanvas = addCaption(effectCanvas, caption, captionColor.value, parseInt(captionSize.value));
        }
        
        canvas.width = effectCanvas.width;
        canvas.height = effectCanvas.height;
        ctx.drawImage(effectCanvas, 0, 0);
        currentQRImage = effectCanvas;
    }

    async function exportPNG() {
        if (!currentQRImage) {
            await renderFinal();
            if (!currentQRImage) return;
        }
        const link = document.createElement('a');
        const textForName = (qrText.value.trim() || 'qrcode').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
        link.download = `reagent_qr_${textForName}.png`;
        link.href = currentQRImage.toDataURL('image/png');
        link.click();
    }

    generateBtn.addEventListener('click', renderFinal);
    exportBtn.addEventListener('click', exportPNG);

    qrText.addEventListener('input', renderFinal);
    qrColor.addEventListener('input', renderFinal);
    bgColor.addEventListener('input', renderFinal);
    
    qrSize.addEventListener('input', () => {
        sizeValue.innerText = qrSize.value + 'px';
        renderFinal();
    });
    qrMargin.addEventListener('input', () => {
        marginValue.innerText = qrMargin.value;
        renderFinal();
    });
    noiseIntensity.addEventListener('input', () => {
        noiseValue.innerText = noiseIntensity.value;
        renderFinal();
    });
    filmEffect.addEventListener('change', renderFinal);
    cornerRadius.addEventListener('input', () => {
        radiusValue.innerText = cornerRadius.value + 'px';
        renderFinal();
    });
    captionText.addEventListener('input', renderFinal);
    captionColor.addEventListener('input', renderFinal);
    captionSize.addEventListener('input', () => {
        captionSizeValue.innerText = captionSize.value + 'px';
        renderFinal();
    });

    renderFinal();
})();