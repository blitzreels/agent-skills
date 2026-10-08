const VERTEX = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const PRELUDE = `#version 300 es
precision highp float;
uniform vec2 u_res;
out vec4 outColor;
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec4 dithered(vec4 c, float seed) {
  float n = hash12(gl_FragCoord.xy + seed * 17.0) + hash12(gl_FragCoord.yx + seed * 31.0 + 7.0) - 1.0;
  return vec4(c.rgb + n / 255.0, c.a);
}
`;

const compile = ({ gl, type, source }) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
};

/** Full-frame fragment shader on a canvas; seek(uniforms) redraws synchronously. Uniform arrays map to vec2/3/4. */
export function glLayer(canvas, { fragment, uniforms }) {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: true });
  if (!gl) throw new Error("WebGL2 unavailable");
  const program = gl.createProgram();
  gl.attachShader(program, compile({ gl, type: gl.VERTEX_SHADER, source: VERTEX }));
  gl.attachShader(program, compile({ gl, type: gl.FRAGMENT_SHADER, source: PRELUDE + fragment }));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const locations = new Map();
  const set = ({ name, value }) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    const at = locations.get(name);
    if (at === null) return;
    if (typeof value === "number") gl.uniform1f(at, value);
    else if (value.length === 2) gl.uniform2fv(at, value);
    else if (value.length === 3) gl.uniform3fv(at, value);
    else gl.uniform4fv(at, value);
  };
  let current = { ...uniforms };
  return {
    seek(next) {
      current = { ...current, ...next };
      const css = getComputedStyle(canvas);
      const w = Math.round(parseFloat(css.width) * devicePixelRatio);
      const h = Math.round(parseFloat(css.height) * devicePixelRatio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      set({ name: "u_res", value: [w, h] });
      set({ name: "u_dpr", value: devicePixelRatio });
      for (const [name, value] of Object.entries(current)) set({ name, value });
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

const LIGHT = `
uniform float u_t;
uniform float u_dpr;
uniform vec3 u_accent;
uniform vec2 u_center;
uniform float u_size;
uniform float u_intensity;
vec2 css(vec2 frag) { return vec2(frag.x, u_res.y - frag.y) / u_dpr; }
float blob(vec2 p, vec2 c, float r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
vec3 field(vec2 p) {
  float s = u_size;
  float t = u_t;
  vec2 c = u_center;
  vec2 c1 = c + s * vec2(0.42 * sin(t * 0.61), 0.22 * cos(t * 0.47));
  vec2 c2 = c + s * vec2(-0.36 * cos(t * 0.39 + 1.3), 0.30 * sin(t * 0.53 + 0.4));
  vec2 c3 = c + s * vec2(0.18 * sin(t * 0.83 + 2.1), -0.26 * cos(t * 0.71 + 0.9));
  float a = blob(p, c1, s * 0.55);
  float b = blob(p, c2, s * 0.42);
  float h = blob(p, c3, s * 0.20);
  vec3 deep = u_accent * vec3(0.30, 0.42, 0.55);
  vec3 col = u_accent * a * 0.55 + deep * b * 0.9 + mix(u_accent, vec3(1.0), 0.55) * h * 0.65;
  float stripe = 0.5 + 0.5 * sin((p.x + p.y * 0.35) / s * 9.0 + t * 0.8);
  col *= 0.86 + 0.14 * stripe;
  return col * u_intensity;
}
`;

const SD_ROUND = `
float sdRound(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - half_ + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
`;

export const shaders = {
  /** Soft moving accent light. Uniforms: u_t, u_accent [r,g,b 0..1], u_center [x,y css px], u_size px, u_intensity. */
  lightField: `${LIGHT}
uniform float u_seed;
void main() {
  vec3 col = field(css(gl_FragCoord.xy));
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  outColor = dithered(vec4(col, a), u_t);
}`,
  /** Light field plus one glass slab: refraction, frost and bevel. Extra uniforms: u_rect [x,y,w,h css px], u_radius, u_glass 0..1. */
  glass: `${LIGHT}${SD_ROUND}
uniform vec4 u_rect;
uniform float u_radius;
uniform float u_glass;
void main() {
  vec2 p = css(gl_FragCoord.xy);
  vec3 bg = field(p);
  vec2 half_ = u_rect.zw * 0.5;
  vec2 c = u_rect.xy + half_;
  float sd = sdRound(p - c, half_, u_radius);
  vec3 col = bg;
  float alpha = clamp(max(bg.r, max(bg.g, bg.b)), 0.0, 1.0);
  if (u_glass > 0.001 && sd < 1.5) {
    float e = 1.0;
    vec2 n = normalize(vec2(
      sdRound(p - c + vec2(e, 0.0), half_, u_radius) - sdRound(p - c - vec2(e, 0.0), half_, u_radius),
      sdRound(p - c + vec2(0.0, e), half_, u_radius) - sdRound(p - c - vec2(0.0, e), half_, u_radius)) + 1e-5);
    float d = max(-sd, 0.0);
    float bevel = 1.0 - smoothstep(0.0, 26.0, d);
    vec2 q = c + (p - c) * 0.9 - n * bevel * bevel * 38.0;
    vec3 frost = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      float r = sqrt((fi + 0.5) / 16.0) * 34.0;
      float a = fi * 2.39996;
      frost += field(q + r * vec2(cos(a), sin(a)));
    }
    frost /= 16.0;
    vec3 tint = vec3(0.035, 0.038, 0.045) + u_accent * 0.015;
    vec3 inside = frost * 0.78 + tint;
    float lightDir = dot(n, normalize(vec2(-0.55, -1.0)));
    float rim = (1.0 - smoothstep(0.0, 1.6, d)) * (0.26 + 0.5 * max(lightDir, 0.0));
    float innerGlow = (1.0 - smoothstep(0.0, 10.0, d)) * 0.05;
    inside += vec3(rim + innerGlow);
    float sheen = smoothstep(0.0, 1.0, 1.0 - (p.y - u_rect.y) / u_rect.w * 1.6) * 0.035;
    inside += vec3(sheen);
    float cover = (1.0 - smoothstep(-0.5, 1.0, sd)) * u_glass;
    col = mix(col, inside, cover);
    alpha = mix(alpha, 0.92, cover);
  }
  outColor = dithered(vec4(col, alpha), u_t);
}`,
  /** Monochrome film grain for an overlay layer. Uniforms: u_t, u_amount. */
  grain: `
uniform float u_t;
uniform float u_amount;
void main() {
  float n = hash12(floor(gl_FragCoord.xy) + floor(u_t * 60.0) * 13.17) - 0.5;
  outColor = vec4(vec3(0.5 + n * u_amount), 1.0);
}`,
};

/** "#17ffa6" → [r, g, b] in 0..1 for shader uniforms. */
export const rgb = (hex) => [0, 1, 2].map((i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255);
