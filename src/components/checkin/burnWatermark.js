export function burnWatermark(dataUrl, goalName) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString();
      const lines = [
        'SweatStake Proof',
        `${dateStr}  ·  ${timeStr}`,
      ];
      if (goalName) lines.push(`Goal: ${goalName}`);

      const fontSize = Math.max(14, Math.round(img.width * 0.035));
      ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
      const padding = fontSize * 0.6;
      const lineHeight = fontSize * 1.4;

      let maxTextWidth = 0;
      lines.forEach((line) => {
        const w = ctx.measureText(line).width;
        if (w > maxTextWidth) maxTextWidth = w;
      });

      const boxWidth = maxTextWidth + padding * 2;
      const boxHeight = lines.length * lineHeight + padding * 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(padding, img.height - boxHeight - padding, boxWidth, boxHeight);

      ctx.fillStyle = '#FFD700';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        const y = img.height - boxHeight - padding + padding + lineHeight * i + lineHeight / 2;
        ctx.fillText(line, padding * 2, y);
      });

      canvas.toBlob((blob) => {
        const file = new File([blob], `checkin-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve({ file, url: URL.createObjectURL(blob), timestamp: now.toISOString() });
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}