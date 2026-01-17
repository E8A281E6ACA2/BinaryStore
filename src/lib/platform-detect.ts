export interface DetectedPlatform {
  platform: 'windows' | 'macos' | 'linux' | 'unknown';
  arch: 'x64' | 'arm64' | 'x86' | 'unknown';
}

export function detectPlatform(userAgent: string): DetectedPlatform {
  const ua = userAgent.toLowerCase();

  let platform: DetectedPlatform['platform'] = 'unknown';
  if (ua.includes('win')) platform = 'windows';
  else if (ua.includes('mac')) platform = 'macos';
  else if (ua.includes('linux') || ua.includes('x11')) platform = 'linux';

  let arch: DetectedPlatform['arch'] = 'x64';
  if (ua.includes('arm64') || ua.includes('aarch64')) arch = 'arm64';
  else if (ua.includes('x86') && !ua.includes('x86_64')) arch = 'x86';

  return { platform, arch };
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'windows':
      return '🪟';
    case 'macos':
      return '🍎';
    case 'linux':
      return '🐧';
    default:
      return '💻';
  }
}

export function getPlatformName(platform: string): string {
  switch (platform) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Unknown';
  }
}
