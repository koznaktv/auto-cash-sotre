/**
 * AUTO CASH - Game Account ID & Zone ID Validator
 * Rigorous format verification before external API execution
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

  // Prevent SQL/Script injection attacks
  if (/['";<>{}\\]/.test(trimmed)) {
    return {
      isValid: false,
      message: 'كىملىك ئۇچۇرىدا چەكلەنگەن ئالاھىدە بەلگىلەر بار!',
      parsed: { userId: trimmed },
    };
  }

  const sid = serviceId.toLowerCase();

  // 1. Mobile Legends: Bang Bang (Requires Player ID + Zone ID)
  if (sid.includes('mobile-legend') || sid.includes('mlbb')) {
    // Matches formats: 12345678(1234), 12345678 (1234), 12345678|1234, 12345678-1234, 12345678 1234
    const mlbbRegex = /^(\d{6,11})[\s\(\-_/\|]+(\d{3,6})\)?$/;
    const match = trimmed.match(mlbbRegex);
    if (!match) {
      return {
        isValid: false,
        message: 'Mobile Legends كىملىكى كەمچىل! توغرا شەكىل: 12345678 (1234) — ID بىلەن رايون نومۇرىنى بىللە كىرگۈزۈڭ.',
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
        message: 'PUBG كىملىكى (UID) خاتا! ئۇ پەقەت 8 دىن 12 گىچە رەقەمدىن تەشكىل تېپىشى شەرت.',
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
        message: 'Free Fire كىملىكى پەقەت 8 دىن 12 گىچە رەقەمدىن تەشكىل تېپىشى شەرت.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 4. Honor of Kings (Player ID / OpenID)
  if (sid.includes('honor-of-king')) {
    const hokRegex = /^[a-zA-Z0-9_\-]{5,32}$/;
    if (!hokRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Honor of Kings ئويۇن كىملىكى خاتا! 5 تىن 32 گىچە ھەرپ ياكى رەقەم بولۇشى شەرت.',
        parsed: { userId: trimmed },
      };
    }
    return {
      isValid: true,
      parsed: { userId: trimmed },
    };
  }

  // 5. Wild Rift / Riot ID (Format: Name#Tag)
  if (sid.includes('wild-rift') || sid.includes('riot')) {
    if (trimmed.includes('#')) {
      const [name, tag] = trimmed.split('#');
      if (!name || !tag || name.length < 2 || tag.length < 2) {
        return {
          isValid: false,
          message: 'Wild Rift Riot ID خاتا! توغرا شەكىل: Player#Tag (مەسىلەن: Faker#EUW)',
          parsed: { userId: trimmed },
        };
      }
      return {
        isValid: true,
        parsed: { userId: name.trim(), zoneId: tag.trim() },
      };
    }
  }

  // 6. Generic Game / Digital Product fallback
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
