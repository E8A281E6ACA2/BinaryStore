import path from 'path';

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status?: number };

const PRODUCT_SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z_.-]{0,127}$/;
const FILENAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,255}$/;
const ALLOWED_EXTENSIONS = new Set([
  'zip',
  'tar',
  'gz',
  'tgz',
  'bz2',
  'xz',
  '7z',
  'rar',
  'dmg',
  'pkg',
  'exe',
  'msi',
  'deb',
  'rpm',
  'apk',
  'appimage',
  'bin',
  'iso',
]);
const DISALLOWED_MIME_PREFIXES = ['text/', 'application/javascript', 'application/x-javascript'];

export type ReleaseUploadFields = {
  productSlug: string;
  version: string;
  file: File;
  filename: string;
  contentType: string;
};

export function parseReleaseUploadFormData(form: FormData): ValidationResult<ReleaseUploadFields> {
  const productSlug = String(form.get('productSlug') || '').trim();
  const version = String(form.get('version') || '').trim();
  const file = form.get('file');

  if (!productSlug || !version || !file) {
    return { ok: false, message: 'Missing fields', status: 400 };
  }

  if (!PRODUCT_SLUG_PATTERN.test(productSlug)) {
    return { ok: false, message: 'Invalid product slug', status: 400 };
  }

  if (!VERSION_PATTERN.test(version)) {
    return { ok: false, message: 'Invalid version format', status: 400 };
  }

  if (!(file instanceof File) || typeof (file as any).arrayBuffer !== 'function') {
    return { ok: false, message: 'Invalid file payload', status: 400 };
  }

  const rawName = (file as any).name as string;
  const filename = path.basename(rawName || '');
  const contentType = typeof (file as any).type === 'string' ? (file as any).type : '';

  if (
    !filename ||
    !FILENAME_PATTERN.test(filename) ||
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return { ok: false, message: 'Invalid file name', status: 400 };
  }

  const extension = path.extname(filename).replace(/^\./, '').toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return { ok: false, message: 'Unsupported file type', status: 400 };
  }

  if (contentType && DISALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
    return { ok: false, message: 'Unsupported content type', status: 400 };
  }

  return {
    ok: true,
    data: { productSlug, version, file, filename, contentType },
  };
}
