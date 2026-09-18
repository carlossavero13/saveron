import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';

export default function Icon({ searchParams }: { searchParams: { size?: string } }) {
  const size = searchParams.size ? parseInt(searchParams.size) : 512;
  
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1DB954',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.2,
          color: '#000',
          fontSize: size * 0.5,
          fontWeight: 900,
        }}
      >
        SV
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
