import React from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Polygon,
  Circle,
  Polyline,
} from "react-native-svg";

interface SdhLogoProps {
  size?: number;
  variant?: "icon" | "header";
}

export default function SdhLogo({ size = 32, variant = "icon" }: SdhLogoProps) {
  if (variant === "header") {
    // 48x48 header version
    const scale = size / 48;
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <RadialGradient id="sg" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#5DCAA5" />
            <Stop offset="100%" stopColor="#085041" />
          </RadialGradient>
        </Defs>

        {/* Fondo redondeado oscuro */}
        <Rect width="48" height="48" rx="10" fill="#111827" />

        {/* Escudo */}
        <Path
          d="M24 5 L38 10 L38 27 Q38 39 24 44 Q10 39 10 27 L10 10 Z"
          fill="url(#sg)"
        />
        <Path
          d="M24 5 L38 10 L38 27 Q38 39 24 44 Q10 39 10 27 L10 10 Z"
          fill="none"
          stroke="#9FE1CB"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Casa - techo */}
        <Polygon points="24,13 33,21 15,21" fill="white" opacity="0.95" />
        {/* Casa - cuerpo */}
        <Rect x="16.5" y="21" width="15" height="12" rx="1" fill="white" opacity="0.9" />
        {/* Puerta */}
        <Rect x="21" y="27" width="6" height="6" rx="1.5" fill="#0F6E56" />
        {/* Ventana izquierda */}
        <Rect x="18" y="23" width="3" height="3" rx="0.7" fill="#0F6E56" opacity="0.8" />
        {/* Ventana derecha */}
        <Rect x="27" y="23" width="3" height="3" rx="0.7" fill="#0F6E56" opacity="0.8" />
        {/* Chimenea */}
        <Rect x="28" y="13" width="3" height="6" rx="0.7" fill="white" opacity="0.85" />

        {/* Punto antena */}
        <Circle cx="24" cy="4" r="2.2" fill="#EF9F27" />
        <Circle
          cx="24"
          cy="4"
          r="4.2"
          fill="none"
          stroke="#EF9F27"
          strokeWidth="0.9"
          opacity="0.4"
        />

        {/* Ondas izquierda */}
        <Path
          d="M12 12 Q10.5 8 13.5 5.5"
          fill="none"
          stroke="#EF9F27"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <Path
          d="M10.5 13.5 Q8.5 7.5 14 4"
          fill="none"
          stroke="#EF9F27"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Ondas derecha */}
        <Path
          d="M36 12 Q37.5 8 34.5 5.5"
          fill="none"
          stroke="#EF9F27"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <Path
          d="M37.5 13.5 Q39.5 7.5 34 4"
          fill="none"
          stroke="#EF9F27"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Pulso ECG */}
        <Polyline
          points="11,38 14,38 15.5,34 17.5,42 19.5,36 21.5,38 24,38 26,34 28,42 30,36 32,38 37,38"
          fill="none"
          stroke="#5DCAA5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </Svg>
    );
  }

  // 32x32 icon version (default)
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <RadialGradient id="sg-icon" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#5DCAA5" />
          <Stop offset="100%" stopColor="#085041" />
        </RadialGradient>
      </Defs>

      {/* Fondo oscuro redondeado */}
      <Rect width="32" height="32" rx="6" fill="#111827" />

      {/* Escudo */}
      <Path
        d="M16 3 L26 7 L26 18 Q26 26 16 30 Q6 26 6 18 L6 7 Z"
        fill="url(#sg-icon)"
      />
      <Path
        d="M16 3 L26 7 L26 18 Q26 26 16 30 Q6 26 6 18 L6 7 Z"
        fill="none"
        stroke="#9FE1CB"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Casa - techo */}
      <Polygon points="16,9 22,14 10,14" fill="white" opacity="0.95" />
      {/* Casa - cuerpo */}
      <Rect x="11" y="14" width="10" height="8" rx="0.5" fill="white" opacity="0.9" />
      {/* Puerta */}
      <Rect x="14" y="18" width="4" height="4" rx="1" fill="#0F6E56" />
      {/* Ventanas */}
      <Rect x="12" y="16" width="2" height="2" rx="0.5" fill="#0F6E56" opacity="0.8" />
      <Rect x="18" y="16" width="2" height="2" rx="0.5" fill="#0F6E56" opacity="0.8" />
      {/* Chimenea */}
      <Rect x="18" y="9" width="2" height="4" rx="0.5" fill="white" opacity="0.85" />

      {/* Punto antena (senal) */}
      <Circle cx="16" cy="2.5" r="1.5" fill="#EF9F27" />
      <Circle
        cx="16"
        cy="2.5"
        r="3"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="0.7"
        opacity="0.45"
      />

      {/* Ondas de senal izquierda */}
      <Path
        d="M8 8 Q7 5 9.5 3.5"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <Path
        d="M7 9 Q5.5 5 9 2.5"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Ondas de senal derecha */}
      <Path
        d="M24 8 Q25 5 22.5 3.5"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <Path
        d="M25 9 Q26.5 5 23 2.5"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Pulso / ECG sensor en base del escudo */}
      <Polyline
        points="8,25 10.5,25 11.5,22 13,28 14,24 15.5,25 16.5,25 17.5,22 19,28 20,24 21.5,25 24,25"
        fill="none"
        stroke="#5DCAA5"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </Svg>
  );
}
