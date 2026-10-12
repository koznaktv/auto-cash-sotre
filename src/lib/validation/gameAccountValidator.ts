/**
 * AUTO CASH - Game Account ID & Zone ID Validator
 * Rigorous format verification before external API execution
 * Prevents invalid provider submissions and user funds loss
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  parsed: {
    userId: string;
    zoneId?: string;
    server?: string;
  };
}

export function validateGameAccount(serviceId: string, input: string): ValidationResult {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      message: 'ئويۇن كىملىكى ياكى ھېسابات ئۇچۇرىنى كىرگۈزۈش شەرت!',
      parsed: { userId: '' },
    };
  }

  // Prevent SQL/Script injection attacks and illegal characters
  if (/['";<>{}\\]/.test(trimmed)) {
    return {
      isValid: false,
      message: 'كىملىك ئۇچۇرىدا چەكلەنگەن ئالاھىدە بەلگىلەر بار! پەقەت ھەرپ، رەقەم ياكى يۇمىلاق قاش كىرگۈزۈڭ.',
      parsed: { userId: trimmed },
    };
  }

  const sid = serviceId.toLowerCase();

  // 1. Mobile Legends: Bang Bang (Requires Player ID + Zone ID)
  // Accepted formats: 12345678(1234), 12345678 (1234), 12345678|1234, 12345678-1234, 12345678 1234
  if (sid.includes('mobile-legend') || sid.includes('mlbb')) {
    const mlbbRegex = /^(\d{6,11})[\s\(\-_/\|]+(\d{3,6})\)?$/;
    const match = trimmed.match(mlbbRegex);
    if (!match) {
      return {
        isValid: false,
        message: 'Mobile Legends كىملىكى كەمچىل ياكى خاتا! توغرا شەكىل: 12345678 (1234) — ئويۇن ID بىلەن رايون نومۇرىنى بىللە كىرگۈزۈڭ.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: {
        userId: match[1],
        zoneId: match[2],
      },
    };
  }

  // 2. PUBG Mobile (Numeric ID, 8-12 digits)
  if (sid.includes('pubg')) {
    const pubgRegex = /^\d{8,12}$/;
    if (!pubgRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'PUBG كىملىكى (UID) خاتا! ئۇ پەقەت 8 دىن 12 گىچە رەقەمدىن تەشكىل تېپىشى شەرت (مەسىلەن: 5123456789).',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 3. Free Fire (Numeric ID, 8-12 digits)
  if (sid.includes('free-fire') || sid.includes('freefire')) {
    const ffRegex = /^\d{8,12}$/;
    if (!ffRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Free Fire كىملىكى خاتا! پەقەت 8 دىن 12 خانىغىچە رەقەم بولۇشى شەرت.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 4. Honor of Kings (Player ID / OpenID)
  if (sid.includes('honor-of-king') || sid.includes('hok')) {
    const hokRegex = /^[a-zA-Z0-9_\-]{5,32}$/;
    if (!hokRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Honor of Kings كىملىكى خاتا! 5 تىن 32 گىچە ھەرپ ياكى رەقەم بولۇشى شەرت.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 5. Wild Rift / Riot ID (Format: Name#Tag)
  if (sid.includes('wild-rift') || sid.includes('riot') || sid.includes('valorant')) {
    if (trimmed.includes('#')) {
      const [name, tag] = trimmed.split('#');
      if (!name || !tag || name.length < 2 || tag.length < 2) {
        return {
          isValid: false,
          message: 'Riot ID خاتا! توغرا شەكىل: Player#Tag (مەسىلەن: Hero#EUW).',
          parsed: { userId: trimmed },
        };
      }
      return {
        isValid: true,
        parsed: { userId: name.trim(), zoneId: tag.trim() },
      };
    } else {
      return {
        isValid: false,
        message: 'Riot ID كەمچىل! تېگ (#) بىلەن بىللە كىرگۈزۈڭ (مەسىلەن: Gamer#1234).',
        parsed: { userId: trimmed },
      };
    }
  }

  // 6. Genshin Impact (9 digits UID)
  if (sid.includes('genshin')) {
    const genshinRegex = /^\d{9}$/;
    if (!genshinRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Genshin Impact UID نومۇرى 9 خانىلىق رەقەم بولۇشى كېرەك (مەسىلەن: 701234567).',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 7. Roblox (Username or numeric User ID)
  if (sid.includes('roblox')) {
    const robloxRegex = /^[a-zA-Z0-9_]{3,24}$/;
    if (!robloxRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Roblox ئىشلەتكۈچى نامى ياكى كىملىكى خاتا! (3 تىن 24 خانىغىچە ھەرپ-رەقەم).',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 8. Clash of Clans / Clash Royale / Brawl Stars (#TAG)
  if (sid.includes('clash') || sid.includes('brawl')) {
    const cleanTag = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    const tagRegex = /^[0289CGJLPQRUVY]{5,12}$/i;
    if (!tagRegex.test(cleanTag)) {
      return {
        isValid: false,
        message: 'ئويۇنچى خاس تېگى (#PlayerTag) خاتا! مەسىلەن: #2PP08R2Y.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: `#${cleanTag.toUpperCase()}` },
    };
  }

  // 9. Generic Game / Digital Product fallback
  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: 'ھېسابات ياكى كىملىك كەم دېگەندە 3 خانىلىق بولۇشى شەرت!',
      parsed: { userId: trimmed },
    };
  }

  return {
    isValid: true,
    parsed: { userId: trimmed },
  };
}
