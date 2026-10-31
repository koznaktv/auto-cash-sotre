'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

interface CyberHero3DProps {
  onExploreClick?: () => void;
  onOpenDeposit?: () => void;
  balance?: number;
}

export default function CyberHero3D({ onExploreClick, onOpenDeposit, balance = 0 }: CyberHero3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only run on browser when THREE is available
    if (typeof window === 'undefined') return;
    const THREE = (window as any).THREE;
    if (!THREE) return;

    let animId: number;

    // ========================================================
    // 0. كارتىچكا ۋە تەڭگە تېكىستۇرىسىنى ھاسىل قىلىش (Dynamic Texture Generator)
    // ========================================================
    const createCardFrontTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 1. ئاساسىي قاراڭغۇ كائىنات گرادىيېنتى
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
      bgGrad.addColorStop(0, '#040714');
      bgGrad.addColorStop(0.4, '#09122a');
      bgGrad.addColorStop(0.8, '#060a1c');
      bgGrad.addColorStop(1, '#020409');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 640);

      // 2. سۈنئىي ئەقىل تور لىنىيەلىرى (Cyber Grid)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 40; x < 1024; x += 55) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 640);
        ctx.stroke();
      }
      for (let y = 40; y < 640; y += 55) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // 3. يۇقىرى تېخنىكىلىق چىراغ نۇرى (Cyber Circuit Traces)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(40, 240);
      ctx.lineTo(160, 240);
      ctx.lineTo(230, 310);
      ctx.lineTo(460, 310);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(460, 310, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00f2fe';
      ctx.fill();

      // سۆسۈن پىلاستىنكا سىزىقى
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.35)';
      ctx.beginPath();
      ctx.moveTo(980, 420);
      ctx.lineTo(820, 420);
      ctx.lineTo(750, 350);
      ctx.lineTo(580, 350);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(580, 350, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#9d4edd';
      ctx.fill();

      // 4. كارتىچكا گىرۋەك سىزىقى (Double Cyber Border)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 984, 600);

      ctx.strokeStyle = 'rgba(255, 183, 3, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(28, 28, 968, 584);

      // 5. نۇر چۈشۈش ئەكىس ئېففېكتى (Diagonal Glass Sheen)
      const sheen = ctx.createLinearGradient(0, 0, 1024, 640);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
      sheen.addColorStop(0.35, 'rgba(0, 242, 254, 0.12)');
      sheen.addColorStop(0.55, 'rgba(255, 183, 3, 0.08)');
      sheen.addColorStop(0.75, 'rgba(157, 78, 221, 0.1)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, 1024, 640);

      // 6. مەركىزىي لوگو بەلگىسى (AutoCash Circular Medallion Emblem)
      const emblemX = 120;
      const emblemY = 115;
      const emblemR = 48;

      // سىيان نۇرلۇق ھالقا
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(emblemX, emblemY, emblemR, 0, Math.PI * 2);
      ctx.stroke();

      // ئالتۇن ئىچكى ھالقا
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(emblemX, emblemY, emblemR - 7, 0, Math.PI * 2);
      ctx.stroke();

      // ئىچكى قارا يۇمىلاق
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#060b1e';
      ctx.beginPath();
      ctx.arc(emblemX, emblemY, emblemR - 9, 0, Math.PI * 2);
      ctx.fill();

      // چاقماق بەلگىسى (Lightning Bolt Vector)
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(emblemX + 6, emblemY - 28);
      ctx.lineTo(emblemX - 18, emblemY + 4);
      ctx.lineTo(emblemX - 2, emblemY + 4);
      ctx.lineTo(emblemX - 8, emblemY + 28);
      ctx.lineTo(emblemX + 18, emblemY - 4);
      ctx.lineTo(emblemX + 2, emblemY - 4);
      ctx.closePath();
      ctx.fill();

      // 7. ماركا نامى: AUTO CASH
      ctx.shadowColor = 'rgba(255, 183, 3, 0.7)';
      ctx.shadowBlur = 22;
      ctx.font = '900 52px Orbitron, sans-serif, system-ui';
      const logoGrad = ctx.createLinearGradient(190, 80, 560, 125);
      logoGrad.addColorStop(0, '#ffffff');
      logoGrad.addColorStop(0.35, '#fff1a8');
      logoGrad.addColorStop(1, '#ffb703');
      ctx.fillStyle = logoGrad;
      ctx.fillText('AUTO CASH', 190, 120);

      // يان تېكىست
      ctx.shadowBlur = 0;
      ctx.font = '700 16px Orbitron, monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText('DIGITAL PAY & TOP-UP PLATFORM', 194, 152);

      // 8. ئالاقىسىز پۇل تۆلەش سىگنالى 📶 (Contactless Payment Wave)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(380, 270, 16, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(380, 270, 28, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(380, 270, 40, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // 9. ئوڭ ئۈستى تەرەپ: VIP 2026 Hologram
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(157, 78, 221, 0.2)';
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(820, 65, 140, 58, 14);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.font = '900 20px Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('VIP 2026', 842, 102);

      // 10. كارتىچكا نومۇرى (Embossed Digits)
      ctx.shadowColor = 'rgba(0, 242, 254, 0.45)';
      ctx.shadowBlur = 10;
      ctx.font = '800 38px Orbitron, monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('8848   3920   1024   2026', 100, 440);

      // 11. ھېسابات ئىگىسى ۋە مۇددەت
      ctx.shadowBlur = 0;
      ctx.font = '600 14px Orbitron, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CARDHOLDER', 100, 515);
      ctx.fillText('VALIDITY', 640, 515);

      ctx.font = '800 22px Orbitron, sans-serif';
      ctx.fillStyle = '#ffe169';
      ctx.fillText('AUTOCASH VIP MEMBER', 100, 555);

      ctx.font = '800 22px Orbitron, monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText('24/7 INSTANT', 640, 555);

      // 12. ئوڭ ئاستىدىكى ھولوگرامما قوش ھالقا (Dual Hologram Stamp)
      ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
      ctx.beginPath();
      ctx.arc(870, 535, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'rgba(255, 183, 3, 0.8)';
      ctx.fillStyle = 'rgba(255, 183, 3, 0.45)';
      ctx.beginPath();
      ctx.arc(920, 535, 36, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // رەسمىي brand_logo.png بار بولسا ئۇنىمۇ بەلگە ئىچىگە چىرايلىق سىزىش
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/brand_logo.png';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(emblemX, emblemY, emblemR - 10, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, emblemX - (emblemR - 10), emblemY - (emblemR - 10), (emblemR - 10) * 2, (emblemR - 10) * 2);
        ctx.restore();
        texture.needsUpdate = true;
      };

      return texture;
    };

    // ئالتۇن مېدال / تەڭگە تېكىستۇرىسى (رەسمىي AUTO CASH لوگوسى بىلەن)
    const createCoinTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const cx = 256;
      const cy = 256;

      // ئالتۇن مەركىزىي گرادىيېنت تەگلىك
      const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 250);
      grad.addColorStop(0, '#fff6bd');
      grad.addColorStop(0.35, '#ffcc00');
      grad.addColorStop(0.7, '#d48800');
      grad.addColorStop(1, '#8f5500');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 250, 0, Math.PI * 2);
      ctx.fill();

      // يۇمىلاق گىرۋەك سىزىقلىرى
      ctx.strokeStyle = '#ffe875';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 244, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#7c4a00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 232, 0, Math.PI * 2);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // رەسمىي ئاۋتۇكاش لوگوسىنى تەڭگە يۈزىگە تولۇق ۋە سۈزۈك قىستۇرۇش
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/brand_logo.png';
      img.onload = () => {
        ctx.clearRect(0, 0, 512, 512);

        // چەمبەر بويىچە كېسىش
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 250, 0, Math.PI * 2);
        ctx.clip();

        // لوگو رەسىمىنى مەركەزگە سىزىش
        ctx.drawImage(img, 0, 0, 512, 512);
        ctx.restore();

        // گىرۋىكىگە نۇرلۇق 3D ئالتۇن ھالقا ئورنىتىش
        ctx.strokeStyle = '#ffe875';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, 246, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 183, 3, 0.7)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 236, 0, Math.PI * 2);
        ctx.stroke();

        texture.needsUpdate = true;
      };

      return texture;
    };

    // ========================================================
    // 1. ئارقا تەگلىك: 3D زەررىچىلەر كائىناتى (Background Particle Nebula)
    // ========================================================
    const bgCanvas = bgCanvasRef.current;
    let bgRenderer: any = null;
    let bgScene: any = null;
    let bgCamera: any = null;
    let particleMesh: any = null;

    if (bgCanvas) {
      bgScene = new THREE.Scene();
      bgScene.fog = new THREE.FogExp2(0x040711, 0.002);

      const width = bgCanvas.parentElement?.clientWidth || window.innerWidth;
      const height = bgCanvas.parentElement?.clientHeight || 650;

      bgCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      bgCamera.position.z = 110;

      bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
      bgRenderer.setSize(width, height);
      bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const particleCount = window.innerWidth < 768 ? 600 : 1200;
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);

      const colorCyan = new THREE.Color(0x00f2fe);
      const colorPurple = new THREE.Color(0x9d4edd);
      const colorGold = new THREE.Color(0xffb703);

      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 320;
        posArray[i + 1] = (Math.random() - 0.5) * 320;
        posArray[i + 2] = (Math.random() - 0.5) * 320;

        const randColor = Math.random();
        let c = colorCyan;
        if (randColor > 0.65) c = colorGold;
        else if (randColor > 0.35) c = colorPurple;

        colorArray[i] = c.r;
        colorArray[i + 1] = c.g;
        colorArray[i + 2] = c.b;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: window.innerWidth < 768 ? 2.5 : 2.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      particleMesh = new THREE.Points(particleGeometry, particleMaterial);
      bgScene.add(particleMesh);
    }

    // ========================================================
    // 2. مەركىزىي 3D پۇل تۆلەش كارتىسى ۋە ئالتۇن مېدال (Floating 3D Card)
    // ========================================================
    const mount = mountRef.current;
    if (!mount) return;

    const heroScene = new THREE.Scene();
    const heroCamera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    heroCamera.position.set(0, 0, 7.2);

    const heroRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    heroRenderer.setSize(mount.clientWidth, mount.clientHeight);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(heroRenderer.domElement);

    // چىراغلار
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    heroScene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x00f2fe, 3.5, 20);
    cyanPointLight.position.set(-5, 4, 4);
    heroScene.add(cyanPointLight);

    const goldPointLight = new THREE.PointLight(0xffb703, 4.5, 25);
    goldPointLight.position.set(5, -3, 5);
    heroScene.add(goldPointLight);

    const purplePointLight = new THREE.PointLight(0x9d4edd, 3, 20);
    purplePointLight.position.set(0, 5, -4);
    heroScene.add(purplePointLight);

    // 3D پۇل تۆلەش كارتىسى گۇرۇپپىسى
    const cardGroup = new THREE.Group();
    heroScene.add(cardGroup);

    // كارتىچكا بەدىنى ۋە ماتېرىياللىرى (6 يۈزلۈك ماتېرىيال)
    const cardGeo = new THREE.BoxGeometry(4.2, 2.55, 0.08);

    const cardFrontTex = createCardFrontTexture();
    const sideMat = new THREE.MeshPhysicalMaterial({
      color: 0x050a1c,
      metalness: 0.9,
      roughness: 0.2,
    });

    const frontMat = new THREE.MeshPhysicalMaterial({
      map: cardFrontTex,
      metalness: 0.8,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
    });

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x070c20,
      metalness: 0.85,
      roughness: 0.2,
    });

    // Three.js Box Materials: [right, left, top, bottom, front, back]
    const cardMaterials = [sideMat, sideMat, sideMat, sideMat, frontMat, backMat];
    const mainCard = new THREE.Mesh(cardGeo, cardMaterials);
    cardGroup.add(mainCard);

    // گىرۋەك نېئون نۇرى
    const cardEdgesGeo = new THREE.EdgesGeometry(cardGeo);
    const cardEdgesMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    const cardEdges = new THREE.LineSegments(cardEdgesGeo, cardEdgesMat);
    cardGroup.add(cardEdges);

    // ئالتۇن چىپ (Gold Chip)
    const chipGeo = new THREE.BoxGeometry(0.7, 0.55, 0.11);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x553800,
    });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(1.2, 0.4, 0.04);
    cardGroup.add(chip);

    // ئالتۇن تەڭگە / مېدال (Gold Medallion)
    const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32);
    const coinFrontTex = createCoinTexture();

    const coinEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xffc72c,
      metalness: 0.92,
      roughness: 0.2,
      emissive: 0x442e00,
    });

    const coinFaceMat = new THREE.MeshStandardMaterial({
      map: coinFrontTex,
      metalness: 0.88,
      roughness: 0.18,
    });

    // Cylinder materials: [side, top, bottom]
    const coinMaterials = [coinEdgeMat, coinFaceMat, coinFaceMat];
    const goldCoin = new THREE.Mesh(coinGeo, coinMaterials);
    goldCoin.rotation.x = Math.PI / 2;
    goldCoin.position.set(-1.1, -0.4, 0.25);
    cardGroup.add(goldCoin);

    // تەڭگە گىرۋىكى نۇرى
    const coinRingGeo = new THREE.TorusGeometry(0.78, 0.03, 16, 64);
    const coinRingMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const coinRing = new THREE.Mesh(coinRingGeo, coinRingMat);
    coinRing.position.set(-1.1, -0.4, 0.25);
    cardGroup.add(coinRing);

    // ئايلانما نېئون ھالقا (Orbital Ring)
    const orbitRingGeo = new THREE.TorusGeometry(2.9, 0.015, 16, 100);
    const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.5 });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 3;
    cardGroup.add(orbitRing);

    // ========================================================
    // 3. چاشقىنەك ۋە تېلېفون بارماق ھەرىكىتى (Parallax)
    // ========================================================
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - windowHalfX) * 0.001;
      mouseY = (e.clientY - windowHalfY) * 0.001;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = (e.touches[0].clientX - windowHalfX) * 0.0012;
        mouseY = (e.touches[0].clientY - windowHalfY) * 0.0012;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // ========================================================
    // 4. ئەنىماتسىيە قايتىلىنىش ھالقىسى (Animation Loop)
    // ========================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // تەگلىك زەررىچىلىرى
      if (particleMesh && bgRenderer && bgScene && bgCamera) {
        particleMesh.rotation.y = elapsedTime * 0.02 + mouseX * 0.5;
        particleMesh.rotation.x = elapsedTime * 0.01 + mouseY * 0.5;
        bgRenderer.render(bgScene, bgCamera);
      }

      // مەركىزىي 3D كارتىچكا
      cardGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.18;
      cardGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.35 + mouseX * 2.2;
      cardGroup.rotation.x = Math.cos(elapsedTime * 0.6) * 0.15 + -mouseY * 1.8;

      goldCoin.rotation.y = elapsedTime * 0.6;
      goldCoin.rotation.z = Math.sin(elapsedTime * 0.8) * 0.12;
      orbitRing.rotation.z = -elapsedTime * 0.6;

      heroRenderer.render(heroScene, heroCamera);
    };

    animate();

    // ========================================================
    // 5. ئېكران ئۆزگەرگەندە ماسلىشىش (Resize)
    // ========================================================
    const handleResize = () => {
      if (!mount) return;

      heroCamera.aspect = mount.clientWidth / mount.clientHeight;
      heroCamera.updateProjectionMatrix();
      heroRenderer.setSize(mount.clientWidth, mount.clientHeight);

      if (bgCanvas && bgRenderer && bgCamera) {
        const width = bgCanvas.parentElement?.clientWidth || window.innerWidth;
        const height = bgCanvas.parentElement?.clientHeight || 650;
        bgCamera.aspect = width / height;
        bgCamera.updateProjectionMatrix();
        bgRenderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);

      if (mount && heroRenderer.domElement && mount.contains(heroRenderer.domElement)) {
        mount.removeChild(heroRenderer.domElement);
      }
      heroRenderer.dispose();
      if (bgRenderer) bgRenderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#060c1d] via-[#091127] to-[#040816] border border-cyan-500/25 shadow-[0_20px_50px_rgba(0,242,254,0.15)] my-4">
      {/* Three.js Background Particle Canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70" />

      {/* Cyber Grid & Radial Glow Light */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_30%,_rgba(0,242,254,0.16)_0%,_transparent_60%),radial-gradient(circle_at_20%_80%,_rgba(157,78,221,0.18)_0%,_transparent_50%)] z-1" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 md:p-8 lg:p-10">
        {/* Right side: Uyghur Sci-Fi Text & CTAs */}
        <div className="lg:col-span-7 space-y-4 text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.25)] text-cyan-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>24/7 ئاپتوماتىك سىستېما • ھازىر ئوچۇق</span>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight font-alkatip">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_25px_rgba(255,183,3,0.4)]">
              تېز، بىخەتەر
            </span>{' '}
            ۋە<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400">
              ئاپتوماتىك پۇل قاچىلاش
            </span>{' '}
            مەركىزى
          </h1>

          <p className="text-slate-300/90 text-sm md:text-base leading-relaxed max-w-xl">
            تور ئويۇنلىرى، خەلقئارالىق ئەپلەر ۋە مەۋھۇم سوۋغات كارتىلىرىغا 24 سائەت بىۋاسىتە ۋە دەرھال پۇل قاچىلاشنىڭ ئەڭ ئىشەنچلىك رەقەملىك سۇپىسى.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onExploreClick}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,242,254,0.45)] hover:shadow-[0_0_35px_rgba(0,242,254,0.7)] transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>دەرھال قاچىلاش</span>
              <i className="fas fa-bolt text-xs" />
            </button>

            {onOpenDeposit && (
              <button
                type="button"
                onClick={onOpenDeposit}
                className="px-5 py-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-400/40 text-purple-200 hover:text-white font-bold text-sm shadow-[0_0_20px_rgba(157,78,221,0.25)] transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <i className="fas fa-wallet text-amber-400 text-xs" />
                <span>ھېسابات قالدۇقى (${balance.toFixed(2)})</span>
              </button>
            )}

            <Link
              href="/orders"
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <i className="fas fa-receipt text-cyan-400" />
              <span>زاكاسلىرىم</span>
            </Link>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
            <div className="text-center md:text-right">
              <div className="text-lg md:text-xl font-black text-cyan-400 font-mono">99.9%</div>
              <div className="text-[11px] text-slate-400">ئاپتوماتىك كىرىش</div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-lg md:text-xl font-black text-amber-400 font-mono">&lt; 30s</div>
              <div className="text-[11px] text-slate-400">ئوتتۇرىچە يېتىش</div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-lg md:text-xl font-black text-purple-400 font-mono">50k+</div>
              <div className="text-[11px] text-slate-400">مۇۋەپپەقىيەتلىك زاكاز</div>
            </div>
          </div>
        </div>

        {/* Left side: Interactive 3D Holographic Card Viewport */}
        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[260px] md:min-h-[340px]">
          {/* Holographic Glowing Ring Background */}
          <div className="absolute w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full border border-dashed border-cyan-400/30 animate-[spin_24s_linear_infinite] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full border border-dotted border-purple-500/35 animate-[spin_18s_linear_infinite_reverse] pointer-events-none" />

          {/* Mount node for Three.js */}
          <div ref={mountRef} className="w-full h-[260px] md:h-[340px] relative z-10 flex items-center justify-center cursor-grab active:cursor-grabbing" />
        </div>
      </div>
    </div>
  );
}
