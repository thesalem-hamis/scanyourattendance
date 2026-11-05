import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner';

interface QRCameraScannerProps {
  /** Freezes the picture while a result is on screen. */
  paused: boolean;
  onScan: (codes: IDetectedBarcode[]) => void;
  onError: (error: IScannerError) => void;
}

/** Live camera view that reads QR codes. Back camera, torch button when the phone has one. */
export function QRCameraScanner({ paused, onScan, onError }: QRCameraScannerProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-black">
      <Scanner
        onScan={onScan}
        onError={onError}
        paused={paused}
        formats={['qr_code']}
        sound={false}
        constraints={{ facingMode: 'environment' }}
        components={{ finder: true, torch: true }}
        styles={{ container: { width: '100%', aspectRatio: '1 / 1' } }}
      />
    </div>
  );
}