'use client';
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
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

interface EarthProps extends GroupProps {
    startAnimation: boolean;
}

function Earth({ startAnimation, ...props }: EarthProps) {
    const ref = useRef<THREE.Mesh>(null);
    const { nodes, materials } = useGLTF("/models/earth.glb");
    const [opacity, setOpacity] = useState<number>(0.9);

    useFrame((state, delta) => {
        if (startAnimation && ref.current) {
            ref.current.position.y = Math.sin(state.clock.elapsedTime / 1.5) / 10;
            ref.current.rotation.y += delta / 15;

            if (opacity > 0) {
                const newOpacity = opacity - delta / 2;
                setOpacity(Math.max(0, newOpacity));
            }

            if (ref.current.material) {
                ref.current.material.transparent = true;
                ref.current.material.opacity = opacity;
            }
        }
    });

    return (
        <group {...props}>
            <mesh
                castShadow
                ref={ref}
                geometry={nodes.Object_4.geometry}
                material={materials["Scene_-_Root"]}
                scale={1.128}
            />
        </group>
    );
}

interface TextOnFacesProps {
    startAnimation: boolean;
}

const TextOnFaces = ({ startAnimation }: TextOnFacesProps) => {
    const cubeRef = useRef<any>();
    const textMeshes = useRef([]);

    useEffect(() => {
        const cube = cubeRef.current;

        const addLogoToFace = (modelPath, position, rotation) => {
            const loader = new GLTFLoader();

            loader.load(modelPath, function (gltf) {
                const logo = gltf.scene;

                logo.position.copy(position);
                logo.rotation.copy(rotation);
                logo.scale.set(3, 3, 3);

                logo.traverse((child) => {
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
                    logo.traverse((child) => {
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
    startAnimation: boolean;
}

export default function Viewer({ startAnimation }: Props) {
    return (
        <Canvas camera={{ position: [5, 2, 0], fov: 55 }} onScroll={(e) => e.stopPropagation()}>
            <Suspense>
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
    );
}
