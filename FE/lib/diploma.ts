import QRCode from 'qrcode';

export interface DiplomaInput {
  name: string;
  university: string;
  uuid: string;
  photoDataUrl?: string;
}

async function getQrCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error(err);
    return '';
  }
}

export async function generateDiplomaDataUrl({
  name,
  university,
  uuid,
  photoDataUrl
}: DiplomaInput): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // A4 Landscape at ~200 DPI
  const WIDTH = 2339;
  const HEIGHT = 1654;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decorative Border
  drawDevWeb3Border(ctx, WIDTH, HEIGHT);

  // Load and draw DevWeb3 Logo
  try {
    let logoUrl = "/logo-devweb3-jogja.png";
    if (typeof window !== "undefined") {
      logoUrl = `${window.location.origin}/logo-devweb3-jogja.png`;
    }
    const logoImg = await loadImage(logoUrl);
    // Maintain aspect ratio, fixed height
    const logoHeight = 240;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, WIDTH / 2 - logoWidth / 2, 100, logoWidth, logoHeight);
  } catch (e) {
    console.warn("Failed to load DevWeb3 Logo", e);
  }

  // Vertical Divider for right panel
  ctx.beginPath();
  ctx.moveTo(1720, 450);
  ctx.lineTo(1720, 1050);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Text Styling Constants
  const colorDark = "#0f172a";
  const colorOrange = "#ff6b00";
  const colorGray = "#4b5563";
  const colorLightGray = "#d1d5db";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = WIDTH / 2;

  // CERTIFICATE OF GRADUATION
  ctx.fillStyle = colorDark;
  ctx.font = "900 70px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("CERTIFICATE OF GRADUATION", centerX, 440);

  // THIS IS TO CERTIFY THAT
  ctx.fillStyle = colorGray;
  ctx.font = "700 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("THIS IS TO CERTIFY THAT", centerX, 520);
  
  // Lines flanking "THIS IS TO CERTIFY THAT"
  const textWidth = ctx.measureText("THIS IS TO CERTIFY THAT").width;
  ctx.beginPath();
  ctx.moveTo(centerX - textWidth / 2 - 120, 520);
  ctx.lineTo(centerX - textWidth / 2 - 20, 520);
  ctx.moveTo(centerX + textWidth / 2 + 20, 520);
  ctx.lineTo(centerX + textWidth / 2 + 120, 520);
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Diamond above "THIS IS TO CERTIFY THAT"
  ctx.beginPath();
  ctx.moveTo(centerX, 485);
  ctx.lineTo(centerX + 8, 493);
  ctx.lineTo(centerX, 501);
  ctx.lineTo(centerX - 8, 493);
  ctx.fillStyle = colorOrange;
  ctx.fill();

  // Name with auto-sizing
  ctx.fillStyle = colorDark;
  let nameFontSize = 120;
  const maxNameWidth = 1100; // max width allowed to avoid overlapping side panels
  const nameText = name || "GRADUATE NAME";
  
  ctx.font = `900 ${nameFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  while (ctx.measureText(nameText).width > maxNameWidth && nameFontSize > 40) {
    nameFontSize -= 2;
    ctx.font = `900 ${nameFontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  }
  ctx.fillText(nameText, centerX, 640);

  // Line under name
  ctx.beginPath();
  ctx.moveTo(centerX - 350, 750);
  ctx.lineTo(centerX + 350, 750);
  ctx.strokeStyle = colorLightGray;
  ctx.lineWidth = 2;
  ctx.stroke();

  // HAS SUCCESSFULLY COMPLETED...
  ctx.fillStyle = colorGray;
  ctx.font = "600 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("HAS SUCCESSFULLY COMPLETED THE REQUIREMENTS FOR THE DEGREE OF", centerX, 800);

  // Degree
  ctx.fillStyle = colorOrange;
  ctx.font = "900 40px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("BACHELOR OF", centerX, 860);
  ctx.font = "900 65px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("WEB3 UNIVERSITY TOUR", centerX, 920);

  // AT
  ctx.fillStyle = colorGray;
  ctx.font = "600 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("AT", centerX, 980);

  // University
  ctx.fillStyle = colorDark;
  ctx.font = "900 45px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText(university.toUpperCase() || "UNIVERSITY NAME", centerX, 1040);

  // Date
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).toUpperCase();
  ctx.fillStyle = colorGray;
  ctx.font = "700 28px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText(`AWARDED ON ${today}`, centerX, 1120);

  // Signatures
  // Left Signature
  drawSignatureArea(ctx, 550, 1400, "Yeheskiel", "Yeheskiel Yunus Tame", "Devrel Devweb3 Jogja");
  // Right Signature
  drawSignatureArea(ctx, 1789, 1400, "Singgih", "Singgih Brilian Tara", "Devrel Devweb3 Jogja");

  // Center Logos
  try {
    const getUrl = (path: string) => typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    const [logo1, logo2, logo3] = await Promise.all([
      loadImage(getUrl("/binance-academy.png")),
      loadImage(getUrl("/coinvestasi-logo.png")),
      loadImage(getUrl("/bnb-chain.svg"))
    ]);
    
    const targetHeight = 100;
    
    // Binance Academy logo needs to be larger due to its wide aspect ratio and internal padding
    const h1 = targetHeight * 1.6;
    const w1 = logo1.width * (h1 / logo1.height);
    
    const w2 = logo2.width * (targetHeight / logo2.height);
    const w3 = logo3.width * (targetHeight / logo3.height);
    
    const gap = 80;
    const totalWidth = w1 + gap + w2 + gap + w3;
    
    let startX = centerX - totalWidth / 2;
    
    // Draw Binance Academy
    ctx.drawImage(logo1, startX, 1370 - h1 / 2, w1, h1);
    startX += w1 + gap;
    
    // Draw Coinvestasi
    ctx.drawImage(logo2, startX, 1370 - targetHeight / 2, w2, targetHeight);
    startX += w2 + gap;
    
    // Draw BNB Chain
    ctx.drawImage(logo3, startX, 1370 - targetHeight / 2, w3, targetHeight);
  } catch (e) {
    console.warn("Failed to load bottom logos", e);
  }

  // Left side Photo
  if (photoDataUrl) {
    await drawUserPhoto(ctx, 180, 480, photoDataUrl);
  }

  // Right side QR Code & Verification Box
  await drawVerificationBox(ctx, 1750, 400, uuid);

  return canvas.toDataURL("image/png");
}

export async function generateDiplomaBlob(input: DiplomaInput): Promise<Blob> {
  const dataUrl = await generateDiplomaDataUrl(input);
  return dataUrlToBlob(dataUrl);
}

// === Helpers ===

function drawDevWeb3Border(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const margin = 60;
  const colorOrange = "#ff6b00";

  // Outer bold border
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 10;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Inner thin border
  ctx.lineWidth = 2;
  const innerMargin = margin + 20;
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Corner ornaments (complex L-shapes)
  const cornerSize = 45;
  ctx.lineWidth = 4;
  
  // Top Left
  ctx.beginPath();
  ctx.moveTo(margin + 15, innerMargin + cornerSize);
  ctx.lineTo(innerMargin, innerMargin + cornerSize);
  ctx.lineTo(innerMargin, innerMargin);
  ctx.lineTo(innerMargin + cornerSize, innerMargin);
  ctx.lineTo(innerMargin + cornerSize, margin + 15);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(width - margin - 15, innerMargin + cornerSize);
  ctx.lineTo(width - innerMargin, innerMargin + cornerSize);
  ctx.lineTo(width - innerMargin, innerMargin);
  ctx.lineTo(width - innerMargin - cornerSize, innerMargin);
  ctx.lineTo(width - innerMargin - cornerSize, margin + 15);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(margin + 15, height - innerMargin - cornerSize);
  ctx.lineTo(innerMargin, height - innerMargin - cornerSize);
  ctx.lineTo(innerMargin, height - innerMargin);
  ctx.lineTo(innerMargin + cornerSize, height - innerMargin);
  ctx.lineTo(innerMargin + cornerSize, height - margin - 15);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(width - margin - 15, height - innerMargin - cornerSize);
  ctx.lineTo(width - innerMargin, height - innerMargin - cornerSize);
  ctx.lineTo(width - innerMargin, height - innerMargin);
  ctx.lineTo(width - innerMargin - cornerSize, height - innerMargin);
  ctx.lineTo(width - innerMargin - cornerSize, height - margin - 15);
  ctx.stroke();
  
  // Inner squares at corners
  ctx.fillStyle = colorOrange;
  ctx.fillRect(innerMargin + 5, innerMargin + 5, 10, 10);
  ctx.fillRect(width - innerMargin - 15, innerMargin + 5, 10, 10);
  ctx.fillRect(innerMargin + 5, height - innerMargin - 15, 10, 10);
  ctx.fillRect(width - innerMargin - 15, height - innerMargin - 15, 10, 10);
}

function drawSignatureArea(ctx: CanvasRenderingContext2D, x: number, y: number, cursiveStr: string, name: string, title: string) {
  // Signature line
  ctx.beginPath();
  ctx.moveTo(x - 180, y);
  ctx.lineTo(x + 180, y);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Signature cursive placeholder
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "italic 700 80px 'Brush Script MT', 'Dancing Script', cursive, serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(cursiveStr, x, y - 30);

  // Name
  ctx.font = "700 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(name, x, y + 35);

  // Title
  ctx.font = "600 20px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText(title, x, y + 65);
}

function drawCenterSeal(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const colorOrange = "#ff6b00";
  
  // Outer dashed ring
  ctx.beginPath();
  ctx.arc(x, y, 90, 0, Math.PI * 2);
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // Inner solid ring
  ctx.beginPath();
  ctx.arc(x, y, 75, 0, Math.PI * 2);
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Circular text
  ctx.save();
  ctx.translate(x, y);
  ctx.font = "900 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillStyle = colorOrange;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const text = "CERTIFIED ONCHAIN • VERIFIABLE • TRUSTLESS • ";
  const radius = 62;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate(i * (Math.PI * 2 / text.length) - Math.PI / 2);
    ctx.fillText(text[i], 0, -radius);
    ctx.restore();
  }
  ctx.restore();

  // Center Hexagon/Block icon
  drawHexagon(ctx, x, y, 35, colorOrange);
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Inner hollow
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const x = cx + (r - 12) * Math.cos(angle);
    const y = cy + (r - 12) * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

async function drawUserPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, photoDataUrl: string) {
  const boxWidth = 320;
  const boxHeight = 420;

  const colorOrange = "#ff6b00";
  const colorDark = "#0f172a";

  // Web3 Modern Frame: Outer glow / thick border
  ctx.shadowColor = "rgba(255, 107, 0, 0.25)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 4;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, boxWidth, boxHeight, 15);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0; // reset shadow

  // Inner thin border
  ctx.strokeStyle = colorDark;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 10, y + 10, boxWidth - 20, boxHeight - 20, 10);
  ctx.stroke();

  // Corner accents for Web3 feel
  const accentLength = 30;
  ctx.lineWidth = 4;
  ctx.strokeStyle = colorOrange;
  
  // Top Left
  ctx.beginPath(); ctx.moveTo(x - 8, y + accentLength); ctx.lineTo(x - 8, y - 8); ctx.lineTo(x + accentLength, y - 8); ctx.stroke();
  // Top Right
  ctx.beginPath(); ctx.moveTo(x + boxWidth + 8, y + accentLength); ctx.lineTo(x + boxWidth + 8, y - 8); ctx.lineTo(x + boxWidth - accentLength, y - 8); ctx.stroke();
  // Bottom Left
  ctx.beginPath(); ctx.moveTo(x - 8, y + boxHeight - accentLength); ctx.lineTo(x - 8, y + boxHeight + 8); ctx.lineTo(x + accentLength, y + boxHeight + 8); ctx.stroke();
  // Bottom Right
  ctx.beginPath(); ctx.moveTo(x + boxWidth + 8, y + boxHeight - accentLength); ctx.lineTo(x + boxWidth + 8, y + boxHeight + 8); ctx.lineTo(x + boxWidth - accentLength, y + boxHeight + 8); ctx.stroke();

  // Draw photo inside
  try {
    const img = await loadImage(photoDataUrl);
    
    // Create a clipping path for the inner rounded rectangle
    ctx.save();
    roundRect(ctx, x + 12, y + 12, boxWidth - 24, boxHeight - 24, 8);
    ctx.clip();
    
    // Draw the image filling the area, maintaining aspect ratio roughly
    const imgRatio = img.width / img.height;
    const innerBoxWidth = boxWidth - 24;
    const innerBoxHeight = boxHeight - 24;
    const boxRatio = innerBoxWidth / innerBoxHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > boxRatio) {
      drawHeight = innerBoxHeight;
      drawWidth = img.width * (innerBoxHeight / img.height);
      drawX = (x + 12) + (innerBoxWidth - drawWidth) / 2;
      drawY = y + 12;
    } else {
      drawWidth = innerBoxWidth;
      drawHeight = img.height * (innerBoxWidth / img.width);
      drawX = x + 12;
      drawY = (y + 12) + (innerBoxHeight - drawHeight) / 2;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  } catch (e) {
    console.warn("Failed to draw user photo", e);
  }
}

async function drawVerificationBox(ctx: CanvasRenderingContext2D, x: number, y: number, uuid: string) {
  const colorOrange = "#ff6b00";
  const colorDark = "#0f172a";
  const colorGray = "#4b5563";
  const boxWidth = 450;
  
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = x + boxWidth / 2;

  // CERTIFICATE ID
  ctx.fillStyle = colorDark;
  ctx.font = "800 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("CERTIFICATE ID", centerX, y + 40);
  
  // CC-...
  ctx.fillStyle = colorOrange;
  ctx.font = "800 24px monospace";
  ctx.fillText(uuid, centerX, y + 70);

  // Outer orange box for QR area
  const qrBoxMargin = 40;
  const qrBoxY = y + 110;
  const qrBoxSize = boxWidth - qrBoxMargin * 2;
  
  ctx.strokeStyle = colorOrange;
  ctx.lineWidth = 3;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x + qrBoxMargin, qrBoxY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.stroke();

  // Generate and draw actual QR Code
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://certichain-lilac.vercel.app";
  const verificationUrl = `${baseUrl}/explore?uuid=${uuid}`;
  const qrDataUrl = await getQrCodeDataUrl(verificationUrl);
  
  if (qrDataUrl) {
    try {
      const qrImg = await loadImage(qrDataUrl);
      const innerMargin = 30;
      ctx.drawImage(
        qrImg, 
        x + qrBoxMargin + innerMargin, 
        qrBoxY + innerMargin, 
        qrBoxSize - innerMargin * 2, 
        qrBoxSize - innerMargin * 2
      );
    } catch (e) {
      console.warn("Failed to draw QR image", e);
    }
  }

  // Bracket ornaments inside the QR box
  const bSize = 30;
  const bMargin = 15;
  const bX = x + qrBoxMargin + bMargin;
  const bY = qrBoxY + bMargin;
  const bW = qrBoxSize - bMargin * 2;
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 3;
  
  // Top Left
  ctx.beginPath(); ctx.moveTo(bX, bY + bSize); ctx.lineTo(bX, bY); ctx.lineTo(bX + bSize, bY); ctx.stroke();
  // Top Right
  ctx.beginPath(); ctx.moveTo(bX + bW - bSize, bY); ctx.lineTo(bX + bW, bY); ctx.lineTo(bX + bW, bY + bSize); ctx.stroke();
  // Bottom Left
  ctx.beginPath(); ctx.moveTo(bX, bY + bW - bSize); ctx.lineTo(bX, bY + bW); ctx.lineTo(bX + bSize, bY + bW); ctx.stroke();
  // Bottom Right
  ctx.beginPath(); ctx.moveTo(bX + bW - bSize, bY + bW); ctx.lineTo(bX + bW, bY + bW); ctx.lineTo(bX + bW, bY + bW - bSize); ctx.stroke();

  // VERIFY ONCHAIN
  ctx.fillStyle = colorDark;
  ctx.font = "800 22px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("VERIFY ONCHAIN", centerX, qrBoxY + qrBoxSize + 50);

  // Description
  ctx.fillStyle = colorGray;
  ctx.font = "500 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("Scan to verify authenticity", centerX, qrBoxY + qrBoxSize + 85);
  ctx.fillText("and view on blockchain", centerX, qrBoxY + qrBoxSize + 110);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeStr = header.match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mimeStr });
}
