import * as THREE from 'three'

/**
 * Holographic materialization shader.
 *
 * Uses a bottom-to-top discard sweep with:
 * - Horizontal scanlines
 * - Fresnel edge glow
 * - Vertex jitter that "locks in" as progress → 1
 * - Noise-based dissolve at the reveal edge
 * - Smooth fadeout via uFadeOut for crossfade to PBR
 *
 * Uniforms driven externally:
 *   uProgress: 0 (invisible) → 1 (fully revealed)
 *   uTime:     elapsed time for animation
 *   uFadeOut:  0 (fully visible) → 1 (fully faded out)
 */

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uFadeOut;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  // Simple pseudo-random
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Vertex jitter — decreases as uProgress approaches 1, and during fadeout
    float jitterAmount = (1.0 - uProgress) * 0.04 * (1.0 - uFadeOut);
    vec3 jitter = vec3(
      sin(position.y * 40.0 + uTime * 8.0) * jitterAmount,
      cos(position.x * 35.0 + uTime * 6.0) * jitterAmount * 0.5,
      sin(position.z * 30.0 + uTime * 7.0) * jitterAmount * 0.3
    );

    // Occasional glitch offset — suppressed during fadeout
    float glitchStrength = step(0.97, hash(vec3(floor(uTime * 12.0), floor(position.y * 8.0), 0.0)));
    jitter.x += glitchStrength * 0.06 * (1.0 - uProgress) * (1.0 - uFadeOut);

    vec4 worldPos = modelMatrix * vec4(position + jitter, 1.0);
    vWorldPosition = worldPos.xyz;

    vec4 mvPosition = viewMatrix * worldPos;
    vViewDir = normalize(-mvPosition.xyz);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uFadeOut;
  uniform vec3 uColor;
  uniform float uFresnelPower;
  uniform float uScanlineCount;
  uniform float uScanlineIntensity;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  // Noise for dissolve edge
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    // ─── Bottom-to-top reveal sweep ───────────────────────────────
    // Map world Y to a reveal range. The can spans roughly -0.9..0.9
    float minY = -1.0;
    float maxY = 1.2;
    float normalizedY = (vWorldPosition.y - minY) / (maxY - minY);

    // Expand progress range so the edge dissolve has room
    float revealEdge = uProgress * 1.4 - 0.2;

    // Noise-based dissolve at the leading edge
    float noise = hash21(vUv * 80.0 + uTime * 2.0);
    float edgeWidth = 0.15;
    float dissolve = smoothstep(revealEdge - edgeWidth, revealEdge, normalizedY + noise * edgeWidth * 0.5);

    // Discard fragments above the reveal line
    if (dissolve > 0.8) discard;

    // ─── Fresnel edge glow ────────────────────────────────────────
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uFresnelPower);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // Reduce Fresnel intensity during fadeout for a smoother blend
    fresnel *= (1.0 - uFadeOut * 0.7);

    // ─── Scanlines ────────────────────────────────────────────────
    // Fade scanlines out during the crossfade so they don't fight the PBR look
    float scanlineFade = 1.0 - uFadeOut;
    float scanline = sin(vWorldPosition.y * uScanlineCount + uTime * 3.0) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, uScanlineIntensity * scanlineFade);

    // Secondary finer scanlines for depth
    float fineScanline = sin(vWorldPosition.y * uScanlineCount * 3.0 - uTime * 5.0) * 0.5 + 0.5;
    scanline *= mix(1.0, fineScanline, uScanlineIntensity * 0.3 * scanlineFade);

    // ─── Edge glow intensification at reveal boundary ─────────────
    float edgeGlow = 1.0 - smoothstep(revealEdge - edgeWidth * 1.5, revealEdge - edgeWidth * 0.2, normalizedY);
    edgeGlow = pow(edgeGlow, 0.5) * 0.6 * (1.0 - uFadeOut);

    // ─── Compose final color ──────────────────────────────────────
    // Base hologram color with scanline modulation
    vec3 baseColor = uColor * scanline;

    // Add Fresnel glow — bright white-cyan at edges
    vec3 fresnelColor = mix(uColor, vec3(1.0), 0.6);
    baseColor += fresnelColor * fresnel * 0.8;

    // Add edge glow at reveal boundary
    baseColor += vec3(0.8, 1.0, 1.0) * edgeGlow;

    // Slight flicker — suppress during fadeout
    float flicker = 0.95 + 0.05 * sin(uTime * 30.0) * (1.0 - uFadeOut);

    // Overall alpha — ramps up with progress, modulated by dissolve
    float alpha = uProgress * (1.0 - dissolve) * flicker;
    alpha = clamp(alpha, 0.0, 1.0);

    // Boost alpha on fresnel edges for visible wireframe-like effect
    alpha = max(alpha, fresnel * 0.4 * uProgress);

    // ─── Fadeout: smoothly reduce overall opacity ─────────────────
    alpha *= (1.0 - uFadeOut);

    gl_FragColor = vec4(baseColor * flicker, alpha);
  }
`

/**
 * Create a holographic ShaderMaterial instance.
 */
export function createHolographicMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uFadeOut: { value: 0.0 },
      uColor: { value: new THREE.Color('#C8FFFF') },
      uFresnelPower: { value: 2.5 },
      uScanlineCount: { value: 60.0 },
      uScanlineIntensity: { value: 0.5 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
}

