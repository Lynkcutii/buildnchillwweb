import { useEffect } from 'react';

const TetEffect = () => {
  useEffect(() => {
    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'tet-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '9999'
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const blossoms = [];
    const fireworks = [];

    // --- 2. CẤU HÌNH HÌNH DẠNG ---
    const SCALE_SIZE = 16;

    const shapes = {
      bnc: {
        scale: SCALE_SIZE,
        palette: { 'Y': '#FFD700', 'W': '#FFFACD' },
        map: [
          "YY00Y00Y00YYY0", "Y0Y0YY0Y0Y0000", "YY00Y0YY0Y0000", "Y0Y0Y00Y0Y0000", "YY00Y00Y00YYY0"
        ]
      },
      creeper: {
        scale: SCALE_SIZE,
        palette: { 'G': '#55FF55', 'D': '#00AA00', 'B': '#111111' },
        map: [
          "GGGGGGGG", "GGGGGGGG", "GGBBGBBG", "GGBBGBBG",
          "GGGBBGGG", "GGBBBBGG", "GGBBBBGG", "GGBGGBGG"
        ]
      },
      pig: {
        scale: SCALE_SIZE,
        palette: { 'P': '#F2A0A0', 'D': '#DB7D7D', 'W': '#FFFFFF', 'B': '#000000' },
        map: [
          "PPPPPPPP", "PPPPPPPP", "WBPPPPBW", "PPPPPPPP",
          "PPDDDDPP", "PPDDDDPP", "PPPPPPPP", "PPPPPPPP"
        ]
      },
      enderman: {
        scale: SCALE_SIZE,
        palette: { 'K': '#222222', 'P': '#CC00FA', 'L': '#FF55FF' },
        map: [
          "KKKKKKKK", "KKKKKKKK", "KKKKKKKK", "KPLLKLLP",
          "KKKKKKKK", "KKKKKKKK", "KKKKKKKK", "KKKKKKKK"
        ]
      }
    };

    const getParticlesFromMap = (shapeKey, centerX, centerY) => {
      const shape = shapes[shapeKey];
      const particles = [];
      const rows = shape.map.length;
      const cols = shape.map[0].length;
      const startX = centerX - (cols * shape.scale) / 2;
      const startY = centerY - (rows * shape.scale) / 2;

      shape.map.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const char = row[c];
          if (shape.palette[char]) {
            const color = shape.palette[char];
            const targetX = startX + c * shape.scale;
            const targetY = startY + r * shape.scale;
            for (let i = 0; i < 3; i++) particles.push(new FireworkParticle(centerX, centerY, color, targetX, targetY, true));
          }
        }
      });
      return particles;
    };

    // --- 3. HOA RƠI ---
    class Blossom {
      constructor() { this.reset(); this.y = Math.random() * canvas.height; }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 8 + 5;
        this.speed = Math.random() * 1 + 0.5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.flip = 0;
        this.flipSpeed = Math.random() * 0.03 + 0.01;
        this.sway = 0;
        const isApricot = Math.random() > 0.5;
        this.color = isApricot ? '#FFD700' : '#FFB7C5';
        this.centerColor = isApricot ? '#CC9900' : '#FF69B4';
      }
      update() {
        this.y += this.speed;
        this.x += Math.sin(this.sway) * 0.5;
        this.sway += 0.01;
        this.rotation += this.rotationSpeed;
        this.flip += this.flipSpeed;
        if (this.y > canvas.height + 20) this.reset();
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(1, Math.sin(this.flip));
        ctx.fillStyle = this.color;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -this.size / 2, this.size / 3, this.size / 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.rotate((Math.PI * 2) / 5);
        }
        ctx.fillStyle = this.centerColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // --- 4. HẠT PHÁO HOA ---
    class FireworkParticle {
      constructor(startX, startY, color, targetX, targetY, isShaped) {
        this.x = startX;
        this.y = startY;
        this.color = color;
        this.isShaped = isShaped;
        this.opacity = 1;
        this.life = 0;

        if (isShaped) {
          this.targetX = targetX;
          this.targetY = targetY;
          const dx = targetX - startX;
          const dy = targetY - startY;
          const slowFactor = 40;
          this.vx = dx / slowFactor;
          this.vy = dy / slowFactor;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 3;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
        }
      }

      update() {
        this.life++;
        if (this.isShaped) {
          if (this.life <= 40) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;
          } else if (this.life <= 250) {
            this.x += (Math.random() - 0.5) * 0.1;
            this.y += 0.02;
          } else {
            this.y += 0.5;
            this.opacity -= 0.005;
          }
        } else {
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.98;
          this.vy *= 0.98;
          this.vy += 0.04;
          this.opacity -= 0.008;
        }
      }

      draw() {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        if (this.isShaped) {
          ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // --- 5. QUẢ PHÁO ---
    class Firework {
      constructor() {
        const isLeft = Math.random() < 0.5;
        const safeMargin = 200;
        const zoneWidth = canvas.width * 0.1;

        if (isLeft) {
          this.x = safeMargin + Math.random() * zoneWidth;
        } else {
          this.x = canvas.width - safeMargin - Math.random() * zoneWidth;
        }

        this.y = canvas.height;
        this.targetY = canvas.height * 0.1 + Math.random() * (canvas.height * 0.15);
        this.speed = 15;

        this.particles = [];
        this.exploded = false;

        const keys = Object.keys(shapes);
        this.shapeType = Math.random() < 0.6 ? keys[Math.floor(Math.random() * keys.length)] : null;
      }

      update() {
        if (!this.exploded) {
          this.y -= this.speed;
          this.speed *= 0.97;
          if (this.y <= this.targetY || this.speed < 1) this.explode();
        } else {
          this.particles.forEach((p, i) => {
            p.update();
            if (p.opacity <= 0) this.particles.splice(i, 1);
          });
        }
      }

      explode() {
        this.exploded = true;
        if (this.shapeType) {
          this.particles = getParticlesFromMap(this.shapeType, this.x, this.y);
        } else {
          const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
          for (let i = 0; i < 150; i++) {
            this.particles.push(new FireworkParticle(this.x, this.y, color, 0, 0, false));
          }
        }
      }

      draw() {
        if (!this.exploded) {
          ctx.save();
          // Vẽ đầu đạn
          ctx.beginPath();
          ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#FFD700';
          ctx.fill();

          // Vẽ đuôi lửa
          const tailLength = 40;
          const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + tailLength);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x, this.y + tailLength);
          ctx.lineWidth = 3;
          ctx.strokeStyle = gradient;
          ctx.stroke();
          ctx.restore();
        } else {
          this.particles.forEach(p => p.draw());
        }
      }
    }

    // --- 6. LOOP ---
    for (let i = 0; i < 3; i++) blossoms.push(new Blossom());

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // [KEY] TẦN SUẤT BẮN VỪA PHẢI
      if (Math.random() < 0.0003) {
        fireworks.push(new Firework());
      }

      blossoms.forEach(b => { b.update(); b.draw(); });
      fireworks.forEach((fw, i) => {
        fw.update();
        fw.draw();
        if (fw.exploded && fw.particles.length === 0) fireworks.splice(i, 1);
      });

      requestAnimationFrame(loop);
    }
    loop();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); canvas.remove(); };
  }, []);

  return null;
};

export default TetEffect;