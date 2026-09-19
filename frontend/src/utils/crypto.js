const SENTINEL = 'SYNCORA::';

export const localCrypto = {
  encrypt(text, password) {
    if (!password) return text;
    // Prepend sentinel so we can verify the password on decrypt
    const payload = SENTINEL + text;
    let result = '';
    for (let i = 0; i < payload.length; i++) {
      result += String.fromCharCode(
        payload.charCodeAt(i) ^ password.charCodeAt(i % password.length)
      );
    }
    return btoa(unescape(encodeURIComponent(result)));
  },

  decrypt(cipher, password) {
    if (!password) return null;
    try {
      const decoded = decodeURIComponent(escape(atob(cipher)));
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length)
        );
      }
      // Verify sentinel — wrong password = wrong result here, every time
      if (!result.startsWith(SENTINEL)) return null;
      return result.slice(SENTINEL.length);
    } catch {
      return null;
    }
  },
};