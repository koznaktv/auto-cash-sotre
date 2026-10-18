'use client';

import React from 'react';
import { ShoppingCart, Check, Package } from 'lucide-react';

interface AnimatedOrderButtonProps {
  status: 'idle' | 'loading' | 'success';
  disabled?: boolean;
  label: string;
  isRTL?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'button';
}

export default function AnimatedOrderButton({
  status,
  disabled = false,
  label,
  isRTL = true,
  onClick,
  type = 'submit',
}: AnimatedOrderButtonProps) {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <>
      <style jsx>{`
        @keyframes boxDropAnim {
          0% {
            transform: translateY(-24px) scale(0.5);
            opacity: 0;
          }
          60% {
            transform: translateY(2px) scale(1.15);
            opacity: 1;
          }
          80% {
            transform: translateY(-1px) scale(0.95);
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
        }

        @keyframes cartDriveAnimRTL {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-10px) rotate(-1.5deg);
          }
          50% {
            transform: translateX(-35px) rotate(1deg);
          }
          80% {
            transform: translateX(-70px) rotate(-1deg);
          }
          100% {
            transform: translateX(-110px) rotate(0deg);
          }
        }

        @keyframes cartDriveAnimLTR {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(10px) rotate(1.5deg);
          }
          50% {
            transform: translateX(35px) rotate(-1deg);
          }
          80% {
            transform: translateX(70px) rotate(1deg);
          }
          100% {
            transform: translateX(110px) rotate(0deg);
          }
        }

        @keyframes checkPopAnim {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.25) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .anim-box-drop {
          animation: boxDropAnim 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .anim-cart-drive-rtl {
          animation: cartDriveAnimRTL 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .anim-cart-drive-ltr {
          animation: cartDriveAnimLTR 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .anim-check-pop {
          animation: checkPopAnim 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <button
        type={type}
        disabled={disabled || isLoading || isSuccess}
        onClick={onClick}
        className={`relative overflow-hidden flex items-center justify-center font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 min-w-[210px] h-[44px] select-none ${
          isSuccess
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50 scale-[1.02]'
            : isLoading
            ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-cyan-500/20 cursor-wait'
            : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.98] cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* State 1: Idle */}
        {!isLoading && !isSuccess && (
          <div className="flex items-center gap-2 transition-all duration-300">
            <ShoppingCart className="w-4 h-4 text-cyan-200 shrink-0" />
            <span className="font-bold text-[13px] tracking-wide">{label}</span>
          </div>
        )}

        {/* State 2: Adding / In-flight Cart Animation */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div
              className={`relative flex items-center ${
                isRTL ? 'anim-cart-drive-rtl' : 'anim-cart-drive-ltr'
              }`}
            >
              {/* Dropping Box into Cart */}
              <div
                className={`anim-box-drop absolute -top-3 w-3 h-3 bg-amber-400 border border-amber-300 rounded-[2px] shadow-sm flex items-center justify-center ${
                  isRTL ? 'right-1' : 'left-1'
                }`}
              >
                <div className="w-1.5 h-0.5 bg-amber-800/70 rounded-[1px]" />
              </div>

              {/* Shopping Cart */}
              <ShoppingCart className="w-5 h-5 text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            </div>

            <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-xs font-bold text-cyan-100`}>
              {isRTL ? 'بىر تەرەپ قىلىنماقتا...' : 'Processing...'}
            </span>
          </div>
        )}

        {/* State 3: Success Checkmark Celebration */}
        {isSuccess && (
          <div className="flex items-center gap-2 text-white">
            <div className="anim-check-pop w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
            <span className="anim-check-pop font-bold text-sm tracking-wide">
              {isRTL ? 'زاكاز مۇۋەپپەقىيەتلىك تاپشۇرۇلدى!' : 'Order Placed Successfully!'}
            </span>
          </div>
        )}
      </button>
    </>
  );
}
