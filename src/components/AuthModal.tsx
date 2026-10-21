'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { X } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabaseBrowser';

export interface UserSessionData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  totalSpent?: number;
  vipTier?: string;
  role?: string;
  avatarUrl?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSessionData) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const { t, isRTL, lang } = useLanguage();

  // Mode: false = login (front), true = register (back)
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLampOn, setIsLampOn] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsLampOn(false);
      setIsFlipped(false);
      setErrorMsg('');

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Button states
  const [loginArrowFlying, setLoginArrowFlying] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupArrowFlying, setSignupArrowFlying] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Success modal overlay state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successSubtitle, setSuccessSubtitle] = useState('');

  // Physics refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cordHandleRef = useRef<HTMLDivElement | null>(null);
  const cordPathRef = useRef<SVGPathElement | null>(null);
  const cordKnobRef = useRef<SVGCircleElement | null>(null);
  const cordMidBeadRef = useRef<SVGCircleElement | null>(null);
  const cordKnobShineRef = useRef<SVGCircleElement | null>(null);
  const cordHitAreaRef = useRef<SVGCircleElement | null>(null);

  // Cord physics state
  const physicsState = useRef({
    REST_X: 50,
    REST_Y: 105,
    MAX_STRETCH_Y: 85,
    MAX_SWING_X: 35,
    TRIGGER_THRESHOLD_Y: 38,
    currentX: 50,
    currentY: 105,
    targetX: 50,
    targetY: 105,
    vx: 0,
    vy: 0,
    isDragging: false,
    startPointerX: 0,
    startPointerY: 0,
    startKnobX: 50,
    startKnobY: 105,
    animFrameId: null as number | null,
    hasTriggeredInCurrentPull: false,
    lastClientX: 0,
    lastClientY: 0,
    lastTime: 0,
    pointerVx: 0,
    pointerVy: 0,
  });

  // Sound synthesis helpers
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSwitchSound = (turningOn: boolean) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Ultra-lightweight instantaneous mechanical snap click (0.03s)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(turningOn ? 950 : 700, now);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
      snapGain.gain.setValueAtTime(0.25, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.035);
    } catch {}
  };

  const playCordTwangSound = (pitch = 440) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  };

  const playFlipSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
    } catch {}
  };

  const playArrowWhoosh = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  };

  const playSuccessChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.72);
      });
    } catch {}
  };

  // Lamp toggle handler
  const handleToggleLamp = () => {
    setIsLampOn(prev => {
      const next = !prev;
      playSwitchSound(next);
      return next;
    });
  };

  const switchTab = (toSignUp: boolean) => {
    playFlipSound();
    setIsFlipped(toSignUp);
    setErrorMsg('');
  };

  // Render SVG pull cord
  const renderCord = (x: number, y: number) => {
    const { REST_X } = physicsState.current;
    const ctrlX = REST_X + (x - REST_X) * 0.35;
    const ctrlY = y * 0.55 + 6;

    if (cordPathRef.current) {
      cordPathRef.current.setAttribute('d', `M ${REST_X} 0 Q ${ctrlX} ${ctrlY} ${x} ${y}`);
    }
    if (cordMidBeadRef.current) {
      cordMidBeadRef.current.setAttribute('cx', ctrlX.toString());
      cordMidBeadRef.current.setAttribute('cy', ctrlY.toString());
    }
    if (cordKnobRef.current) {
      cordKnobRef.current.setAttribute('cx', x.toString());
      cordKnobRef.current.setAttribute('cy', y.toString());
    }
    if (cordKnobShineRef.current) {
      cordKnobShineRef.current.setAttribute('cx', (x - 3.2).toString());
      cordKnobShineRef.current.setAttribute('cy', (y - 3.2).toString());
    }
    if (cordHitAreaRef.current) {
      cordHitAreaRef.current.setAttribute('cx', x.toString());
      cordHitAreaRef.current.setAttribute('cy', y.toString());
    }
  };

  const updateCordPhysics = () => {
    const s = physicsState.current;
    if (s.isDragging) {
      s.currentX += (s.targetX - s.currentX) * 0.45;
      s.currentY += (s.targetY - s.currentY) * 0.45;
      renderCord(s.currentX, s.currentY);
      s.animFrameId = requestAnimationFrame(updateCordPhysics);
      return;
    }

    // 1. Natural Pendulum Oscillation (X-axis)
    const stiffnessX = 0.052;
    const dampingX = 0.96;
    const forceX = -(s.currentX - s.REST_X) * stiffnessX;
    s.vx = (s.vx + forceX) * dampingX;
    s.currentX += s.vx;

    // 2. Elastic Spring + Geometric Pendulum Arc Lift (Y-axis)
    const stiffnessY = 0.16;
    const dampingY = 0.82;
    const arcLift = Math.pow((s.currentX - s.REST_X) / 38, 2) * 4.5;
    const naturalY = s.REST_Y - arcLift;
    const forceY = -(s.currentY - naturalY) * stiffnessY;
    s.vy = (s.vy + forceY) * dampingY;
    s.currentY += s.vy;

    renderCord(s.currentX, s.currentY);

    const isMoving =
      Math.abs(s.currentX - s.REST_X) > 0.15 ||
      Math.abs(s.vx) > 0.08 ||
      Math.abs(s.currentY - s.REST_Y) > 0.15 ||
      Math.abs(s.vy) > 0.08;

    if (isMoving) {
      s.animFrameId = requestAnimationFrame(updateCordPhysics);
    } else {
      s.currentX = s.REST_X;
      s.currentY = s.REST_Y;
      s.vx = 0;
      s.vy = 0;
      renderCord(s.REST_X, s.REST_Y);
      s.animFrameId = null;
    }
  };

  const ensurePhysicsRunning = () => {
    if (!physicsState.current.animFrameId) {
      physicsState.current.animFrameId = requestAnimationFrame(updateCordPhysics);
    }
  };

  // Wire pull cord pointer events
  useEffect(() => {
    if (!isOpen) return;

    const cordHandle = cordHandleRef.current;
    if (!cordHandle) return;

    const onPointerMove = (e: PointerEvent) => {
      const s = physicsState.current;
      if (!s.isDragging) return;

      const now = performance.now();
      const dt = Math.max(8, now - s.lastTime);
      const instVx = ((e.clientX - s.lastClientX) / dt) * 16;
      const instVy = ((e.clientY - s.lastClientY) / dt) * 16;
      s.pointerVx = s.pointerVx * 0.4 + instVx * 0.6;
      s.pointerVy = s.pointerVy * 0.4 + instVy * 0.6;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      s.lastTime = now;

      const deltaX = e.clientX - s.startPointerX;
      const deltaY = e.clientY - s.startPointerY;

      s.targetX = s.startKnobX + Math.max(-s.MAX_SWING_X, Math.min(s.MAX_SWING_X, deltaX * 0.9));

      if (deltaY > 0) {
        const stretch = Math.min(s.MAX_STRETCH_Y, deltaY * 0.78);
        s.targetY = s.REST_Y + stretch;

        if (stretch >= s.TRIGGER_THRESHOLD_Y && !s.hasTriggeredInCurrentPull) {
          s.hasTriggeredInCurrentPull = true;
          handleToggleLamp();
        }
      } else {
        s.targetY = s.REST_Y + Math.max(-20, deltaY * 0.35);
      }
    };

    const releaseCord = () => {
      const s = physicsState.current;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseCord);
      window.removeEventListener('pointercancel', releaseCord);

      if (!s.isDragging) return;
      s.isDragging = false;
      s.targetX = s.REST_X;
      s.targetY = s.REST_Y;

      s.vx = Math.max(-24, Math.min(24, s.pointerVx * 0.75)) + (s.currentX - s.REST_X) * -0.18;
      s.vy = Math.min(-12, s.pointerVy * 0.4 - 11);

      playCordTwangSound(480);
      ensurePhysicsRunning();
    };

    const onPointerDown = (e: PointerEvent) => {
      const s = physicsState.current;
      s.isDragging = true;
      s.hasTriggeredInCurrentPull = false;
      s.startPointerX = e.clientX;
      s.startPointerY = e.clientY;
      s.startKnobX = s.currentX;
      s.startKnobY = s.currentY;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      s.lastTime = performance.now();
      s.pointerVx = 0;
      s.pointerVy = 0;

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', releaseCord);
      window.addEventListener('pointercancel', releaseCord);

      if (e.target && (e.target as any).setPointerCapture) {
        try { (e.target as any).setPointerCapture(e.pointerId); } catch {}
      }
      ensurePhysicsRunning();
    };

    const onClick = () => {
      const s = physicsState.current;
      if (!s.hasTriggeredInCurrentPull) {
        handleToggleLamp();
        s.vy = 20;
        s.vx = (Math.random() - 0.5) * 12;
        playCordTwangSound(520);
        ensurePhysicsRunning();
      }
    };

    cordHandle.addEventListener('pointerdown', onPointerDown);
    cordHandle.addEventListener('click', onClick);

    return () => {
      cordHandle.removeEventListener('pointerdown', onPointerDown);
      cordHandle.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseCord);
      window.removeEventListener('pointercancel', releaseCord);
      if (physicsState.current.animFrameId) {
        cancelAnimationFrame(physicsState.current.animFrameId);
      }
    };
  }, [isOpen]);

  // High Performance Canvas Particles (only active on desktop when lamp is ON)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Do not run canvas particle loop on mobile screens or when lamp is off to prevent stutter
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile || !isLampOn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const glowSprite = document.createElement('canvas');
    glowSprite.width = 40;
    glowSprite.height = 40;
    const sCtx = glowSprite.getContext('2d');
    if (sCtx) {
      const sGrad = sCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
      sGrad.addColorStop(0, '#ffffff');
      sGrad.addColorStop(0.25, 'rgba(255, 240, 180, 0.9)');
      sGrad.addColorStop(0.55, 'rgba(255, 196, 77, 0.35)');
      sGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
      sCtx.fillStyle = sGrad;
      sCtx.beginPath();
      sCtx.arc(20, 20, 20, 0, Math.PI * 2);
      sCtx.fill();
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    class Firefly {
      x = 0;
      y = 0;
      radius = 0;
      baseAlpha = 0;
      alpha = 0;
      vx = 0;
      vy = 0;
      phase = 0;
      phaseSpeed = 0;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;
        this.radius = 1.2 + Math.random() * 2.0;
        this.baseAlpha = 0.2 + Math.random() * 0.6;
        this.alpha = this.baseAlpha;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -0.25 - Math.random() * 0.4;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.02 + Math.random() * 0.02;
      }

      update() {
        if (!canvas) return;
        this.phase += this.phaseSpeed;
        this.x += this.vx + Math.sin(this.phase) * 0.3;
        this.y += this.vy;
        const pulse = (Math.sin(this.phase) + 1) * 0.5;
        this.alpha = this.baseAlpha * pulse;

        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset(false);
        }
      }

      draw() {
        if (!canvas || !ctx) return;
        ctx.globalAlpha = Math.min(1, this.alpha);
        const drawRadius = this.radius * 3.5;
        ctx.drawImage(glowSprite, this.x - drawRadius, this.y - drawRadius, drawRadius * 2, drawRadius * 2);
      }
    }

    const particles: Firefly[] = [];
    const NUM_PARTICLES = 16;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(new Firefly());
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isOpen, isLampOn]);

  if (!isOpen) return null;

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setErrorMsg(t('loginFailed'));
        setGoogleLoading(false);
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMsg(err?.message || t('loginFailed'));
      setGoogleLoading(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg(t('fillAllFields'));
      return;
    }

    playArrowWhoosh();
    setLoginArrowFlying(true);

    setTimeout(() => {
      setLoginLoading(true);
    }, 350);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || t('loginFailed'));
      }

      setSuccessTitle(t('loginSuccessToast'));
      setSuccessSubtitle(`${t('welcomeUser')} ${data.user?.name || loginEmail}`);
      setShowSuccess(true);
      playSuccessChime();

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          router.replace('/');
        }
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err?.message || t('loginFailed'));
    } finally {
      setLoginArrowFlying(false);
      setLoginLoading(false);
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMsg(t('fillAllFields'));
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg(t('passwordsDoNotMatch'));
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg(t('passwordMinLength'));
      return;
    }

    playArrowWhoosh();
    setSignupArrowFlying(true);

    setTimeout(() => {
      setSignupLoading(true);
    }, 350);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          name: signupName.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || t('registerFailed'));
      }

      setSuccessTitle(t('registerSuccessToast'));
      setSuccessSubtitle(`${t('welcomeUser')} ${signupName}`);
      setShowSuccess(true);
      playSuccessChime();

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          router.replace('/');
        }
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err?.message || t('registerFailed'));
    } finally {
      setSignupArrowFlying(false);
      setSignupLoading(false);
    }
  };

  return (
    <div
      className={`nasrulla-modal-root ${isLampOn ? 'lamp-on' : ''} lang-${lang}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Scoped Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nasrulla-modal-root {
          --bg-dark: #07090e;
          --bg-darker: #040508;
          --lamp-gold: #ffc44d;
          --lamp-light-core: rgba(255, 236, 179, 0.95);
          --lamp-glow-outer: rgba(255, 183, 3, 0.25);
          --lamp-beam-start: rgba(255, 214, 102, 0.65);
          --lamp-beam-mid: rgba(255, 193, 7, 0.28);
          --lamp-beam-end: rgba(255, 179, 0, 0);
          --card-bg-off: rgba(18, 22, 34, 0.35);
          --card-bg-on: rgba(20, 24, 38, 0.72);
          --card-border-off: rgba(255, 255, 255, 0.05);
          --card-border-on: rgba(255, 215, 115, 0.35);
          --text-main: #f5f7fa;
          --text-muted: #8e9bb0;
          --text-dim: #546075;
          --font-uyghur: "ALKATIP Tor Tom", "ALKATIP Tor", "ALKATIP Basma Tom", "UKIJ Tor Tom", "UKIJ Tuz", "Microsoft Uighur", "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, sans-serif;
          --font-ltr: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          
          position: fixed;
          inset: 0;
          z-index: 10000;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background-color: var(--bg-dark);
          font-family: ${isRTL ? 'var(--font-uyghur)' : 'var(--font-ltr)'};
          color: var(--text-main);
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        @media (min-width: 881px) and (min-height: 650px) {
          .nasrulla-modal-root {
            align-items: center;
          }
        }

        .nasrulla-modal-root::before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 50% 120px, rgba(30, 36, 56, 0.5) 0%, rgba(7, 9, 14, 0.95) 80%);
          pointer-events: none;
          z-index: 0;
        }

        .nasrulla-modal-root::after {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 35% 260px, rgba(135, 95, 25, 0.45) 0%, rgba(45, 32, 12, 0.25) 50%, rgba(7, 9, 14, 0.98) 85%);
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          transition: opacity 0.25s ease;
          will-change: opacity;
        }

        .nasrulla-modal-root.lamp-on::after {
          opacity: 1;
        }

        .nasrulla-modal-root .vignette-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.82) 100%);
          pointer-events: none;
          z-index: 1;
        }

        .nasrulla-modal-root #particle-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }

        .nasrulla-modal-root .btn-close-modal {
          position: fixed;
          top: 20px;
          left: 24px;
          z-index: 150;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 30px;
          background: rgba(14, 18, 28, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: var(--text-main);
          font-family: var(--font-uyghur);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nasrulla-modal-root .btn-close-modal:hover {
          background: rgba(22, 28, 44, 0.95);
          border-color: rgba(255, 196, 77, 0.5);
          color: #ffd77a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 196, 77, 0.25);
        }

        .nasrulla-modal-root .scene-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1100px;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          justify-content: center;
          gap: 65px;
          padding: 40px 24px;
        }

        /* Standing Floor Lamp Rig */
        .nasrulla-modal-root .lamp-rig {
          position: relative;
          width: 320px;
          height: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
          pointer-events: none;
        }

        .nasrulla-modal-root .lamp-ambient-glow {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%) translateZ(0);
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 35%, rgba(255, 205, 100, 0.32) 0%, rgba(255, 170, 40, 0.15) 35%, rgba(255, 130, 10, 0.04) 60%, transparent 80%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 4;
          will-change: opacity;
        }

        .nasrulla-modal-root.lamp-on .lamp-ambient-glow {
          opacity: 1;
        }

        .nasrulla-modal-root .lamp-shade-container {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 15;
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.85));
        }

        .nasrulla-modal-root .lamp-finial {
          width: 14px;
          height: 14px;
          background: radial-gradient(circle at 35% 30%, #fff7d6 0%, #d4a34b 45%, #684814 100%);
          border-radius: 50% 50% 2px 2px;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.6);
          margin-bottom: -2px;
          z-index: 2;
        }

        .nasrulla-modal-root .lamp-cap {
          width: 48px;
          height: 12px;
          background: linear-gradient(to right, #402f0e 0%, #b88f3e 25%, #fff2ba 50%, #9e7529 75%, #332306 100%);
          border-radius: 5px 5px 1px 1px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          z-index: 1;
        }

        .nasrulla-modal-root .lamp-shade {
          width: 140px;
          height: 64px;
          position: relative;
          background: linear-gradient(105deg, #181c26 0%, #293040 22%, #45526d 48%, #252b3a 75%, #141720 100%);
          clip-path: polygon(23% 0%, 77% 0%, 100% 100%, 0% 100%);
          border-radius: 4px 4px 0 0;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          box-shadow: inset 0 -6px 14px rgba(0, 0, 0, 0.7);
          transition: background 0.6s ease, filter 0.6s ease;
        }

        .nasrulla-modal-root.lamp-on .lamp-shade {
          background: linear-gradient(105deg, #2b1f0e 0%, #5c431b 22%, #8c682c 48%, #4f3916 75%, #211608 100%);
          filter: drop-shadow(0 0 16px rgba(255, 183, 3, 0.35));
        }

        .nasrulla-modal-root .lamp-shade-rim {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(to right, #4a3610 0%, #d4a74c 25%, #fff8dc 50%, #b58933 75%, #38280a 100%);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
          transition: box-shadow 0.4s ease, filter 0.4s ease;
        }

        .nasrulla-modal-root.lamp-on .lamp-shade-rim {
          filter: drop-shadow(0 0 8px #ffc44d);
          box-shadow: 0 0 12px rgba(255, 215, 115, 0.85);
        }

        .nasrulla-modal-root .lamp-inner-reflector {
          position: absolute;
          bottom: -6px;
          left: 8px;
          right: 8px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(255, 255, 235, 0.98) 0%, rgba(255, 205, 100, 0.75) 50%, transparent 85%);
          opacity: 0;
          filter: blur(2px);
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 13;
        }

        .nasrulla-modal-root.lamp-on .lamp-inner-reflector {
          opacity: 1;
        }

        .nasrulla-modal-root .lamp-bulb {
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 30px;
          background: radial-gradient(circle at 50% 32%, #ffffff 0%, #d6dae3 52%, #7a808e 100%);
          border-radius: 50%;
          z-index: 14;
          opacity: 0.85;
          transition: background 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.8);
        }

        .nasrulla-modal-root .bulb-filament {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 9px;
          height: 11px;
          border: 1.5px solid #54452e;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
          opacity: 0.65;
          transition: border-color 0.2s ease, opacity 0.2s ease;
        }

        .nasrulla-modal-root.lamp-on .lamp-bulb {
          background: radial-gradient(circle at 50% 28%, #ffffff 0%, #fff7d6 28%, #ffd066 62%, #ff9800 100%);
          opacity: 1;
          box-shadow: 0 0 16px 4px #ffffff, 0 0 32px 10px #ffd54f;
        }

        .nasrulla-modal-root.lamp-on .bulb-filament {
          border-color: #ffffff;
          box-shadow: 0 0 8px 2px #fff6d6;
          opacity: 1;
        }

        .nasrulla-modal-root .cord-collar {
          position: absolute;
          top: 106px;
          left: calc(50% - 36px);
          transform: translateX(-50%);
          width: 8px;
          height: 5px;
          background: linear-gradient(to right, #402f0e 0%, #c49942 30%, #fff0aa 50%, #997227 75%, #332306 100%);
          border-radius: 2px 2px 4px 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
          z-index: 16;
          transition: filter 0.4s ease;
        }

        .nasrulla-modal-root.lamp-on .cord-collar {
          filter: drop-shadow(0 0 6px rgba(255, 205, 90, 0.9));
        }

        .nasrulla-modal-root .lamp-stem {
          position: absolute;
          top: 89px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 340px;
          background: linear-gradient(to right, #332610 0%, #7d632c 30%, #ecd996 50%, #9e7f3a 70%, #2e210a 100%);
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
          z-index: 8;
          transition: filter 0.4s ease;
        }

        .nasrulla-modal-root.lamp-on .lamp-stem {
          filter: drop-shadow(0 0 6px rgba(255, 196, 77, 0.45));
        }

        .nasrulla-modal-root .lamp-base {
          position: absolute;
          bottom: 45px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, #8a6c32 0%, #54411b 45%, #241b09 80%, #0d0a04 100%);
          border: 1.5px solid rgba(255, 225, 140, 0.2);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.95), 0 3px 8px rgba(0, 0, 0, 0.8);
          z-index: 9;
          transition: all 0.4s ease;
        }

        .nasrulla-modal-root.lamp-on .lamp-base {
          border-color: rgba(255, 220, 130, 0.5);
          background: radial-gradient(ellipse at center, #b59146 0%, #735926 45%, #36290e 80%, #120e05 100%);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.95), 0 0 22px rgba(255, 196, 77, 0.45);
        }

        /* Dual-layer Volumetric Feathered Light Beam (High Performance GPU Gradient) */
        .nasrulla-modal-root .light-beam {
          position: absolute;
          top: 106px;
          left: 50%;
          transform: translateX(-50%) translateZ(0);
          width: 420px;
          height: 360px;
          clip-path: polygon(33.3% 0%, 66.7% 0%, 98% 100%, 2% 100%);
          background: radial-gradient(ellipse at 50% 0%, rgba(255, 245, 200, 0.95) 0%, rgba(255, 215, 115, 0.58) 22%, rgba(255, 180, 55, 0.25) 52%, rgba(255, 140, 20, 0.05) 78%, transparent 100%);
          pointer-events: none;
          opacity: 0;
          transform-origin: top center;
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 6;
          will-change: opacity;
        }

        .nasrulla-modal-root.lamp-on .light-beam {
          opacity: 0.92;
        }

        .nasrulla-modal-root .light-beam-core {
          position: absolute;
          top: 106px;
          left: 50%;
          transform: translateX(-50%) translateZ(0);
          width: 260px;
          height: 350px;
          clip-path: polygon(38% 0%, 62% 0%, 90% 100%, 10% 100%);
          background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 250, 0.92) 0%, rgba(255, 230, 145, 0.42) 28%, rgba(255, 190, 75, 0.12) 65%, transparent 92%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
          z-index: 7;
          will-change: opacity;
        }

        .nasrulla-modal-root.lamp-on .light-beam-core {
          opacity: 0.95;
        }

        .nasrulla-modal-root .desk-reflection {
          position: absolute;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%) translateZ(0);
          width: 360px;
          height: 95px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(255, 220, 130, 0.45) 0%, rgba(255, 180, 50, 0.2) 38%, rgba(255, 140, 20, 0.04) 68%, transparent 85%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.6s ease;
          z-index: 5;
          will-change: opacity;
        }

        .nasrulla-modal-root.lamp-on .desk-reflection {
          opacity: 1;
        }

        /* Interactive Pull Cord */
        .nasrulla-modal-root .pull-cord-wrapper {
          position: absolute;
          top: 108px;
          left: calc(50% - 86px);
          width: 100px;
          height: 240px;
          z-index: 22;
          pointer-events: auto;
          user-select: none;
          touch-action: none;
          transform: translateZ(0);
          will-change: transform;
        }

        .nasrulla-modal-root .pull-cord-svg {
          width: 100px !important;
          height: 240px !important;
          overflow: visible;
          pointer-events: none;
        }

        .nasrulla-modal-root .cord-string {
          stroke: #8a7758;
          stroke-width: 3.2;
          stroke-linecap: round;
          fill: none;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
          transition: stroke 0.3s ease, filter 0.3s ease;
        }

        .nasrulla-modal-root.lamp-on .cord-string {
          stroke: #ffd466;
          filter: drop-shadow(0 0 6px rgba(255, 200, 80, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9));
        }

        .nasrulla-modal-root .cord-mid-bead {
          fill: url(#modalHandleGrad);
          stroke: #2e2008;
          stroke-width: 1.2;
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.85));
          pointer-events: none;
        }

        .nasrulla-modal-root .cord-handle {
          fill: url(#modalHandleGrad);
          stroke: #2e2008;
          stroke-width: 1.5;
          filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.9));
          cursor: grab;
          pointer-events: auto;
        }

        .nasrulla-modal-root .pull-cord-wrapper:hover .cord-handle,
        .nasrulla-modal-root .pull-cord-wrapper:hover .cord-mid-bead {
          filter: drop-shadow(0 0 14px #ffc44d) drop-shadow(0 5px 12px rgba(0, 0, 0, 0.95));
        }

        .nasrulla-modal-root .cord-hit-area {
          fill: transparent;
          cursor: grab;
          pointer-events: auto;
        }

        .nasrulla-modal-root .cord-hit-area:active,
        .nasrulla-modal-root .cord-handle:active {
          cursor: grabbing;
        }

        .nasrulla-modal-root .cord-hint {
          position: absolute;
          top: 236px;
          left: calc(50% - 36px);
          transform: translateX(-50%);
          background: rgba(13, 17, 27, 0.94);
          border: 1px solid rgba(255, 196, 77, 0.45);
          padding: 7px 16px;
          border-radius: 24px;
          font-size: 13.5px;
          font-weight: 700;
          color: #ffd77a;
          white-space: nowrap;
          pointer-events: auto;
          cursor: pointer;
          opacity: 0.96;
          transition: opacity 0.4s ease, transform 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 196, 77, 0.2);
          z-index: 25;
        }

        .nasrulla-modal-root .cord-hint.hidden {
          opacity: 0;
          transform: translate(-50%, -8px);
          pointer-events: none;
        }

        .nasrulla-modal-root .cord-hint::after {
          content: "";
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-bottom: 6px solid rgba(255, 196, 77, 0.5);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
        }

        /* 3D Flip Card Container */
        .nasrulla-modal-root .login-card-container {
          position: relative;
          width: 100%;
          max-width: 440px;
          margin-top: 15px;
          z-index: 15;
          perspective: 1400px;
        }

        .nasrulla-modal-root .card-flipper {
          position: relative;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
          transform-style: preserve-3d;
          transition: transform 0.85s cubic-bezier(0.34, 1.25, 0.64, 1);
          will-change: transform;
          transform: translateZ(0);
        }

        .nasrulla-modal-root .login-card-container.flipped .card-flipper {
          transform: rotateY(180deg) translateZ(0);
        }

        .nasrulla-modal-root .login-card {
          grid-area: 1 / 1 / 2 / 2;
          position: relative;
          width: 100%;
          background: rgba(14, 18, 28, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px 30px 28px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
          opacity: 0.9;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-style: preserve-3d;
          will-change: opacity, border-color, box-shadow;
          transition: opacity 0.25s ease, background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          pointer-events: auto;
        }

        .nasrulla-modal-root .card-front {
          transform: rotateY(0deg) translateZ(0);
          z-index: 2;
          pointer-events: auto;
        }

        .nasrulla-modal-root .card-back {
          transform: rotateY(180deg) translateZ(0);
          z-index: 1;
          pointer-events: none;
        }

        .nasrulla-modal-root.lamp-on .login-card {
          opacity: 1;
          background: var(--card-bg-on);
          border-color: var(--card-border-on);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 196, 77, 0.15), inset 0 1px 1px rgba(255, 235, 179, 0.45);
        }

        .nasrulla-modal-root .login-card-container.flipped .card-front {
          pointer-events: none !important;
        }

        .nasrulla-modal-root .login-card-container.flipped .card-back {
          pointer-events: auto !important;
        }

        .nasrulla-modal-root .card-top-shine {
          position: absolute;
          top: 0;
          left: 15%;
          right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 224, 130, 0.7), transparent);
          opacity: 0;
          transition: opacity 0.6s ease;
        }

        .nasrulla-modal-root.lamp-on .card-top-shine {
          opacity: 1;
        }

        /* Tabs */
        .nasrulla-modal-root .auth-tabs {
          display: flex;
          background: rgba(10, 14, 23, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 30px;
          padding: 4px;
          margin-bottom: 22px;
          gap: 4px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .nasrulla-modal-root .tab-btn {
          flex: 1;
          padding: 7px 14px;
          border-radius: 22px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-uyghur);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .nasrulla-modal-root .tab-btn:hover {
          color: var(--text-main);
        }

        .nasrulla-modal-root .tab-btn.active {
          background: linear-gradient(135deg, rgba(255, 196, 77, 0.25), rgba(255, 159, 28, 0.15));
          color: #ffd77a;
          border-color: rgba(255, 196, 77, 0.45);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 196, 77, 0.2);
        }

        /* Header */
        .nasrulla-modal-root .card-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .nasrulla-modal-root .badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(255, 196, 77, 0.2), rgba(255, 140, 0, 0.05));
          border: 1px solid rgba(255, 196, 77, 0.35);
          color: #ffc44d;
          margin-bottom: 10px;
          box-shadow: 0 4px 15px rgba(255, 196, 77, 0.15);
        }

        .nasrulla-modal-root .badge-icon svg {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }

        .nasrulla-modal-root .card-title {
          font-size: 23px;
          font-weight: 700;
          line-height: 1.5;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .nasrulla-modal-root.lamp-on .card-title {
          text-shadow: 0 2px 10px rgba(255, 214, 102, 0.3);
        }

        .nasrulla-modal-root .card-subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* Form elements */
        .nasrulla-modal-root .form-group {
          margin-bottom: 16px;
          text-align: right;
        }

        .nasrulla-modal-root .field-label {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #cfd6e4;
          margin-bottom: 7px;
          line-height: 1.5;
        }

        /* 360° Rotating Border Beam */
        .nasrulla-modal-root .input-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          border-radius: 13px;
          padding: 1.5px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);
          transition: box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease;
        }

        .nasrulla-modal-root .input-border-beam {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 65%,
            rgba(255, 196, 77, 0.15) 90%,
            #ffc44d 130%,
            #ffffff 165%,
            #ffb703 190%,
            transparent 230%,
            transparent 360deg
          );
          animation: modalRotateBorderBeam 3.2s linear infinite;
          animation-play-state: paused;
          will-change: transform;
          transform: translateZ(0);
          opacity: 0;
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.3s ease;
        }

        .nasrulla-modal-root .input-wrapper:hover .input-border-beam {
          opacity: 0.65;
          animation-play-state: running;
        }

        .nasrulla-modal-root .input-wrapper:focus-within .input-border-beam {
          opacity: 1;
          animation-play-state: running;
          animation-duration: 1.8s;
        }

        .nasrulla-modal-root .input-wrapper:focus-within {
          background: transparent;
          box-shadow: 0 0 16px rgba(255, 196, 77, 0.35), 0 0 6px rgba(255, 215, 115, 0.6);
        }

        @keyframes modalRotateBorderBeam {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .nasrulla-modal-root .custom-input {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 46px;
          background: rgba(14, 18, 28, 0.96);
          border: none;
          border-radius: 11.5px;
          padding: 0 44px 0 16px;
          font-family: var(--font-uyghur);
          font-size: 14.5px;
          color: var(--text-main);
          outline: none;
          direction: rtl;
          transition: background 0.25s ease;
        }

        .nasrulla-modal-root .custom-input::placeholder {
          color: var(--text-dim);
          font-size: 13px;
        }

        .nasrulla-modal-root .custom-input:focus {
          background: rgba(11, 15, 24, 0.98);
        }

        .nasrulla-modal-root .input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 19px;
          height: 19px;
          fill: var(--text-dim);
          transition: fill 0.3s ease, filter 0.3s ease;
          pointer-events: none;
          z-index: 3;
        }

        .nasrulla-modal-root .input-wrapper:focus-within .input-icon {
          fill: var(--lamp-gold);
          filter: drop-shadow(0 0 6px rgba(255, 196, 77, 0.5));
        }

        .nasrulla-modal-root .toggle-password {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          transition: color 0.25s ease;
          outline: none;
          z-index: 3;
        }

        .nasrulla-modal-root .toggle-password:hover {
          color: var(--text-main);
        }

        .nasrulla-modal-root .toggle-password svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }

        .nasrulla-modal-root .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-size: 13px;
        }

        .nasrulla-modal-root .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s ease;
        }

        .nasrulla-modal-root .remember-me:hover {
          color: var(--text-main);
        }

        .nasrulla-modal-root .checkbox-custom {
          appearance: none;
          -webkit-appearance: none;
          width: 17px;
          height: 17px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          background: rgba(14, 18, 28, 0.7);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .nasrulla-modal-root .checkbox-custom:checked {
          background: var(--lamp-gold);
          border-color: var(--lamp-gold);
        }

        .nasrulla-modal-root .checkbox-custom:checked::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid #11141c;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .nasrulla-modal-root .forgot-pass {
          color: #ffd073;
          text-decoration: none;
          transition: color 0.2s ease, text-shadow 0.2s ease;
        }

        .nasrulla-modal-root .forgot-pass:hover {
          color: #ffe6a6;
          text-shadow: 0 0 8px rgba(255, 208, 115, 0.5);
        }

        /* Flying Arrow Submit Button */
        .nasrulla-modal-root .btn-submit {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 13px;
          background: linear-gradient(135deg, #ffc74f 0%, #fca311 100%);
          color: #12151e;
          font-family: var(--font-uyghur);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(252, 163, 17, 0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nasrulla-modal-root .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(252, 163, 17, 0.5), 0 0 15px rgba(255, 214, 102, 0.4);
        }

        .nasrulla-modal-root .btn-submit:active {
          transform: translateY(0);
        }

        .nasrulla-modal-root .btn-arrow {
          width: 18px;
          height: 18px;
          fill: currentColor;
          display: inline-block;
          transition: transform 0.25s ease;
        }

        .nasrulla-modal-root .btn-submit:hover:not(.arrow-flying) .btn-arrow {
          transform: translateX(-4px);
        }

        .nasrulla-modal-root .btn-submit.arrow-flying .btn-arrow {
          animation: modalFlyArrowLeft 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes modalFlyArrowLeft {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          25% { transform: translateX(10px) scale(1.15); opacity: 1; }
          100% { transform: translateX(-140px) scale(0.3); opacity: 0; }
        }

        .nasrulla-modal-root .btn-spinner {
          position: absolute;
          left: 18px;
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(18, 21, 30, 0.25);
          border-top-color: #12151e;
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.4);
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .nasrulla-modal-root .btn-submit.loading .btn-spinner {
          opacity: 1;
          transform: scale(1);
          animation: modalSpinLoader 0.7s linear infinite;
        }

        @keyframes modalSpinLoader {
          to { transform: rotate(360deg); }
        }

        /* Social OAuth Button */
        .nasrulla-modal-root .social-auth-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 24px;
        }

        .nasrulla-modal-root .btn-social {
          height: 46px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(18, 22, 33, 0.6);
          color: var(--text-main);
          font-family: var(--font-uyghur);
          font-size: 14.5px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.25s ease;
          outline: none;
        }

        .nasrulla-modal-root .btn-social:hover {
          background: rgba(30, 36, 54, 0.9);
          border-color: rgba(255, 255, 255, 0.24);
          transform: translateY(-1px);
        }

        .nasrulla-modal-root .btn-social svg {
          width: 19px;
          height: 19px;
        }

        .nasrulla-modal-root .card-footer {
          text-align: center;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-muted);
        }

        .nasrulla-modal-root .register-link {
          color: #ffd073;
          text-decoration: none;
          font-weight: 600;
          margin-right: 5px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .nasrulla-modal-root .register-link:hover {
          color: #fff0bd;
          text-decoration: underline;
        }

        .nasrulla-modal-root .error-banner {
          background: rgba(225, 29, 72, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.4);
          color: #fecdd3;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Success Overlay */
        .nasrulla-modal-root .success-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(4, 6, 12, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nasrulla-modal-root .success-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }

        .nasrulla-modal-root .success-modal {
          position: relative;
          background: rgba(18, 23, 36, 0.95);
          border: 1px solid rgba(255, 196, 77, 0.45);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 196, 77, 0.25), inset 0 1px 1px rgba(255, 235, 179, 0.4);
          border-radius: 28px;
          padding: 38px 32px 34px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          transform: scale(0.85) translateY(25px);
          transition: transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1);
          direction: rtl;
        }

        .nasrulla-modal-root .success-overlay.active .success-modal {
          transform: scale(1) translateY(0);
        }

        .nasrulla-modal-root .success-glow-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(255, 196, 77, 0.3) 0%, rgba(255, 179, 0, 0.05) 55%, transparent 75%);
          pointer-events: none;
          z-index: 0;
        }

        .nasrulla-modal-root .success-circle-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nasrulla-modal-root .success-circle {
          position: relative;
          width: 86px;
          height: 86px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #2a3449 0%, #101420 100%);
          border: 2px solid rgba(255, 196, 77, 0.6);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 196, 77, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .nasrulla-modal-root .ripple-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1.5px solid rgba(255, 196, 77, 0.6);
          pointer-events: none;
          opacity: 0;
        }

        .nasrulla-modal-root .success-overlay.active .ring-1 {
          animation: modalRippleExpand 2s ease-out infinite;
        }

        .nasrulla-modal-root .success-overlay.active .ring-2 {
          animation: modalRippleExpand 2s ease-out 0.65s infinite;
        }

        @keyframes modalRippleExpand {
          0% { width: 86px; height: 86px; opacity: 0.9; }
          100% { width: 160px; height: 160px; opacity: 0; }
        }

        .nasrulla-modal-root .checkmark-circle {
          stroke: #ffc44d;
          stroke-width: 3;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.65, 0, 0.45, 1);
        }

        .nasrulla-modal-root .checkmark-check {
          stroke: #fff4d1;
          stroke-width: 3.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          filter: drop-shadow(0 0 4px #ffc44d);
          transition: stroke-dashoffset 0.45s cubic-bezier(0.65, 0, 0.45, 1) 0.4s;
        }

        .nasrulla-modal-root .success-overlay.active .checkmark-circle {
          stroke-dashoffset: 0;
        }

        .nasrulla-modal-root .success-overlay.active .checkmark-check {
          stroke-dashoffset: 0;
        }

        .nasrulla-modal-root .success-title {
          position: relative;
          z-index: 2;
          font-size: 23px;
          font-weight: 700;
          color: #fff8e1;
          text-shadow: 0 0 16px rgba(255, 196, 77, 0.45);
          margin-bottom: 6px;
          line-height: 1.5;
        }

        .nasrulla-modal-root .success-subtitle {
          position: relative;
          z-index: 2;
          font-size: 14.5px;
          color: #aebccc;
          line-height: 1.6;
          margin-bottom: 22px;
        }

        .nasrulla-modal-root .success-bar {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .nasrulla-modal-root .success-bar-fill {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #ffc44d, #ffffff);
          box-shadow: 0 0 10px #ffc44d;
          border-radius: 4px;
        }

        .nasrulla-modal-root .success-overlay.active .success-bar-fill {
          animation: modalFillBar 1.8s ease-in-out forwards;
        }

        @keyframes modalFillBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .nasrulla-modal-root .success-btn-close {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 22px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-main);
          font-family: var(--font-uyghur);
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .nasrulla-modal-root .success-btn-close:hover {
          background: rgba(255, 196, 77, 0.2);
          border-color: rgba(255, 196, 77, 0.4);
          color: #ffd77a;
        }

        /* Responsive Breakpoints for Mobile & Tablet */
        @media (max-width: 880px) {
          .nasrulla-modal-root .scene-wrapper {
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
            padding: 30px 14px 45px;
            min-height: 100vh;
            min-height: 100dvh;
          }

          .nasrulla-modal-root.lamp-on::before {
            background: radial-gradient(circle at 50% 120px, rgba(135, 95, 25, 0.45) 0%, rgba(45, 32, 12, 0.25) 50%, rgba(7, 9, 14, 0.98) 85%);
          }

          /* Hide floor pedestal base & pole on mobile so there is no awkward floating disc */
          .nasrulla-modal-root .lamp-base {
            display: none !important;
          }

          .nasrulla-modal-root .lamp-stem {
            display: none !important;
          }

          /* Brass hanging rod descending from ceiling to lamp */
          .nasrulla-modal-root .lamp-shade-container::before {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 90px;
            background: linear-gradient(to right, #332610 0%, #7d632c 30%, #ecd996 50%, #9e7f3a 70%, #2e210a 100%);
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
            z-index: 0;
          }

          /* Compact overhead lamp rig */
          .nasrulla-modal-root .lamp-rig {
            width: 100%;
            max-width: 320px;
            height: 140px;
            margin-bottom: 0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .nasrulla-modal-root .lamp-shade-container {
            top: 20px;
            z-index: 20;
          }

          .nasrulla-modal-root .lamp-cap {
            width: 40px;
            height: 10px;
          }

          .nasrulla-modal-root .lamp-shade {
            width: 124px;
            height: 56px;
          }

          .nasrulla-modal-root .lamp-bulb {
            width: 28px;
            height: 26px;
            bottom: -12px;
          }

          .nasrulla-modal-root .cord-collar {
            top: 76px;
            left: calc(50% - 32px);
          }

          .nasrulla-modal-root .pull-cord-wrapper {
            top: 78px;
            left: calc(50% - 82px);
            height: 200px;
          }

          .nasrulla-modal-root .cord-hint {
            top: 185px;
            left: calc(50% - 32px);
            font-size: 12.5px;
            padding: 5px 12px;
            z-index: 30;
          }

          .nasrulla-modal-root .light-beam {
            top: 76px;
            width: min(94vw, 400px);
            height: 600px;
            clip-path: polygon(32% 0%, 68% 0%, 98% 100%, 2% 100%);
            filter: blur(4px);
            transform: translateX(-50%) translateZ(0);
          }

          .nasrulla-modal-root .light-beam-core {
            top: 76px;
            width: min(78vw, 260px);
            height: 580px;
            clip-path: polygon(38% 0%, 62% 0%, 90% 100%, 10% 100%);
            filter: blur(2px);
            transform: translateX(-50%) translateZ(0);
          }

          .nasrulla-modal-root .login-card-container {
            margin-top: 10px;
            width: 100%;
            max-width: 420px;
          }

          .nasrulla-modal-root .login-card {
            padding: 26px 20px 22px;
            border-radius: 20px;
          }
        }

        @media (max-width: 480px) {
          .nasrulla-modal-root .scene-wrapper {
            padding: 20px 10px 35px;
            gap: 6px;
          }

          .nasrulla-modal-root .btn-close-modal {
            top: 10px;
            left: 10px;
            padding: 6px 13px;
            font-size: 12px;
            z-index: 250;
          }

          .nasrulla-modal-root .lamp-rig {
            height: 130px;
          }

          .nasrulla-modal-root .lamp-shade-container {
            top: 15px;
          }

          .nasrulla-modal-root .lamp-cap {
            width: 36px;
            height: 8px;
          }

          .nasrulla-modal-root .lamp-shade {
            width: 114px;
            height: 50px;
          }

          .nasrulla-modal-root .lamp-bulb {
            width: 26px;
            height: 24px;
            bottom: -10px;
          }

          .nasrulla-modal-root .cord-collar {
            top: 65px;
            left: calc(50% - 28px);
          }

          .nasrulla-modal-root .pull-cord-wrapper {
            top: 67px;
            left: calc(50% - 78px);
          }

          .nasrulla-modal-root .cord-hint {
            top: 172px;
            left: calc(50% - 28px);
            font-size: 11.5px;
            padding: 4px 10px;
          }

          .nasrulla-modal-root .light-beam {
            top: 65px;
          }

          .nasrulla-modal-root .light-beam-core {
            top: 65px;
          }

          .nasrulla-modal-root .login-card-container {
            margin-top: 5px;
          }

          .nasrulla-modal-root .login-card {
            padding: 20px 14px 18px;
            border-radius: 18px;
          }

          .nasrulla-modal-root .card-title {
            font-size: 18.5px;
          }

          .nasrulla-modal-root .card-subtitle {
            font-size: 12px;
          }

          .nasrulla-modal-root .custom-input {
            height: 44px;
            font-size: 13.5px;
            padding: 0 38px 0 12px;
          }

          .nasrulla-modal-root .btn-submit {
            height: 45px;
            font-size: 15px;
          }

          .nasrulla-modal-root .btn-social {
            height: 42px;
            font-size: 13px;
          }
        }
      ` }} />

      {/* Close button at top-left */}
      <button
        type="button"
        className="btn-close-modal"
        onClick={onClose}
        data-modal-close="true"
        title={t('close')}
      >
        <X className="w-4 h-4 text-amber-400" />
        <span>{t('close')}</span>
      </button>

      {/* Firefly particles canvas */}
      <canvas ref={canvasRef} id="particle-canvas" />

      {/* Dark room vignette */}
      <div className="vignette-overlay" />

      {/* Main Interactive Scene */}
      <div className="scene-wrapper">

        {/* 3D Standing Floor Lamp Rig */}
        <div className="lamp-rig">
          <div className="lamp-ambient-glow" />

          {/* Lamp shade, bulb, finial */}
          <div className="lamp-shade-container">
            <div className="lamp-finial" />
            <div className="lamp-cap" />
            <div className="lamp-shade">
              <div className="lamp-shade-rim" />
              <div className="lamp-inner-reflector" />
            </div>
            <div className="lamp-bulb">
              <div className="bulb-filament" />
            </div>
          </div>

          <div className="cord-collar" />
          <div className="lamp-stem" />
          <div className="lamp-base" />

          {/* Volumetric feathered light beam */}
          <div className="light-beam" />
          <div className="light-beam-core" />
          <div className="desk-reflection" />

          {/* Interactive SVG pull cord */}
          <div
            ref={cordHandleRef}
            className="pull-cord-wrapper"
            title={t('cordPullPrompt')}
          >
            <svg className="pull-cord-svg" viewBox="0 0 100 240">
              <defs>
                <radialGradient id="modalHandleGrad" cx="28%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="22%" stopColor="#fff4b8" />
                  <stop offset="50%" stopColor="#ffb703" />
                  <stop offset="80%" stopColor="#996300" />
                  <stop offset="100%" stopColor="#382100" />
                </radialGradient>
              </defs>
              <path ref={cordPathRef} className="cord-string" d="M 50 0 Q 50 53 50 105" />
              <circle ref={cordMidBeadRef} className="cord-mid-bead" cx="50" cy="53" r="4.5" />
              <circle ref={cordKnobRef} className="cord-handle" cx="50" cy="105" r="11" />
              <circle ref={cordKnobShineRef} cx="46.8" cy="101.8" r="3.2" fill="#ffffff" opacity="0.9" pointerEvents="none" />
              <circle ref={cordHitAreaRef} className="cord-hit-area" cx="50" cy="105" r="26" />
            </svg>
          </div>

          {/* Tooltip hint under knob */}
          <div
            className={`cord-hint ${isLampOn ? 'hidden' : ''}`}
            onClick={handleToggleLamp}
            title={t('lampTooltip')}
          >
            <span>👆</span>
            <span>{t('pullLampHint')}</span>
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div
          className={`login-card-container ${isFlipped ? 'flipped' : ''}`}
          onClick={() => {
            if (!isLampOn) handleToggleLamp();
          }}
        >
          <div className="card-flipper">

            {/* ================= FRONT SIDE: LOGIN ================= */}
            <div className="login-card card-front">
              <div className="card-top-shine" />

              {/* Tabs */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`tab-btn ${!isFlipped ? 'active' : ''}`}
                  onClick={() => switchTab(false)}
                >
                  <span>{t('loginTab')}</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${isFlipped ? 'active' : ''}`}
                  onClick={() => switchTab(true)}
                >
                  <span>{t('registerTab')}</span>
                </button>
              </div>

              {/* Header */}
              <div className="card-header">
                <div className="badge-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C7.58 2 4 5.58 4 10c0 2.61 1.25 4.93 3.19 6.4L7 18c0 .55.45 1 1 1h8c.55 0 1-.45 1-1l-.19-1.6C18.75 14.93 20 12.61 20 10c0-4.42-3.58-8-8-8zm-2 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-1h-4v1zm2-17c3.31 0 6 2.69 6 6 0 1.96-.94 3.69-2.4 4.79l-.6.45.27.76.73 2H8l.73-2 .27-.76-.6-.45C6.94 13.69 6 11.96 6 10c0-3.31 2.69-6 6-6z" />
                  </svg>
                </div>
                <h1 className="card-title">{t('welcomeCardTitle')}</h1>
                <p className="card-subtitle">{t('welcomeCardSubtitle')}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit}>
                {errorMsg && !isFlipped && (
                  <div className="error-banner">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Email / Username */}
                <div className="form-group">
                  <label className="field-label">{t('usernameOrEmail')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type="text"
                      className="custom-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={t('usernamePlaceholder')}
                      required
                      autoComplete="username"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="field-label">{t('password')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="custom-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={t('showPassword')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form Options */}
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" className="checkbox-custom" defaultChecked />
                    <span>{t('rememberMe')}</span>
                  </label>
                  <a
                    href="#"
                    className="forgot-pass"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(t('forgotPasswordAlert'));
                    }}
                  >
                    {t('forgotPassword')}
                  </a>
                </div>

                {/* Submit button with arrow flying */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`btn-submit ${loginArrowFlying ? 'arrow-flying' : ''} ${loginLoading ? 'loading' : ''}`}
                >
                  <span className="btn-text">{loginLoading ? t('loggingIn') : t('loginTab')}</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  <div className="btn-spinner" />
                </button>

                {/* Google OAuth Button */}
                <div className="social-auth-grid">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="btn-social"
                  >
                    <svg viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.9 7.4 23 12 23z" />
                    </svg>
                    <span>{googleLoading ? t('googleSigningIn') : t('googleSignIn')}</span>
                  </button>
                </div>

                {/* Footer Switch */}
                <div className="card-footer">
                  <span>{t('dontHaveAccount')}</span>
                  <a
                    href="#"
                    className="register-link"
                    onClick={(e) => {
                      e.preventDefault();
                      switchTab(true);
                    }}
                  >
                    {t('registerNow')}
                  </a>
                </div>
              </form>
            </div>

            {/* ================= BACK SIDE: SIGN UP ================= */}
            <div className="login-card card-back">
              <div className="card-top-shine" />

              {/* Tabs */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`tab-btn ${!isFlipped ? 'active' : ''}`}
                  onClick={() => switchTab(false)}
                >
                  <span>{t('loginTab')}</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${isFlipped ? 'active' : ''}`}
                  onClick={() => switchTab(true)}
                >
                  <span>{t('registerTab')}</span>
                </button>
              </div>

              {/* Header */}
              <div className="card-header">
                <div className="badge-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h1 className="card-title">{t('createAccountTitle')}</h1>
                <p className="card-subtitle">{t('createAccountSubtitle')}</p>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSignupSubmit}>
                {errorMsg && isFlipped && (
                  <div className="error-banner">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Name */}
                <div className="form-group">
                  <label className="field-label">{t('nameLabel')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type="text"
                      className="custom-input"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      autoComplete="name"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="field-label">{t('emailLabel')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type="email"
                      className="custom-input"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="example@mail.com"
                      required
                      autoComplete="email"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="field-label">{t('password')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      className="custom-input"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder={t('passwordMinLengthPlaceholder')}
                      required
                      autoComplete="new-password"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      aria-label={t('showPassword')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="field-label">{t('confirmPassword')}</label>
                  <div className="input-wrapper">
                    <div className="input-border-beam" />
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      className="custom-input"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder={t('confirmPasswordPlaceholder')}
                      required
                      autoComplete="new-password"
                    />
                    <svg className="input-icon" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      aria-label={t('showPassword')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                    />
                    <span>{t('agreeTermsText')}</span>
                  </label>
                </div>

                {/* Submit button with arrow flying */}
                <button
                  type="submit"
                  disabled={signupLoading}
                  className={`btn-submit ${signupArrowFlying ? 'arrow-flying' : ''} ${signupLoading ? 'loading' : ''}`}
                >
                  <span className="btn-text">{signupLoading ? t('registering') : t('createAccountBtn')}</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  <div className="btn-spinner" />
                </button>

                {/* Google OAuth Button */}
                <div className="social-auth-grid">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="btn-social"
                  >
                    <svg viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.9 7.4 23 12 23z" />
                    </svg>
                    <span>{googleLoading ? t('googleSigningIn') : t('googleSignUp')}</span>
                  </button>
                </div>

                {/* Footer Switch */}
                <div className="card-footer">
                  <span>{t('alreadyHaveAccount')}</span>
                  <a
                    href="#"
                    className="register-link"
                    onClick={(e) => {
                      e.preventDefault();
                      switchTab(false);
                    }}
                  >
                    {t('signInNow')}
                  </a>
                </div>
              </form>
            </div>

          </div>
        </div>

      </div>

      {/* Success Portal Modal */}
      <div
        className={`success-overlay ${showSuccess ? 'active' : ''}`}
        onClick={() => setShowSuccess(false)}
      >
        <div className="success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-glow-aura" />

          <div className="success-circle-wrapper">
            <div className="ripple-ring ring-1" />
            <div className="ripple-ring ring-2" />
            <div className="success-circle">
              <svg className="w-12 h-12" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="23" fill="none" />
                <path className="checkmark-check" fill="none" d="M14 27 l8 8 l16 -16" />
              </svg>
            </div>
          </div>

          <h2 className="success-title">{successTitle}</h2>
          <p className="success-subtitle">{successSubtitle}</p>

          <div className="success-bar">
            <div className="success-bar-fill" />
          </div>

          <button
            type="button"
            className="success-btn-close"
            onClick={() => setShowSuccess(false)}
          >
            <span>{t('gotItClose')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
