import { useState, useRef, useEffect, useCallback } from "react";

const FILTERS = [
  { name: "Original", value: "none" },
  { name: "B&W", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(90%)" },
  { name: "Vivid", value: "saturate(200%) contrast(115%)" },
  { name: "Cool", value: "hue-rotate(190deg) saturate(130%)" },
  { name: "Warm", value: "sepia(40%) saturate(160%) brightness(105%)" },
  { name: "Drama", value: "contrast(150%) brightness(85%) saturate(120%)" },
];

const STICKERS = [
  { label: "None", value: null },
  { label: "✨", value: "✨" },
  { label: "❤️", value: "❤️" },
  { label: "😎", value: "😎" },
  { label: "🌟", value: "🌟" },
  { label: "🎀", value: "🎀" },
  { label: "🔥", value: "🔥" },
  { label: "🦋", value: "🦋" },
];

// ✅ Fix: draw image with cover-crop so photos are never stretched
function drawCovered(ctx, img, dx, dy, dw, dh) {
  const srcAspect = img.width / img.height;
  const dstAspect = dw / dh;
  let sx, sy, sw, sh;
  if (srcAspect > dstAspect) {
    sh = img.height;
    sw = img.height * dstAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / dstAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lato:wght@300;400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pb-root {
    min-height: 100vh;
    background: #ffe4e1;
    background-image:
      radial-gradient(ellipse at 15% 10%, rgba(255,182,193,0.55) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 85%, rgba(255,160,170,0.35) 0%, transparent 55%),
      radial-gradient(ellipse at 50% 50%, rgba(255,230,230,0.2) 0%, transparent 70%);
    color: #5a2535;
    font-family: 'Lato', sans-serif;
    padding: 28px 20px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pb-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .pb-title {
    font-family: 'Great Vibes', cursive;
    font-size: clamp(52px, 11vw, 96px);
    color: #c0576e;
    text-shadow: 2px 3px 0 rgba(192,87,110,0.18), 0 0 40px rgba(255,140,155,0.25);
    line-height: 1.1;
  }

  .pb-subtitle {
    font-size: 11px;
    letter-spacing: 0.35em;
    color: #d4899a;
    text-transform: uppercase;
    margin-top: 2px;
    font-weight: 300;
  }

  .pb-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
    margin: 12px 0 0;
    color: #e8b4be;
    font-size: 18px;
    letter-spacing: 6px;
  }

  .pb-main {
    display: flex;
    gap: 28px;
    align-items: flex-start;
    width: 100%;
    max-width: 1020px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .pb-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 300px;
    max-width: 580px;
  }

  .pb-camera-frame {
    position: relative;
    width: 100%;
    border-radius: 16px;
    background: #fff0f2;
    overflow: hidden;
    box-shadow:
      0 0 0 3px #f4c0ca,
      0 0 0 6px #ffe4e1,
      0 12px 40px rgba(192,87,110,0.18);
  }

  .pb-camera-inner {
    position: relative;
    aspect-ratio: 4/3;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9e0e4;
    border-radius: 13px;
  }

  .pb-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    display: block;
    border-radius: 13px;
    transition: filter 0.3s ease;
  }

  .pb-start-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255,228,225,0.88);
    cursor: pointer;
    border-radius: 13px;
    gap: 14px;
    transition: background 0.2s;
  }

  .pb-start-overlay:hover { background: rgba(255,228,225,0.7); }

  .pb-camera-icon {
    font-size: 60px;
    animation: pulse 2.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .pb-start-text {
    font-family: 'Great Vibes', cursive;
    font-size: 28px;
    color: #c0576e;
  }

  .pb-flash {
    position: absolute;
    inset: 0;
    background: white;
    z-index: 20;
    pointer-events: none;
    border-radius: 13px;
    animation: flashAnim 0.35s ease-out forwards;
  }

  @keyframes flashAnim {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  .pb-countdown {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 15;
    pointer-events: none;
  }

  .pb-countdown-num {
    font-family: 'Great Vibes', cursive;
    font-size: 150px;
    color: white;
    text-shadow:
      0 0 30px rgba(192,87,110,0.7),
      0 0 70px rgba(255,140,155,0.4),
      3px 4px 0 rgba(150,50,70,0.3);
    animation: countPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    line-height: 1;
  }

  @keyframes countPop {
    0% { transform: scale(0.3); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .pb-shot-label {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(192,87,110,0.88);
    color: white;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 20px;
    z-index: 10;
    white-space: nowrap;
  }

  .pb-controls {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .pb-section-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    color: #d4899a;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-weight: 700;
  }

  .pb-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .pb-filter-btn {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid #f4c0ca;
    color: #a0566a;
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 13px;
    cursor: pointer;
    border-radius: 20px;
    transition: all 0.15s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .pb-filter-btn:hover { border-color: #c0576e; color: #c0576e; background: rgba(255,255,255,0.85); }
  .pb-filter-btn.active { background: #c0576e; border-color: #c0576e; color: white; }

  .pb-stickers {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .pb-sticker-btn {
    width: 42px;
    height: 42px;
    background: rgba(255,255,255,0.6);
    border: 1.5px solid #f4c0ca;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0576e;
    font-family: 'Lato', sans-serif;
    font-size: 12px;
    font-weight: 700;
  }

  .pb-sticker-btn.emoji { font-size: 20px; }
  .pb-sticker-btn:hover { border-color: #c0576e; transform: scale(1.12); background: white; }
  .pb-sticker-btn.active { background: #fff0f3; border-color: #c0576e; box-shadow: 0 0 0 3px rgba(192,87,110,0.15); }

  .pb-capture-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #e8758a, #c0576e);
    border: none;
    border-radius: 50px;
    color: white;
    font-family: 'Great Vibes', cursive;
    font-size: 26px;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(192,87,110,0.35);
    position: relative;
    overflow: hidden;
  }

  .pb-capture-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    transition: left 0.5s;
  }

  .pb-capture-btn:hover::before { left: 150%; }
  .pb-capture-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(192,87,110,0.45); }
  .pb-capture-btn:disabled { background: #f4c0ca; color: #e8a0ae; cursor: not-allowed; box-shadow: none; }

  .pb-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    min-width: 210px;
  }

  .pb-strip-frame {
    background: rgba(255,255,255,0.65);
    border: 2px solid #f4c0ca;
    border-radius: 16px;
    padding: 18px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 24px rgba(192,87,110,0.1);
    min-width: 200px;
  }

  .pb-strip-title {
    font-family: 'Great Vibes', cursive;
    font-size: 22px;
    color: #c0576e;
    text-align: center;
  }

  .pb-thumb-slot {
    width: 172px;
    height: 129px;
    background: #fde8ec;
    border: 1.5px solid #f4c0ca;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pb-thumb-slot img { width: 100%; height: 100%; object-fit: cover; }

  .pb-thumb-num {
    position: absolute;
    top: 5px;
    left: 5px;
    background: rgba(192,87,110,0.85);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 10px;
  }

  .pb-thumb-empty {
    width: 36px;
    height: 36px;
    border: 2px dashed #f4c0ca;
    border-radius: 50%;
    opacity: 0.6;
  }

  .pb-download-btn {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,0.7);
    border: 1.5px solid #c0576e;
    color: #c0576e;
    font-family: 'Great Vibes', cursive;
    font-size: 22px;
    cursor: pointer;
    border-radius: 50px;
    transition: all 0.2s;
  }

  .pb-download-btn:hover { background: #c0576e; color: white; box-shadow: 0 4px 20px rgba(192,87,110,0.3); }
  .pb-download-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .pb-strip-preview {
    width: 172px;
    border-radius: 8px;
    border: 1.5px solid #f4c0ca;
    display: block;
    margin-top: 2px;
  }

  .pb-retake-btn {
    background: transparent;
    border: 1.5px solid #f4c0ca;
    color: #d4899a;
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 8px 18px;
    cursor: pointer;
    border-radius: 20px;
    transition: all 0.15s;
  }

  .pb-retake-btn:hover { border-color: #c0576e; color: #c0576e; }

  .pb-progress {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  .pb-progress-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #f4c0ca;
    transition: all 0.3s;
  }

  .pb-progress-dot.done { background: #c0576e; box-shadow: 0 0 8px rgba(192,87,110,0.5); }
  .pb-progress-dot.active { background: #e8758a; box-shadow: 0 0 12px rgba(232,117,138,0.7); transform: scale(1.4); }

  .pb-footer {
    margin-top: 36px;
    text-align: center;
    font-size: 10px;
    letter-spacing: 0.25em;
    color: #e8b4be;
    text-transform: uppercase;
  }

  canvas { display: none; }
`;

export default function PhotoBooth() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [flash, setFlash] = useState(false);
  const [stripDataUrl, setStripDataUrl] = useState(null);
  const [activeShot, setActiveShot] = useState(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.filter = filter.value;
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    ctx.filter = "none";
    if (sticker.value) {
      const stickerSize = Math.floor(h * 0.16);
      ctx.font = `${stickerSize}px serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(sticker.value, w - 16, h - 16);
    }
    return canvas.toDataURL("image/png");
  }, [filter, sticker]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const startCapture = useCallback(async () => {
    if (isCapturing || !cameraOn) return;
    setIsCapturing(true);
    setPhotos([]);
    setStripDataUrl(null);
    const captured = [];

    for (let shot = 0; shot < 4; shot++) {
      setActiveShot(shot);
      for (let c = 3; c >= 1; c--) {
        setCountdown(c);
        await sleep(1000);
      }
      setCountdown("📸");
      setFlash(true);
      setTimeout(() => setFlash(false), 350);
      await sleep(100);
      const photo = captureFrame();
      if (photo) {
        captured.push(photo);
        setPhotos((prev) => [...prev, photo]);
      }
      await sleep(800);
      setCountdown(null);
      if (shot < 3) await sleep(600);
    }

    setActiveShot(null);
    setIsCapturing(false);
    buildStrip(captured);
  }, [isCapturing, cameraOn, captureFrame]);

  const buildStrip = (photoList) => {
    const PHOTO_W = 500;
    const PHOTO_H = 375; // 4:3 ratio
    const PAD = 22;
    const SIDE = 28;

    const totalW = SIDE + PAD + PHOTO_W + PAD + SIDE;
    const totalH = PAD + photoList.length * (PHOTO_H + PAD) + 54;

    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffe4e1";
    ctx.fillRect(0, 0, totalW, totalH);

    // White photo column
    ctx.fillStyle = "#fff8f9";
    ctx.fillRect(SIDE, 0, PAD + PHOTO_W + PAD, totalH);

    // Decorative side holes
    for (let y = 18; y < totalH; y += 32) {
      for (const x of [8, totalW - SIDE + 8]) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.roundRect(x, y, 12, 18, 3);
        ctx.fill();
      }
    }

    Promise.all(
      photoList.map(
        (url) =>
          new Promise((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = url;
          })
      )
    ).then((images) => {
      images.forEach((img, i) => {
        const x = SIDE + PAD;
        const y = PAD + i * (PHOTO_H + PAD);

        // Clip to rounded rect
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, PHOTO_W, PHOTO_H, 8);
        ctx.clip();

        // ✅ Cover crop — no stretching!
        drawCovered(ctx, img, x, y, PHOTO_W, PHOTO_H);

        ctx.restore();

        // Border
        ctx.strokeStyle = "#f4c0ca";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, PHOTO_W, PHOTO_H, 8);
        ctx.stroke();

        // Shot badge
        ctx.fillStyle = "rgba(192,87,110,0.85)";
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, 32, 20, 10);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 13px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`#${i + 1}`, x + 24, y + 18);
      });

      // Footer
      ctx.fillStyle = "#c0576e";
      ctx.font = "italic bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Jenny's Photobooth  🎀", totalW / 2, totalH - 27);

      setStripDataUrl(canvas.toDataURL("image/png"));
    });
  };

  const downloadStrip = () => {
    if (!stripDataUrl) return;
    const a = document.createElement("a");
    a.href = stripDataUrl;
    a.download = `jennys-photobooth-${Date.now()}.png`;
    a.click();
  };

  const retake = () => {
    setPhotos([]);
    setStripDataUrl(null);
    setCountdown(null);
  };

  return (
    <div className="pb-root">
      <canvas ref={canvasRef} />

      <div className="pb-header">
        <div className="pb-title">Jenny's Photobooth</div>
        <div className="pb-subtitle">your personal photo strip studio</div>
        <div className="pb-divider">· · · ♡ · · ·</div>
      </div>

      <div className="pb-main">
        <div className="pb-left">
          <div className="pb-camera-frame">
            <div className="pb-camera-inner">
              <video
                ref={videoRef}
                className="pb-video"
                autoPlay
                playsInline
                muted
                style={{ filter: filter.value }}
              />
              {!cameraOn && (
                <div className="pb-start-overlay" onClick={startCamera}>
                  <div className="pb-camera-icon">🎀</div>
                  <div className="pb-start-text">Click to start camera</div>
                </div>
              )}
              {flash && <div className="pb-flash" />}
              {countdown !== null && (
                <div className="pb-countdown">
                  <div className="pb-countdown-num">{countdown}</div>
                </div>
              )}
              {isCapturing && activeShot !== null && countdown === null && (
                <div className="pb-shot-label">Get ready — Shot {activeShot + 1} of 4</div>
              )}
            </div>
          </div>

          <div className="pb-progress">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`pb-progress-dot ${photos[i] ? "done" : ""} ${isCapturing && activeShot === i ? "active" : ""}`}
              />
            ))}
          </div>

          <div className="pb-controls">
            <div>
              <div className="pb-section-label">Filter</div>
              <div className="pb-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    className={`pb-filter-btn ${filter.name === f.name ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                    disabled={isCapturing}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="pb-section-label">Sticker</div>
              <div className="pb-stickers">
                {STICKERS.map((s) => (
                  <button
                    key={s.label}
                    className={`pb-sticker-btn ${s.value ? "emoji" : ""} ${sticker.label === s.label ? "active" : ""}`}
                    onClick={() => setSticker(s)}
                    disabled={isCapturing}
                    title={s.label}
                  >
                    {s.value || "—"}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="pb-capture-btn"
              onClick={startCapture}
              disabled={isCapturing || !cameraOn}
            >
              {isCapturing ? "Shooting... 📸" : "Start Strip  ·  4 Shots"}
            </button>
          </div>
        </div>

        <div className="pb-right">
          <div className="pb-strip-frame">
            <div className="pb-strip-title">Your Strip 🎞</div>

            {[0, 1, 2, 3].map((i) => (
              <div className="pb-thumb-slot" key={i}>
                {photos[i] ? (
                  <>
                    <img src={photos[i]} alt={`Shot ${i + 1}`} />
                    <div className="pb-thumb-num">#{i + 1}</div>
                  </>
                ) : (
                  <div className="pb-thumb-empty" />
                )}
              </div>
            ))}

            {stripDataUrl && (
              <>
                <div className="pb-section-label" style={{ marginTop: 6 }}>Preview</div>
                <img className="pb-strip-preview" src={stripDataUrl} alt="Strip Preview" />
              </>
            )}

            <button className="pb-download-btn" onClick={downloadStrip} disabled={!stripDataUrl}>
              ⬇ Download Strip
            </button>

            {photos.length > 0 && !isCapturing && (
              <button className="pb-retake-btn" onClick={retake}>↺ Retake</button>
            )}
          </div>
        </div>
      </div>

      <div className="pb-footer">Jenny's Photobooth — Built with React & WebRTC</div>
    </div>
  );
}