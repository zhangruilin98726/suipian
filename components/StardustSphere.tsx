
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE_LIB from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Fragment, FragmentType } from '../types';
import { COLORS } from '../constants';

const THREE = THREE_LIB;

interface StardustSphereProps {
  fragments: Fragment[];
  onSelectFragment: (f: Fragment) => void;
  selectedFragment?: Fragment | null;
}

const StardustSphere: React.FC<StardustSphereProps> = ({ fragments, onSelectFragment, selectedFragment }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<THREE_LIB.Points | null>(null);
  const lineRef = useRef<THREE_LIB.LineSegments | null>(null);
  const nebulaRef = useRef<THREE_LIB.Group | null>(null);
  const coreRef = useRef<THREE_LIB.Group | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const resonantIndices = useMemo(() => {
    if (!selectedFragment) return [];
    return fragments
      .map((f, i) => {
        const isResonant = f.id !== selectedFragment.id && 
          (f.sentiment === selectedFragment.sentiment || f.tags.some(t => selectedFragment.tags.includes(t)));
        return isResonant ? i : -1;
      })
      .filter(i => i !== -1)
      .slice(0, 20);
  }, [selectedFragment, fragments]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 1, 5000);
    camera.position.set(0, 0, 1600);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- 1. 进化版引力核心 (The Celestial Core) ---
    const coreGroup = new THREE.Group();
    
    // 核心等离子球体
    const coreInternalMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorA: { value: new THREE.Color(COLORS.STARDUST.DEEP_BLUE) },
        colorB: { value: new THREE.Color(COLORS.STARDUST.CYAN_WHITE) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;

        float noise(vec2 p) {
          return sin(p.x * 10.0 + time) * sin(p.y * 10.0 - time);
        }

        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
          float n = noise(vUv * 2.0);
          vec3 baseColor = mix(colorA, colorB, vUv.y + n * 0.2);
          float alpha = fresnel * 0.8 + 0.2;
          gl_FragColor = vec4(baseColor * (1.0 + fresnel * 2.0), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 64), coreInternalMat);
    coreGroup.add(coreMesh);

    // 引力光环 (Accretion Disk)
    const ringGeo = new THREE.RingGeometry(90, 140, 128);
    const ringMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        void main() {
          float dist = length(vUv - 0.5);
          float alpha = smoothstep(0.5, 0.45, dist) * smoothstep(0.2, 0.3, dist);
          float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
          alpha *= (0.3 + 0.2 * sin(vUv.x * 50.0 + time)) * grain;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    coreGroup.add(ring);

    // --- 调优后的 Halo (Deep Atmospheric Veil) ---
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying float vOpacity;
        varying vec3 vNormal;
        uniform float time;
        
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(vec3 x) {
          vec3 p = floor(x);
          vec3 f = fract(x);
          f = f*f*(3.0-2.0*f);
          float n = p.x + p.y*57.0 + 113.0*p.z;
          return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                         mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                     mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                         mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          
          // 减小扰动幅度 (15.0 -> 8.0)，让波动更丝滑
          float n = noise(position * 0.04 + time * 0.15);
          vec3 pos = position + normal * n * 8.0; 
          
          // 增加 pow 指数 (2.5 -> 3.0)，让光晕更向外围收缩，核心区域更干净
          vOpacity = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying vec3 vNormal;
        uniform float time;
        void main() {
          // 变慢呼吸频率 (0.6 -> 0.3)，让动态更优雅
          float pulse = pow(0.5 + 0.5 * sin(time * 0.3), 3.0);
          
          // 调暗颜色：主要保留深蓝和墨色，极大幅度压低亮白权重 (0.4 -> 0.15)
          vec3 glowColor = mix(vec3(0.02, 0.08, 0.15), vec3(0.1, 0.25, 0.4), vOpacity * 0.15);
          
          // 极大幅度降低透明度上限 (0.12 -> 0.05)，使其呈现为“若有若无”的薄纱
          float finalAlpha = vOpacity * (0.02 + 0.05 * pulse);
          
          gl_FragColor = vec4(glowColor, finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(180, 64, 64), haloMat);
    coreGroup.add(halo);

    scene.add(coreGroup);
    coreRef.current = coreGroup;

    // --- 2. 星云图层 ---
    const nebulaGroup = new THREE.Group();
    const nebulaCount = 5;
    for (let i = 0; i < nebulaCount; i++) {
      const nebulaMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(Object.values(COLORS.SENTIMENT)[i % 5]) },
          opacity: { value: 0.025 } // 微调降低星云亮度
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          void main() {
            float dist = length(vUv - 0.5);
            float alpha = smoothstep(0.5, 0.0, dist) * opacity;
            alpha *= (0.6 + 0.4 * sin(time * 0.08 + vUv.x * 6.0 + vUv.y * 3.0));
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), nebulaMat);
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const r = 250 + Math.random() * 200;
      cloud.position.set(r * Math.sin(angle2) * Math.cos(angle1), r * Math.sin(angle2) * Math.sin(angle1), r * Math.cos(angle2));
      cloud.lookAt(0, 0, 0);
      nebulaGroup.add(cloud);
    }
    scene.add(nebulaGroup);
    nebulaRef.current = nebulaGroup;

    // --- 3. 粒子星辰 ---
    const count = fragments.length;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const vTypes = new Float32Array(count); 

    fragments.forEach((f, i) => {
      positions[i*3] = f.position[0];
      positions[i*3+1] = f.position[1];
      positions[i*3+2] = f.position[2];
      const c = new THREE.Color(f.isUser ? COLORS.SENTIMENT[f.sentiment] : COLORS.STARDUST.CYAN_WHITE);
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
      if (f.type === FragmentType.DUST) { sizes[i] = 4.0; vTypes[i] = 0.0; } 
      else if (f.type === FragmentType.BOKEH) { sizes[i] = 160.0; vTypes[i] = 2.0; } 
      else { sizes[i] = f.isUser ? 24.0 : 12.0; vTypes[i] = 1.0; }
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('vType', new THREE.BufferAttribute(vTypes, 1));
    geo.setAttribute('highlight', new THREE.BufferAttribute(new Float32Array(count), 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uHoveredIndex: { value: -1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute float vType;
        attribute float highlight;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vHigh;
        uniform float time;
        uniform float uPixelRatio;
        uniform float uHoveredIndex;
        void main() {
          vColor = color;
          vHigh = highlight;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);
          vAlpha = smoothstep(3000.0, 1600.0, dist) * smoothstep(20.0, 450.0, dist);
          float finalSize = size;
          if (highlight > 0.5) finalSize *= 2.2;
          if (uHoveredIndex >= 0.0 && abs(float(gl_VertexID) - uHoveredIndex) < 0.1) finalSize *= 2.5;
          gl_PointSize = finalSize * uPixelRatio * (2400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vHigh;
        uniform float time;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float strength = exp(-d * (vHigh > 0.5 ? 8.0 : 18.0));
          if (strength < 0.01) discard;
          float pulse = 0.85 + 0.15 * sin(time * 0.7 + vHigh * 5.0);
          gl_FragColor = vec4(vColor * strength * pulse, vAlpha * strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    pointsRef.current = points;

    // --- 4. 共鸣织网 ---
    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);
    lineRef.current = lines;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.params.Points.threshold = 12;
      const intersects = raycaster.intersectObject(points);
      if (intersects.length > 0) {
        setHoveredIndex(intersects[0].index!);
        mat.uniforms.uHoveredIndex.value = intersects[0].index!;
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredIndex(null);
        mat.uniforms.uHoveredIndex.value = -1;
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = () => {
      if (hoveredIndex !== null) onSelectFragment(fragments[hoveredIndex]);
      else onSelectFragment(null as any);
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    const animate = (t: number) => {
      requestAnimationFrame(animate);
      const time = t * 0.001;
      mat.uniforms.time.value = time;
      
      if (nebulaRef.current) {
        nebulaRef.current.children.forEach((c: any, i) => {
          c.material.uniforms.time.value = time;
          c.rotation.z = time * 0.03 * (i % 2 === 0 ? 1 : -1);
        });
        nebulaRef.current.rotation.y = time * 0.015;
      }
      
      if (coreRef.current) {
        const c = coreRef.current;
        c.rotation.y = -time * 0.2;
        (c.children[0] as any).material.uniforms.time.value = time;
        (c.children[1] as any).material.uniforms.time.value = time;
        (c.children[2] as any).material.uniforms.time.value = time;
        c.children[1].rotation.z = Math.sin(time * 0.2) * 0.1;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      camera.aspect = mountRef.current!.clientWidth / mountRef.current!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [fragments]);

  useEffect(() => {
    if (!pointsRef.current || !lineRef.current) return;
    const hAttr = pointsRef.current.geometry.getAttribute('highlight') as THREE_LIB.BufferAttribute;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE_LIB.BufferAttribute;
    for (let i = 0; i < hAttr.count; i++) hAttr.setX(i, 0);
    if (selectedFragment) {
      const idx = fragments.findIndex(f => f.id === selectedFragment.id);
      if (idx !== -1) {
        hAttr.setX(idx, 2.0);
        const linePos = [];
        const sx = posAttr.getX(idx), sy = posAttr.getY(idx), sz = posAttr.getZ(idx);
        resonantIndices.forEach(ri => {
          hAttr.setX(ri, 1.5);
          linePos.push(sx, sy, sz, posAttr.getX(ri), posAttr.getY(ri), posAttr.getZ(ri));
        });
        lineRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        (lineRef.current.material as THREE_LIB.LineBasicMaterial).opacity = 0.5;
        (lineRef.current.material as THREE_LIB.LineBasicMaterial).color.set(COLORS.SENTIMENT[selectedFragment.sentiment]);
      }
    } else {
      (lineRef.current.material as THREE_LIB.LineBasicMaterial).opacity = 0;
    }
    hAttr.needsUpdate = true;
  }, [selectedFragment, resonantIndices, fragments]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default StardustSphere;
