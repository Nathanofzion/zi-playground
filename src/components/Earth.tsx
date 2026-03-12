"use client"
import {
    AccumulativeShadows,
    CameraControls,
    Environment,
    MeshTransmissionMaterial,
    Preload,
    RandomizedLight,
    RoundedBox,
    useGLTF
} from "@react-three/drei";
import { Canvas, GroupProps, useFrame } from "@react-three/fiber";
import { Component, ErrorInfo, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

// WebGL Support Detection
function isWebGLSupported(): boolean {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// React Error Boundary for Canvas
class WebGLErrorBoundary extends Component<
    { children: ReactNode; onError: () => void },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode; onError: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): { hasError: boolean } {
        // Check if it's a WebGL-related error
        if (error.message.includes('WebGL') || 
            error.message.includes('WebGLRenderer') ||
            error.message.includes('context')) {
            return { hasError: true };
        }
        return { hasError: false };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (this.state.hasError) {
            console.warn('WebGL Error Boundary caught:', error.message);
            this.props.onError();
        }
    }

    render() {
        if (this.state.hasError) {
            return null; // Let parent handle fallback
        }
        return this.props.children;
    }
}

interface EarthProps extends GroupProps {
    startAnimation?: boolean;
}

function Earth({ startAnimation, ...props }: EarthProps) {
    const ref = useRef<THREE.Mesh>(null);
    const { nodes, materials } = useGLTF("/models/earth.glb");
    const [opacity, setOpacity] = useState<number>(0.9);

    const earth = useMemo(() => nodes["Object_4"].clone() as any, [nodes]);
    const material = useMemo(() => materials["Scene_-_Root"].clone(), [materials]);

    useFrame((state, delta) => {
        if (startAnimation && ref.current) {
            ref.current.position.y = Math.sin(state.clock.elapsedTime / 1.5) / 10;
            ref.current.rotation.y += delta / 15;

            if (opacity > 0) {
                const newOpacity = opacity - delta / 2;
                setOpacity(Math.max(0, newOpacity));
            }

            if (ref.current.material) {
                (ref.current.material as any).transparent = true;
                (ref.current.material as any).opacity = opacity;
            }
        }
    });

    return (
        <group {...props}>
            <mesh
                castShadow
                ref={ref}
                geometry={earth.geometry}
                material={material}
                scale={1.128}
            />
        </group>
    );
}

interface TextOnFacesProps {
    startAnimation?: boolean;
}

const TextOnFaces = ({ startAnimation }: TextOnFacesProps) => {
    const cubeRef = useRef<any>();
    const textMeshes = useRef<any[]>([]);

    useEffect(() => {
        const cube = cubeRef.current;

        const addLogoToFace = (modelPath: string, position: any, rotation: any) => {
            const loader = new GLTFLoader();

            loader.load(modelPath, function (gltf) {
                const logo = gltf.scene;

                logo.position.copy(position);
                logo.rotation.copy(rotation);
                logo.scale.set(3, 3, 3);

                logo.traverse((child: any) => {
                    if (child.isMesh) {
                        child.material.transparent = true;
                        child.material.opacity = 0;
                    }
                });

                cube.add(logo);
                textMeshes.current.push(logo);

                let opacity = 0;
                const fadeInInterval = setInterval(() => {
                    opacity += 0.1;
                    if (opacity >= 1) {
                        clearInterval(fadeInInterval);
                    }
                    logo.traverse((child: any) => {
                        if (child.isMesh) {
                            child.material.opacity = opacity;
                        }
                    });
                }, 5);
            });
        };

        if (startAnimation) {
            addLogoToFace(
                "/models/zig3.glb",
                new THREE.Vector3(0, 0.5, 0.2),
                new THREE.Euler(-Math.PI / 2, 0, 0)
            );

            addLogoToFace(
                "/models/3.glb",
                new THREE.Vector3(0.35, -0.3, 0),
                new THREE.Euler(0, Math.PI / 2, 0)
            );
            addLogoToFace(
                "/models/g.glb",
                new THREE.Vector3(-0.2, -0.3, 0.35),
                new THREE.Euler()
            );
        }
    }, [startAnimation]);

    return (
        <mesh ref={cubeRef}>
            <RoundedBox scale={2}>
                <MeshTransmissionMaterial
                    backside
                    backsideThickness={-1}
                    thickness={0.02}
                    anisotropicBlur={0.02}
                    opacity={0.5}
                    transparent={true}
                />
            </RoundedBox>
        </mesh>
    );
};

interface Props {
    startAnimation?: boolean;
}

export default function Viewer({ startAnimation }: Props) {
    const [hasWebGLError, setHasWebGLError] = useState(false);
    const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
    
    // Check WebGL support on mount
    useEffect(() => {
        setWebGLSupported(isWebGLSupported());
    }, []);
    
    // Global error handler
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            const message = event.error?.message || event.message || '';
            if (message.includes('WebGL') || 
                message.includes('WebGLRenderer') ||
                message.includes('context') ||
                message.includes('canvas')) {
                console.warn('WebGL Error detected:', message);
                setHasWebGLError(true);
                event.preventDefault();
            }
        };
        
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const message = event.reason?.message || event.reason || '';
            if (typeof message === 'string' && 
                (message.includes('WebGL') || message.includes('context'))) {
                console.warn('WebGL Promise rejection:', message);
                setHasWebGLError(true);
                event.preventDefault();
            }
        };
        
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
    
    // Fallback UI when WebGL fails or isn't supported
    if (hasWebGLError || webGLSupported === false) {
        return (
            <div 
                style={{
                    width: '100%',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem',
                    textAlign: 'center',
                    padding: '2rem'
                }}
            >
                <div>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
                    <h3 style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                        {webGLSupported === false ? 'WebGL Not Available' : '3D Environment Loading'}
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                        {webGLSupported === false 
                            ? 'Your browser doesn\'t support WebGL. Core functionality available below.' 
                            : 'WebGL optimization in progress...\nCore functionality available below'
                        }
                    </p>
                </div>
            </div>
        );
    }
    
    // Loading state while checking WebGL
    if (webGLSupported === null) {
        return (
            <div 
                style={{
                    width: '100%',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                }}
            >
                <div>Loading...</div>
            </div>
        );
    }
    
    // Render Canvas with error boundary
    return (
        <WebGLErrorBoundary onError={() => setHasWebGLError(true)}>
            <Canvas 
                camera={{ position: [5, 2, 0], fov: 55 }} 
                onScroll={(e) => e.stopPropagation()}
                onCreated={({ gl }) => {
                    // Verify GL context was created successfully
                    if (!gl.getContext()) {
                        console.warn('WebGL context creation failed');
                        setHasWebGLError(true);
                    }
                }}
                fallback={<div>Canvas Loading...</div>}
            >
                <Suspense fallback={null}>
                    <group position={[0, 0.5, 0]}>
                        <Earth
                            scale={0.7}
                            position={[0, 0, 0]}
                            startAnimation={startAnimation}
                        />
                        <TextOnFaces startAnimation={startAnimation} />
                    </group>
                    <Environment
                        files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
                        blur={1}
                    />
                    <AccumulativeShadows
                        color="lightblue"
                        position={[0, -1, 0]}
                        frames={100}
                        opacity={0.75}
                    >
                        <RandomizedLight radius={10} position={[-5, 5, 2]} />
                    </AccumulativeShadows>
                    <CameraControls />
                </Suspense>
                <Preload all />
            </Canvas>
        </WebGLErrorBoundary>
    );
}