
import React, { useEffect, useRef, useState } from 'react';
import * as THREE_LIB from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Fragment, FragmentType, Sentiment } from '../types';
import { COLORS, GALAXY_CONFIG } from '../constants';

const THREE = THREE_LIB;

interface StardustSphereProps {
  fragments: Fragment[];
  onSelectFragment: (f: Fragment | null) => void;
  selectedFragment?: Fragment | null;
  activeGalaxyIndex: number;
  newStarId?: string | null; 
}

const StardustSphere: React.FC<StardustSphereProps> = ({ 
  fragments, 
  onSelectFragment, 
  selectedFragment, 
  activeGalaxyIndex,
  newStarId 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE_LIB.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE_LIB.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<THREE_LIB.Points | null>(null);
  const galaxyGroupsRef = useRef<THREE_LIB.Group[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const pulseRef = useRef<THREE_LIB.Mesh | null>(null);
  const currentAnimationIdRef = useRef<number>(0);
  const isSequencingRef = useRef<boolean>(false);
  
  const trailRef = useRef<THREE_LIB.Points | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00002); 
    
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 50000);
    const initCfg = GALAXY_CONFIG[activeGalaxyIndex] || GALAXY_CONFIG[0];
    camera.position.set(initCfg.cameraOffset[0], initCfg.cameraOffset[1], initCfg.cameraOffset[2]);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.035;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.03; 
    controls.maxDistance = 25000;
    controlsRef.current = controls;

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // 初始化轨迹 - 视觉优化版
    const trailCount = 600; 
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    const trailProg = new Float32Array(trailCount);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('lineProgress', new THREE.BufferAttribute(trailProg, 1));

    const trailMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 0 },
        uHeadProgress: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float lineProgress;
        varying float vProgress;
        uniform float uHeadProgress;
        uniform float uPixelRatio;
        void main() {
          vProgress = lineProgress;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float distToHead = uHeadProgress - lineProgress;
          // 减小尺寸，增加平滑度
          float sizeScale = smoothstep(0.4, 0.0, distToHead) * step(0.0, distToHead);
          gl_PointSize = (8.0 + 22.0 * sizeScale) * uPixelRatio * (2200.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vProgress;
        uniform float uHeadProgress;
        uniform float uOpacity;
        uniform vec3 uColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float distToHead = uHeadProgress - vProgress;
          if (distToHead < 0.0 || distToHead > 0.45) discard; 
          
          float tailFade = 1.0 - (distToHead / 0.45);
          // 强化核心，减弱散射，使其更像一束凝聚的能量
          float core = exp(-d * 12.0);
          float glow = exp(-d * 4.5) * 0.3;
          gl_FragColor = vec4(uColor, uOpacity * tailFade * (core + glow));
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);
    trailRef.current = trailPoints;

    const pulseGeo = new THREE.RingGeometry(1, 1.05, 64);
    const pulseMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.visible = false;
    scene.add(pulse);
    pulseRef.current = pulse;

    const noiseSnippet = `
      vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
        vec4 x_ = floor(j * (1.0 / 7.0));
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ * (1.0 / 7.0) + 0.5/7.0;
        vec4 y = y_ * (1.0 / 7.0) + 0.5/7.0;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
    `;

    const wrapCount = 12000; 
    const wrapGeo = new THREE.BufferGeometry();
    const wrapPos = new Float32Array(wrapCount * 3);
    const wrapCol = new Float32Array(wrapCount * 3);
    for(let i=0; i<wrapCount; i++) {
      const r = Math.random() * 15000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      wrapPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      wrapPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      wrapPos[i*3+2] = r * Math.cos(phi);
      const c = new THREE.Color(COLORS.STARDUST.DEEP_BLUE).lerp(new THREE.Color(COLORS.STARDUST.CYAN_WHITE), Math.random() * 0.2);
      wrapCol[i*3] = c.r * 0.12; wrapCol[i*3+1] = c.g * 0.12; wrapCol[i*3+2] = c.b * 0.12;
    }
    wrapGeo.setAttribute('position', new THREE.BufferAttribute(wrapPos, 3));
    wrapGeo.setAttribute('color', new THREE.BufferAttribute(wrapCol, 3));
    const globalCloud = new THREE.Points(wrapGeo, new THREE.PointsMaterial({
      size: 1.5, vertexColors: true, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(globalCloud);

    galaxyGroupsRef.current = [];
    GALAXY_CONFIG.forEach((cfg) => {
      const group = new THREE.Group();
      group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      const shellMat = new THREE.ShaderMaterial({
        uniforms: { 
          time: { value: 0 }, 
          color: { value: new THREE.Color(cfg.shellColor) },
          uCameraDistance: { value: 3000 },
          uSelectedPos: { value: new THREE.Vector3(0,0,0) },
          uResonanceAlpha: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vLocalPos;
          void main() {
            vLocalPos = position;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vLocalPos;
          uniform float time;
          uniform vec3 color;
          uniform float uCameraDistance;
          uniform vec3 uSelectedPos;
          uniform float uResonanceAlpha;
          ${noiseSnippet}
          void main() {
            float rawDistFade = smoothstep(25000.0, 1500.0, uCameraDistance);
            float distFade = 0.4 + 0.6 * rawDistFade;
            float dotNV = max(dot(vNormal, vViewDir), 0.0);
            float fresnelRaw = pow(1.0 - dotNV, 1.3);
            float fresnel = 0.2 + 0.8 * fresnelRaw;
            float noise = snoise(vLocalPos * 0.02 + time * 0.3);
            float ripple = 0.0;
            if(uResonanceAlpha > 0.01) {
               float distToHit = distance(vLocalPos, uSelectedPos);
               ripple = exp(-pow(distToHit - mod(time * 250.0, 700.0), 2.0) / 1200.0) * uResonanceAlpha;
            }
            float alpha = (fresnel * (0.8 + 0.2 * noise) + ripple * 1.0) * distFade;
            gl_FragColor = vec4(color + ripple * 0.7, max(alpha, 0.25));
          }
        `,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(140, 64, 64), shellMat);
      group.add(shell);
      scene.add(group);
      galaxyGroupsRef.current.push(group);
    });

    const count = fragments.length;
    const fragGeo = new THREE.BufferGeometry();
    const fragPos = new Float32Array(count * 3);
    const fragCol = new Float32Array(count * 3);
    const fragSize = new Float32Array(count);
    const fragNewness = new Float32Array(count); 

    fragments.forEach((f, i) => {
      const gOffset = GALAXY_CONFIG[f.galaxyIndex].pos;
      fragPos[i*3] = f.position[0] + gOffset[0];
      fragPos[i*3+1] = f.position[1] + gOffset[1];
      fragPos[i*3+2] = f.position[2] + gOffset[2];
      const c = new THREE.Color(COLORS.SENTIMENT[f.sentiment]);
      fragCol[i*3] = c.r; fragCol[i*3+1] = c.g; fragCol[i*3+2] = c.b;
      fragSize[i] = f.type === FragmentType.BOKEH ? 110 : (f.isUser ? 32 : 16);
      fragNewness[i] = f.id === newStarId ? 1.0 : 0.0;
    });

    fragGeo.setAttribute('position', new THREE.BufferAttribute(fragPos, 3));
    fragGeo.setAttribute('color', new THREE.BufferAttribute(fragCol, 3));
    fragGeo.setAttribute('size', new THREE.BufferAttribute(fragSize, 1));
    fragGeo.setAttribute('newness', new THREE.BufferAttribute(fragNewness, 1));

    const fragMat = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0 }, 
        uPixelRatio: { value: renderer.getPixelRatio() }, 
        uHoveredIndex: { value: -1.0 } 
      },
      vertexShader: `
        attribute float size; attribute vec3 color; attribute float newness;
        varying vec3 vColor; varying float vAlpha; varying float vNewness; varying float vIsHovered;
        uniform float time; uniform float uPixelRatio; uniform float uHoveredIndex;
        void main() {
          vColor = color; vNewness = newness;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vAlpha = smoothstep(30000.0, 50.0, -mvPos.z);
          float s = size;
          vIsHovered = 0.0;
          if (uHoveredIndex >= 0.0 && abs(float(gl_VertexID) - uHoveredIndex) < 0.1) {
            s *= (2.0 + 0.2 * sin(time * 10.0)); 
            vIsHovered = 1.0;
          }
          if(newness > 0.5) s *= (1.6 + 0.4 * sin(time * 3.5));
          float breathing = 1.0 + 0.1 * sin(time * 1.8 + float(gl_VertexID));
          gl_PointSize = s * breathing * uPixelRatio * (2800.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor; varying float vAlpha; varying float vNewness; varying float vIsHovered;
        uniform float time;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float strength = exp(-d * 8.0);
          float glow = exp(-d * 4.5) * 0.22;
          vec3 finalColor = vColor;
          float finalAlpha = vAlpha * (strength + glow);
          if(vIsHovered > 0.5) {
             finalColor += 0.2; 
             finalAlpha *= 1.3;
          }
          if(vNewness > 0.5) {
             finalAlpha *= (1.1 + 0.2 * sin(time * 4.5));
          }
          gl_FragColor = vec4(finalColor * strength * 1.2, finalAlpha);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const fragPoints = new THREE.Points(fragGeo, fragMat);
    scene.add(fragPoints);
    pointsRef.current = fragPoints;

    const animate = (time: number) => {
      const t = time * 0.001;
      frameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      fragMat.uniforms.time.value = t;
      globalCloud.rotation.y = t * 0.008;
      if (pulseRef.current && pulseRef.current.visible) {
         pulseRef.current.scale.addScalar(0.18); 
         const m = pulseRef.current.material as THREE_LIB.MeshBasicMaterial;
         m.opacity *= 0.94; 
         if (m.opacity < 0.002) pulseRef.current.visible = false;
      }
      if (trailRef.current && trailRef.current.material instanceof THREE.ShaderMaterial) {
        trailRef.current.material.uniforms.time.value = t;
      }
      galaxyGroupsRef.current.forEach((group, idx) => {
        const shell = group.children[0] as THREE_LIB.Mesh;
        if (shell.material instanceof THREE.ShaderMaterial) {
          shell.material.uniforms.time.value = t;
          shell.material.uniforms.uCameraDistance.value = camera.position.distanceTo(group.position);
          if (selectedFragment && selectedFragment.galaxyIndex === idx) {
             shell.material.uniforms.uSelectedPos.value.set(selectedFragment.position[0], selectedFragment.position[1], selectedFragment.position[2]);
             shell.material.uniforms.uResonanceAlpha.value = THREE.MathUtils.lerp(shell.material.uniforms.uResonanceAlpha.value, 0.6, 0.06);
          } else {
             shell.material.uniforms.uResonanceAlpha.value = THREE.MathUtils.lerp(shell.material.uniforms.uResonanceAlpha.value, 0.0, 0.06);
          }
        }
      });
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(scene, cameraRef.current);
      }
    };
    animate(0);

    const handleMouseMove = (e: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      raycaster.params.Points.threshold = 14;
      const intersects = raycaster.intersectObject(fragPoints);
      if (intersects.length > 0) {
        setHoveredIndex(intersects[0].index!);
        fragMat.uniforms.uHoveredIndex.value = intersects[0].index!;
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredIndex(null);
        fragMat.uniforms.uHoveredIndex.value = -1;
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (hoveredIndex !== null) {
        const selected = fragments[hoveredIndex];
        if (pulseRef.current) {
          const gOffset = GALAXY_CONFIG[selected.galaxyIndex].pos;
          const worldPos = new THREE.Vector3(
            selected.position[0] + gOffset[0],
            selected.position[1] + gOffset[1],
            selected.position[2] + gOffset[2]
          );
          pulseRef.current.position.copy(worldPos);
          pulseRef.current.lookAt(cameraRef.current!.position);
          pulseRef.current.scale.set(0.1, 0.1, 0.1);
          const m = pulseRef.current.material as THREE_LIB.MeshBasicMaterial;
          m.opacity = 0.25; 
          m.color.set(COLORS.SENTIMENT[selected.sentiment]);
          pulseRef.current.visible = true;
        }
        onSelectFragment(selected);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [fragments, selectedFragment, newStarId]);

  // 穿梭时空逻辑 - 优化 FOV 与 轨迹感
  useEffect(() => {
    if (!newStarId || !cameraRef.current || !controlsRef.current || !trailRef.current) return;
    
    const newFragment = fragments.find(f => f.id === newStarId);
    if (!newFragment) return;

    const animationId = ++currentAnimationIdRef.current;
    isSequencingRef.current = true;
    controlsRef.current.enabled = false;

    const gOffset = GALAXY_CONFIG[newFragment.galaxyIndex].pos;
    const worldTarget = new THREE.Vector3(
      newFragment.position[0] + gOffset[0],
      newFragment.position[1] + gOffset[1],
      newFragment.position[2] + gOffset[2]
    );

    const startPos = cameraRef.current.position.clone();
    // 轨迹起始点略微偏移，不直接从中心射出
    const forward = new THREE.Vector3(-15, -10, -80).applyQuaternion(cameraRef.current.quaternion);
    const lineStart = startPos.clone().add(forward);
    
    const midPoint = new THREE.Vector3().lerpVectors(lineStart, worldTarget, 0.5);
    midPoint.y += 1200; // 增加弧度
    midPoint.x += (Math.random() - 0.5) * 2000;

    const curve = new THREE.QuadraticBezierCurve3(lineStart, midPoint, worldTarget);
    const trailGeo = trailRef.current.geometry;
    const trailPositions = trailGeo.attributes.position.array as Float32Array;
    const trailProgresses = trailGeo.attributes.lineProgress.array as Float32Array;

    const count = trailProgresses.length;
    for (let i = 0; i < count; i++) {
      const p = i / (count - 1);
      const point = curve.getPoint(p);
      trailPositions[i * 3] = point.x;
      trailPositions[i * 3 + 1] = point.y;
      trailPositions[i * 3 + 2] = point.z;
      trailProgresses[i] = p;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.lineProgress.needsUpdate = true;

    const trailMat = trailRef.current.material as THREE_LIB.ShaderMaterial;
    trailMat.uniforms.uColor.value.set(COLORS.SENTIMENT[newFragment.sentiment]);
    trailMat.uniforms.uOpacity.value = 1.0;
    trailMat.uniforms.uHeadProgress.value = 0;

    const galaxyCfg = GALAXY_CONFIG[newFragment.galaxyIndex];
    const orbitPos = new THREE.Vector3(galaxyCfg.cameraOffset[0], galaxyCfg.cameraOffset[1], galaxyCfg.cameraOffset[2]);
    const orbitTarget = new THREE.Vector3(galaxyCfg.pos[0], galaxyCfg.pos[1], galaxyCfg.pos[2]);
    const focusPos = worldTarget.clone().add(new THREE.Vector3(180, 100, 320)); 
    const startLookAt = controlsRef.current.target.clone();
    const startFOV = 42;

    const p1End = 2400;  
    const p2End = 3000;  
    const p3End = 4200;  
    const p4End = 7200;  
    const startTime = performance.now();

    const sequence = (now: number) => {
      if (animationId !== currentAnimationIdRef.current) return;
      const elapsed = now - startTime;

      if (elapsed < p1End) {
        const p = elapsed / p1End;
        const ease = 1 - Math.pow(1 - p, 4);
        trailMat.uniforms.uHeadProgress.value = Math.min(p * 1.5, 1.45); 
        if (cameraRef.current) {
          // 限制最大 FOV 为 58，避免拉伸感过强
          const fovTarget = 58;
          cameraRef.current.fov = THREE.MathUtils.lerp(startFOV, fovTarget, Math.sin(p * Math.PI));
        }
        cameraRef.current?.position.lerpVectors(startPos, focusPos, ease);
        controlsRef.current?.target.lerpVectors(startLookAt, worldTarget, ease);

        if (p > 0.88 && pulseRef.current && !pulseRef.current.visible) {
          pulseRef.current.position.copy(worldTarget);
          pulseRef.current.lookAt(cameraRef.current!.position);
          pulseRef.current.scale.set(0.25, 0.25, 0.25);
          (pulseRef.current.material as THREE_LIB.MeshBasicMaterial).opacity = 0.1;
          (pulseRef.current.material as THREE_LIB.MeshBasicMaterial).color.set(COLORS.SENTIMENT[newFragment.sentiment]);
          pulseRef.current.visible = true;
        }
      } else if (elapsed < p2End) {
        const p = (elapsed - p1End) / (p2End - p1End);
        if (cameraRef.current) cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 42, 0.08);
        cameraRef.current?.position.lerp(focusPos, 0.08);
        controlsRef.current?.target.lerp(worldTarget, 0.08);
        trailMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(trailMat.uniforms.uOpacity.value, 0, 0.1);
      } else if (elapsed < p3End) {
        const p = (elapsed - p2End) / (p3End - p2End);
        const drift = new THREE.Vector3(Math.cos(p * 4.0) * 4, Math.sin(p * 2.5) * 3, 0);
        cameraRef.current?.position.copy(focusPos.clone().add(drift));
        trailMat.uniforms.uOpacity.value = 0;
      } else if (elapsed < p4End) {
        const p = (elapsed - p3End) / (p4End - p3End);
        const ease = 1 - Math.pow(1 - p, 3);
        cameraRef.current?.position.lerpVectors(focusPos, orbitPos, ease);
        controlsRef.current?.target.lerpVectors(worldTarget, orbitTarget, ease);
        if (cameraRef.current) {
           cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 42, 0.05);
        }
      } else {
        cameraRef.current?.position.copy(orbitPos);
        controlsRef.current?.target.copy(orbitTarget);
        if (cameraRef.current) {
          cameraRef.current.fov = 42;
          cameraRef.current.updateProjectionMatrix();
        }
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
        isSequencingRef.current = false;
        return;
      }
      
      cameraRef.current?.updateProjectionMatrix();
      controlsRef.current?.update();
      requestAnimationFrame(sequence);
    };
    requestAnimationFrame(sequence);
  }, [newStarId, fragments]);

  // 轨道切换逻辑保持不变
  useEffect(() => {
    if (newStarId || isSequencingRef.current || !cameraRef.current || !controlsRef.current) return;
    
    const animationId = ++currentAnimationIdRef.current;
    const targetCfg = GALAXY_CONFIG[activeGalaxyIndex];
    const targetPos = new THREE.Vector3(targetCfg.cameraOffset[0], targetCfg.cameraOffset[1], targetCfg.cameraOffset[2]);
    const targetLookAt = new THREE.Vector3(targetCfg.pos[0], targetCfg.pos[1], targetCfg.pos[2]);
    
    if (cameraRef.current.position.distanceTo(targetPos) < 1.0) return;

    const startPos = cameraRef.current.position.clone();
    const startLookAt = controlsRef.current.target.clone();
    const duration = 1800;
    const startTime = performance.now();
    
    const updateCamera = (now: number) => {
      if (animationId !== currentAnimationIdRef.current || newStarId || isSequencingRef.current) return;
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      cameraRef.current?.position.lerpVectors(startPos, targetPos, ease);
      controlsRef.current?.target.lerpVectors(startLookAt, targetLookAt, ease);
      controlsRef.current?.update();
      if (p < 1) requestAnimationFrame(updateCamera);
    };
    requestAnimationFrame(updateCamera);
  }, [activeGalaxyIndex, newStarId]);

  return <div ref={mountRef} className="w-full h-full absolute inset-0" />;
};

export default StardustSphere;
