import { __TEST_ONLY__resizeImageIfLarge } from '../media';

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type, lastModified: 0 });
}
function bm(w: number, h: number): ImageBitmap {
  return { width: w, height: h, close: jest.fn() } as unknown as ImageBitmap;
}

describe('resizeImageIfLarge', () => {
  let bitmapSpy: jest.SpyInstance;
  let toBlobSpy: jest.SpyInstance;

  beforeEach(() => {
    if (typeof (global as any).createImageBitmap !== 'function') {
      (global as any).createImageBitmap = jest.fn();
    }
    bitmapSpy = jest.spyOn(global as any, 'createImageBitmap').mockResolvedValue(bm(500, 500));
    // jsdom does not implement HTMLCanvasElement.getContext — stub a minimal 2D ctx.
    const fakeCtx = {
      imageSmoothingQuality: 'low',
      drawImage: jest.fn(),
    };
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => fakeCtx as unknown as CanvasRenderingContext2D);
    toBlobSpy = jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (this: HTMLCanvasElement, cb: BlobCallback, type?: string) {
        cb(new Blob(['x'], { type: type ?? 'image/jpeg' }));
      } as any,
    );
  });
  afterEach(() => jest.restoreAllMocks());

  test('GIF passthrough', async () => {
    const f = makeFile('a.gif', 'image/gif');
    expect(await __TEST_ONLY__resizeImageIfLarge(f)).toBe(f);
    expect(bitmapSpy).not.toHaveBeenCalled();
  });
  test('SVG passthrough', async () => {
    const f = makeFile('a.svg', 'image/svg+xml');
    expect(await __TEST_ONLY__resizeImageIfLarge(f)).toBe(f);
  });
  test('HEIC passthrough', async () => {
    const f = makeFile('a.heic', 'image/heic');
    expect(await __TEST_ONLY__resizeImageIfLarge(f)).toBe(f);
  });
  test('small image passthrough', async () => {
    bitmapSpy.mockResolvedValueOnce(bm(500, 500));
    const f = makeFile('a.png', 'image/png', 4096);
    expect(await __TEST_ONLY__resizeImageIfLarge(f)).toBe(f);
    expect(toBlobSpy).not.toHaveBeenCalled();
  });
  test('large image resized to jpeg', async () => {
    bitmapSpy.mockResolvedValueOnce(bm(3200, 2400));
    const f = makeFile('photo.jpg', 'image/jpeg', 5_000_000);
    const out = await __TEST_ONLY__resizeImageIfLarge(f);
    expect(out).not.toBe(f);
    expect(out.type).toBe('image/jpeg');
    expect(out.size).toBeLessThan(f.size);
    expect(toBlobSpy).toHaveBeenCalledTimes(1);
  });
  test('createImageBitmap throw → original', async () => {
    bitmapSpy.mockRejectedValueOnce(new Error('decode failed'));
    const f = makeFile('a.jpg', 'image/jpeg', 4096);
    expect(await __TEST_ONLY__resizeImageIfLarge(f)).toBe(f);
  });
});
