import React from 'react';
import {
  Gamepad2,
  Smartphone,
  Bot,
  MessageSquareShare,
  CreditCard,
  LayoutGrid,
  Send,
  Sparkles,
  Palette,
  PhoneCall,
  Crosshair,
  Gem,
  Video,
  KeyRound,
  Coins,
  Share2,
  Wallet,
  Package,
  Crown,
  Zap,
  ShieldCheck,
  Swords,
  Flame,
  Trophy,
  Gift,
  Rocket,
  Globe,
  Headphones,
  Tv,
  Music,
  Ghost,
  Skull,
  Target,
  Bomb
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
}

export default function DynamicIcon({ name, className = 'w-5 h-5' }: IconProps) {
  switch (name) {
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'Swords':
      return <Swords className={className} />;
    case 'Crosshair':
      return <Crosshair className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Gem':
      return <Gem className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Ghost':
      return <Ghost className={className} />;
    case 'Skull':
      return <Skull className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Bomb':
      return <Bomb className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'MessageSquareShare':
      return <MessageSquareShare className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Video':
      return <Video className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'Headphones':
      return <Headphones className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'KeyRound':
      return <KeyRound className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} />;
    case 'Send':
      return <Send className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'PhoneCall':
      return <PhoneCall className={className} />;
    case 'Share2':
      return <Share2 className={className} />;
    case 'Package':
      return <Package className={className} />;
    default:
      return <Package className={className} />;
  }
}
