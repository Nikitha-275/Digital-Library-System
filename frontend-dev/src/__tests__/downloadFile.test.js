import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerFileDownload } from '../utils/downloadFile';

describe('triggerFileDownload', () => {
  let createSpy;
  let revokeSpy;
  let clickSpy;
  let clickedAnchor;

  beforeEach(() => {
    // jsdom does not implement object URLs
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
    createSpy = window.URL.createObjectURL;
    revokeSpy = window.URL.revokeObjectURL;

    clickedAnchor = null;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function () {
        clickedAnchor = this;
      });
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it('downloads a Blob under the given filename', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' });
    triggerFileDownload(blob, 'my-book.pdf');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(clickedAnchor.getAttribute('download')).toBe('my-book.pdf');
    expect(clickedAnchor.getAttribute('href')).toBe('blob:mock-url');
  });

  it('defaults the filename to document.pdf', () => {
    triggerFileDownload(new Blob(['x']));
    expect(clickedAnchor.getAttribute('download')).toBe('document.pdf');
  });

  it('wraps non-Blob data in a PDF Blob', () => {
    triggerFileDownload('raw-bytes', 'raw.pdf');
    const passed = createSpy.mock.calls[0][0];
    expect(passed).toBeInstanceOf(Blob);
    expect(passed.type).toBe('application/pdf');
  });

  it('cleans up: removes the link from the DOM and revokes the object URL', () => {
    triggerFileDownload(new Blob(['x']), 'a.pdf');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
