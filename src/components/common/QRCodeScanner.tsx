import { Html5Qrcode } from "html5-qrcode";
import { FC, useEffect, useState } from "react";
import { CancelIcon, QRScanIcon } from "../icons";

interface Props {
  onScanSuccess: (code: string) => void;
}

const QRCodeScanner: FC<Props> = ({ onScanSuccess }) => {
  const [scanner, setScanner] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    setScanner(html5QrCode);

    return () => {
      if (html5QrCode && isScanning) {
        scanner.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = () => {
    if (!scanner) return;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 320, height: 320 } },
      (code: string) => {
        if (["G", "C"].includes(code[0]) && code.length === 56) {
          onScanSuccess(code);
          scanner.stop()
            .then(() => setIsScanning(false))
            .catch(console.error);
        }
      },
      console.warn,
    )
      .then(() => setIsScanning(true))
      .catch(console.error);
  };

  const stopScanning = () => {
    if (scanner && isScanning) {
      scanner.stop()
        .then(() => setIsScanning(false))
        .catch(console.error);
    }
  };

  return (
    <>
      {!isScanning ? (
        <button onClick={startScanning}>
          <QRScanIcon />
        </button>
      ) : (
        <button onClick={stopScanning}>
          <CancelIcon />
        </button>
      )}
    </>
  );
};

export default QRCodeScanner;
