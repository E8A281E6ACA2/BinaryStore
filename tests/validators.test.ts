import assert from 'node:assert';
import test from 'node:test';
import { parseReleaseUploadFormData } from '@/lib/validators';

test('parseReleaseUploadFormData accepts valid payload', () => {
  const fd = new FormData();
  const file = new File([new Uint8Array([1, 2, 3])], 'app.zip', { type: 'application/octet-stream' });
  fd.append('productSlug', 'product-1');
  fd.append('version', '1.0.0');
  fd.append('file', file);

  const result = parseReleaseUploadFormData(fd);
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.data.productSlug, 'product-1');
    assert.equal(result.data.version, '1.0.0');
    assert.equal(result.data.filename, 'app.zip');
  }
});

test('parseReleaseUploadFormData rejects invalid slug', () => {
  const fd = new FormData();
  const file = new File([new Uint8Array([1])], 'app.zip', { type: 'application/octet-stream' });
  fd.append('productSlug', 'bad slug!');
  fd.append('version', '1.0.0');
  fd.append('file', file);

  const result = parseReleaseUploadFormData(fd);
  assert.ok(!result.ok);
  assert.equal(result.message, 'Invalid product slug');
  assert.equal(result.status, 400);
});
