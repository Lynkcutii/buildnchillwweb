import { useEffect } from 'react';

const SnowEffect = () => {
  useEffect(() => {
    // Tạo canvas cho hiệu ứng tuyết
    const canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Mảng lưu các bông tuyết
    const snowflakes = [];
    const maxFlakes = 100;

    class Snowflake {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.wind = Math.random() * 0.5 - 0.25;
      }

      update() {
        this.y += this.speed;
        this.x += this.wind + Math.sin(this.y * 0.01) * 0.5;

        // Reset khi rơi ra ngoài màn hình
        if (this.y > canvas.height) {
          this.y = -10;
          this.x = Math.random() * canvas.width;
        }
        if (this.x > canvas.width) {
          this.x = 0;
        }
        if (this.x < 0) {
          this.x = canvas.width;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();

        // Vẽ hình sao cho bông tuyết
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.y * 0.01) % (Math.PI * 2));
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.8})`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.size * 2, 0);
          ctx.stroke();
          ctx.rotate(Math.PI / 3);
        }
        ctx.restore();
      }
    }

    // Tạo các bông tuyết
    for (let i = 0; i < maxFlakes; i++) {
      snowflakes.push(new Snowflake());
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach(flake => {
        flake.update();
        flake.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    // Xử lý resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      const snowCanvas = document.getElementById('snow-canvas');
      if (snowCanvas) {
        snowCanvas.remove();
      }
    };
  }, []);

  return null;
};

export default SnowEffect;

