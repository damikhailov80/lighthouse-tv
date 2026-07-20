import { useId } from "react";
import styles from "./Logo.module.css";

interface LogoProps {
  className?: string;
}

// The brand mark: a striped lighthouse throwing a beam to each side.
// Drawn inline rather than shipped as an image file so it stays crisp at any
// size on a TV panel, costs a few hundred bytes in the single-file bundle and
// takes its colours from the design tokens.
export function Logo({ className }: LogoProps) {
  // Gradient ids are document-global, so they must not collide when the mark
  // is rendered more than once on a page.
  const id = useId();
  const beamLeft = `${id}-beam-left`;
  const beamRight = `${id}-beam-right`;
  const tower = `${id}-tower`;

  return (
    <svg
      className={className ? `${styles.logo} ${className}` : styles.logo}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Lighthouse"
    >
      <defs>
        <linearGradient id={beamLeft} x1="1" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" className={styles.beamEnd} />
          <stop offset="1" className={styles.beamStart} />
        </linearGradient>
        <linearGradient id={beamRight} x1="63" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" className={styles.beamEnd} />
          <stop offset="1" className={styles.beamStart} />
        </linearGradient>
        {/* The stripes are straight bands cut to the shape of the tower. */}
        <clipPath id={tower}>
          <path d="M25 28h14l6 27.5H19Z" />
        </clipPath>
      </defs>

      <path d="M24 15v9L1 30V9Z" fill={`url(#${beamLeft})`} />
      <path d="M40 15v9l23 6V9Z" fill={`url(#${beamRight})`} />

      <g className={styles.tower}>
        <rect x="31.1" y="2.5" width="1.8" height="4.5" rx="0.9" />
        <path d="M32 5.5 45 14.5H19Z" />
        <rect x="18" y="13.5" width="28" height="2.2" rx="0.6" />
        <rect x="24" y="15.5" width="16" height="8" />
        <rect x="21" y="23" width="22" height="5" rx="0.8" />
        <path d="M25 28h14l6 27.5H19Z" />
        <rect x="13" y="55" width="38" height="3.6" rx="0.8" />
      </g>

      <g className={styles.glass}>
        <rect x="25.5" y="17" width="3.5" height="5" rx="0.5" />
        <rect x="30.25" y="17" width="3.5" height="5" rx="0.5" />
        <rect x="35" y="17" width="3.5" height="5" rx="0.5" />
      </g>

      <g className={styles.glass} clipPath={`url(#${tower})`}>
        <path d="M14 44 50 18v8L14 52Z" />
        <path d="M14 60 50 34v8L14 68Z" />
      </g>
    </svg>
  );
}
