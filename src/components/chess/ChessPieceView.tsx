import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { PieceColor, PieceType } from '../../domain/chess/types';

// Authentic Wikimedia Commons / Chess.com standard Neo vector piece URLs & inline SVGs
// High-resolution, vector-accurate, standard piece shapes familiar to all chess players worldwide

const PIECE_CODE: Record<PieceColor, Record<PieceType, string>> = {
  w: {
    k: 'wk',
    q: 'wq',
    r: 'wr',
    b: 'wb',
    n: 'wn',
    p: 'wp',
  },
  b: {
    k: 'bk',
    q: 'bq',
    r: 'br',
    b: 'bb',
    n: 'bn',
    p: 'bp',
  },
};

// High-speed CDN URLs hosting the official standard chess vector set (cburnett / neo standard)
const CDN_URLS: Record<string, string> = {
  wk: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png',
  wq: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
  wr: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
  wb: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
  wn: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
  wp: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
  bk: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png',
  bq: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
  br: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
  bb: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
  bn: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
  bp: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
};

// Fallback high-res Wikimedia SVG source
const WIKI_SVG: Record<string, string> = {
  wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  size?: number;
}

export const ChessPieceView: React.FC<ChessPieceProps> = React.memo(({ type, color, size = 48 }) => {
  const code = PIECE_CODE[color][type];
  const cdnUrl = CDN_URLS[code];
  const wikiUrl = WIKI_SVG[code];

  if (Platform.OS === 'web') {
    return (
      <img
        src={cdnUrl}
        alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
        width={size}
        height={size}
        draggable={false}
        style={{
          width: size,
          height: size,
          userSelect: 'none',
          pointerEvents: 'none',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))',
        }}
        onError={(e) => {
          // Fallback to Wikipedia SVG if CDN image fails
          (e.currentTarget as HTMLImageElement).src = wikiUrl;
        }}
      />
    );
  }

  return (
    <Image
      source={{ uri: cdnUrl }}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  );
});
