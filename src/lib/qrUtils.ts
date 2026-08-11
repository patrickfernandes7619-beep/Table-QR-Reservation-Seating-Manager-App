import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, colorDark = '#1e293b', colorLight = '#ffffff'): Promise<string> {
  try {
    const url = await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel: 'H',
    });
    return url;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}
