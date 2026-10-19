/**
 * Helper to determine if current device/window is an unsupported mobile phone.
 * HandStats is strictly designed and optimized for Tablets and PCs/Macs.
 * 
 * Tablets (iPad, Galaxy Tab, etc.) have minimum dimension >= 600px (iPad Mini is 768px).
 * Mobile phones have minimum dimension <= 480px.
 * On desktop, any window width < 768px cannot fit the tablet/desktop interface.
 */
export function checkIsMobileDevice() {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const minDimension = Math.min(width, height);

  // 1. User Agent checks
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
  const isSmartphoneUA =
    /iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua));

  // 2. Viewport dimension thresholds:
  // - Portrait phone: width < 768 and height >= width
  // - Landscape phone: height < 520 or (width < 960 and minDimension < 540)
  //   (e.g. iPhone in landscape is 844x390 or 932x430, minDimension = 390 or 430)
  // - Narrow desktop window (< 768px)
  const isPhonePortrait = width < 768 && height >= width;
  const isPhoneLandscape = height < 520 || (width < 960 && minDimension < 540);

  if (isSmartphoneUA && minDimension < 600) {
    return true;
  }

  return isPhonePortrait || isPhoneLandscape;
}
