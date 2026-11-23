import { ImageResponse } from 'next/og';

export const size = {
  width: 96,
  height: 96,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontFamily: 'sans-serif',
          borderRadius: '22px',
          letterSpacing: '-2px',
        }}
      >
        R
      </div>
    ),
    {
      ...size,
    }
  );
}
