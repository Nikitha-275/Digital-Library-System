/**
 * Triggers a file download in the user's browser given a Blob
 * @param {Blob} blob - The file blob returned by the server / mock
 * @param {string} filename - The name to save the file as
 */
export function triggerFileDownload(blob, filename = 'document.pdf') {
  // Ensure we have a Blob
  const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
  const objectUrl = window.URL.createObjectURL(fileBlob);
  
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
