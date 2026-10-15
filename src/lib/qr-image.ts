import QRCode from "qrcode";

/**
 * Renders a QR code to a high-resolution PNG data URL (default 1024x1024 for crisp print quality).
 * Uses errorCorrectionLevel: "H" (30% recovery) so stickers remain scannable even if slightly worn.
 */
export async function renderQRToPNG(
  value: string,
  fgColor: string,
  bgColor: string,
  size = 1024
): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  });
}
