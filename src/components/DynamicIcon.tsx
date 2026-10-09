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
  Wallet
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
}

export default function DynamicIcon({ name, className = 'w-5 h-5' }: IconProps) {
  switch (name) {
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'MessageSquareShare':
      return <MessageSquareShare className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} />;
    case 'Send':
      return <Send className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'PhoneCall':
      return <PhoneCall className={className} />;
    case 'Crosshair':
      return <Crosshair className={className} />;
    case 'Gem':
      return <Gem className={className} />;
    case 'Video':
      return <Video className={className} />;
    case 'KeyRound':
      return <KeyRound className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Share2':
      return <Share2 className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    default:
      return <Bot className={className} />;
  }
}
