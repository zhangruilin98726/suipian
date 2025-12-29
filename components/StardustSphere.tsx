
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE_LIB from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Fragment, FragmentType, Sentiment } from '../types';
import { COLORS } from '../constants';

const THREE = THREE_LIB;

interface StardustSphereProps {
  fragments: Fragment[];
  onSelectFragment: (f: Fragment | null) => void;
  selectedFragment?: Fragment | null;
}

const StardustSphere: React.FC<StardustSphereProps> = ({ fragments, onSelectFragment, selectedFragment }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE_LIB.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE_LIB.PerspectiveCamera | null>(null);
  const pointsRef = useRef<THREE_LIB.Points | null>(null);
  const lineRef = useRef<THREE_LIB.LineSegments | null>(null);
  const nebulaLayersRef = useRef<THREE_LIB.Group[]>([]);
  const coreRef = useRef<THREE_LIB.Group | null>(null);
  const diskRef = useRef<THREE_LIB.Mesh | null>(null);
  const frameIdRef = useRef<number | null>(null);
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
      .slice(0, 15);
  }, [selectedFragment, fragments]);

  useEffect(() => {
    if (!mountRef.current) return;

    nebulaLayersRef.current = [];
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 10000);
    camera.position.set(0, 0, 1600);
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

    const coreGroup = new THREE.Group();
    
    // --- 1. Enhanced "Living Star" Core ---
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorA: { value: new THREE.Color('#020617') },
        colorB: { value: new THREE.Color('#1e3a8a') },
        colorC: { value: new THREE.Color(COLORS.STARDUST.CYAN_WHITE) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float time;
        void main() {
          vUv = uv;
          float pulse = 1.0 + 0.02 * sin(time * 0.8);
          vec3 pos = position * pulse;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform vec3 colorC;
        void main() {
          vec3 normal = normalize(vNormal);
          float fresnel = pow(1.0 - dot(normal, vec3(0,0,1)), 3.0);
          float noise = sin(vUv.x * 20.0 + time * 0.5) * cos(vUv.y * 15.0 - time * 0.3);
          vec3 plasma = mix(colorA, colorB, 0.5 + 0.4 * noise);
          vec3 finalColor = mix(plasma, colorC, fresnel * 0.8);
          gl_FragColor = vec4(finalColor, 0.98);
        }
      `,
      transparent: true,
    });

    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(70, 64, 64), coreMat);
    coreGroup.add(coreMesh);

    // --- 2. Dust Accretion Disk ---
    const diskMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(COLORS.STARDUST.CYAN_WHITE) }
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
        void main() {
          float dist = length(vUv - 0.5);
          float disc = smoothstep(0.5, 0.35, dist) * smoothstep(0.18, 0.25, dist);
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float spiral = sin(angle * 3.0 - time * 1.5 + dist * 50.0);
          float alpha = disc * (0.15 + 0.08 * spiral);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const disk = new THREE.Mesh(new THREE.PlaneGeometry(380, 380), diskMat);
    disk.rotation.x = Math.PI / 2.1;
    coreGroup.add(disk);
    diskRef.current = disk;

    scene.add(coreGroup);
    coreRef.current = coreGroup;

    // --- 3. Subdued Nebulas ---
    const nebulaConfigs = [
      { color: '#020617', speed: 0.0003, opacity: 0.02, radius: 550 },
      { color: '#0f172a', speed: -0.0002, opacity: 0.015, radius: 800 }
    ];

    nebulaConfigs.forEach(cfg => {
      const group = new THREE.Group();
      for (let i = 0; i < 12; i++) {
        const mat = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, color: { value: new THREE.Color(cfg.color) }, opacity: { value: cfg.opacity } },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            varying vec2 vUv; uniform float time; uniform vec3 color; uniform float opacity;
            void main() {
              float d = length(vUv - 0.5);
              float alpha = smoothstep(0.5, 0.0, d) * opacity;
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), mat);
        const a1 = Math.random() * Math.PI * 2;
        const a2 = Math.random() * Math.PI;
        mesh.position.set(cfg.radius * Math.sin(a2) * Math.cos(a1), cfg.radius * Math.sin(a2) * Math.sin(a1), cfg.radius * Math.cos(a2));
        mesh.lookAt(0, 0, 0);
        group.add(mesh);
      }
      scene.add(group);
      nebulaLayersRef.current.push(group);
    });

    // --- 4. Enhanced Stardust Points ---
    const count = fragments.length;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const highlights = new Float32Array(count);
    const sTypes = new Float32Array(count);

    const sentimentMap: Record<Sentiment, number> = {
      [Sentiment.HAPPY]: 0,
      [Sentiment.CALM]: 1,
      [Sentiment.ANXIOUS]: 2,
      [Sentiment.SAD]: 3,
      [Sentiment.ANGRY]: 4,
    };

    fragments.forEach((f, i) => {
      pos[i*3] = f.position[0];
      pos[i*3+1] = f.position[1];
      pos[i*3+2] = f.position[2];
      
      // RICH COLOR LOGIC: 
      // Non-user fragments also get their sentiment color to create a rich, varied galaxy.
      const baseColor = new THREE.Color(COLORS.SENTIMENT[f.sentiment]);
      // Add subtle variation to each individual star for "richness"
      const variation = (Math.random() - 0.5) * 0.15;
      col[i*3] = Math.min(1.0, baseColor.r + variation);
      col[i*3+1] = Math.min(1.0, baseColor.g + variation);
      col[i*3+2] = Math.min(1.0, baseColor.b + variation);
      
      sizes[i] = f.type === FragmentType.BOKEH ? 110.0 : (f.isUser ? 38.0 : (10.0 + Math.random() * 8.0));
      sTypes[i] = sentimentMap[f.sentiment];
    });

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('highlight', new THREE.BufferAttribute(highlights, 1));
    geo.setAttribute('sType', new THREE.BufferAttribute(sTypes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uHoveredIndex: { value: -1.0 }
      },
      vertexShader: `
        attribute float size; attribute float highlight; attribute vec3 color; attribute float sType;
        varying vec3 vColor; varying float vAlpha; varying float vHigh; varying float vType;
        uniform float time; uniform float uPixelRatio; uniform float uHoveredIndex;
        void main() {
          vColor = color; vHigh = highlight; vType = sType;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float d = length(mvPos.xyz);
          vAlpha = smoothstep(4500.0, 1000.0, d) * smoothstep(50.0, 600.0, d);
          float fSize = size;
          
          if (highlight > 0.5) fSize *= (1.6 + 0.3 * sin(time * 3.0));
          if (uHoveredIndex >= 0.0 && abs(float(gl_VertexID) - uHoveredIndex) < 0.1) fSize *= 2.2;
          
          gl_PointSize = fSize * uPixelRatio * (1800.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor; varying float vAlpha; varying float vHigh; varying float vType;
        uniform float time;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          
          float p = 0.0;
          if(vType < 0.5) p = 0.5 + 0.5 * sin(time * 1.5 + vType); // HAPPY: Slow Glow
          else if(vType < 1.5) p = 0.8 + 0.1 * sin(time * 0.5); // CALM: Steady
          else if(vType < 2.5) p = 0.5 + 0.5 * sin(time * 12.0); // ANXIOUS: Rapid shimmer
          else if(vType < 3.5) p = 0.2 + 0.5 * abs(sin(time * 0.8)); // SAD: Fading light
          else p = 0.5 + 0.5 * step(0.4, sin(time * 18.0)); // ANGRY: Aggressive strobe

          float strength = exp(-d * (vHigh > 0.5 ? 6.0 : 12.0));
          if (strength < 0.005) discard;
          
          vec3 finalCol = vColor * strength * (0.8 + 0.4 * p);
          // Boost user fragments with more core intensity
          if(vHigh > 0.5) finalCol *= 1.5;

          gl_FragColor = vec4(finalCol, vAlpha * strength);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    pointsRef.current = points;

    // --- 5. Resonance Lines ---
    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#ffffff') } },
      vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 color; uniform float time;
        void main() {
          float pulse = 0.3 + 0.7 * abs(sin(time * 2.0));
          gl_FragColor = vec4(color, 0.12 * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);
    lineRef.current = lines;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.05;

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
      else onSelectFragment(null);
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    const animate = (t: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      const time = t * 0.001;
      mat.uniforms.time.value = time;
      
      nebulaLayersRef.current.forEach((layer, i) => {
        layer.rotation.y += nebulaConfigs[i].speed;
        layer.children.forEach((c: any) => {
          if (c.material && c.material.uniforms) c.material.uniforms.time.value = time;
        });
      });
      
      if (coreRef.current) {
        coreRef.current.rotation.y = time * 0.01;
        coreRef.current.children.forEach((c: any) => {
          if (c.material && c.material.uniforms) c.material.uniforms.time.value = time;
        });
      }

      if(lineRef.current && lineRef.current.material instanceof THREE_LIB.ShaderMaterial) {
        lineRef.current.material.uniforms.time.value = time;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
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
        hAttr.setX(idx, 1.0);
        const linePos = [];
        const sx = posAttr.getX(idx), sy = posAttr.getY(idx), sz = posAttr.getZ(idx);
        resonantIndices.forEach(ri => {
          hAttr.setX(ri, 0.6);
          linePos.push(sx, sy, sz, posAttr.getX(ri), posAttr.getY(ri), posAttr.getZ(ri));
        });
        lineRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        if (lineRef.current.material instanceof THREE_LIB.ShaderMaterial) {
          lineRef.current.material.uniforms.color.value.set(COLORS.SENTIMENT[selectedFragment.sentiment]);
        }
      }
    } else {
      lineRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    }
    hAttr.needsUpdate = true;
  }, [selectedFragment, resonantIndices, fragments]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default StardustSphere;
