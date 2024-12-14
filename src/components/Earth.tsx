import React, { Suspense, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  MeshTransmissionMaterial,
  RoundedBox,
  Environment,
  CameraControls,
  AccumulativeShadows,
  RandomizedLight,
  Preload,
} from "@react-three/drei";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function Earth({ startAnimation, ...props }) {
  const ref = useRef();
  const { nodes, materials } = useGLTF("/earth-transformed.glb");
  const [opacity, setOpacity] = useState(0.9);

  useFrame((state, delta) => {
    if (startAnimation && ref.current) {
      // Update object position and rotation if startAnimation is true
      ref.current.position.y = Math.sin(state.clock.elapsedTime / 1.5) / 10;
      ref.current.rotation.y += delta / 15;

      // Gradually reduce opacity if startAnimation is true
      if (opacity > 0) {
        const newOpacity = opacity - delta / 2;
        setOpacity(Math.max(0, newOpacity));
      }

      // Update material opacity if startAnimation is true
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

const TextOnFaces = ({ startAnimation }) => {
  const cubeRef = useRef();
  const textMeshes = useRef([]);

  useEffect(() => {
    const cube = cubeRef.current;

    const addTextToFace = (text, position, rotation) => {
      const loader = new FontLoader();

      loader.load("/American Typewriter_Regular.json", function (font) {
        if (font && font.generateShapes) {
          const textGeometry = new TextGeometry(text, {
            font: font,
            size: 1.5,
            height: 0.1,
          });

          const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
          const textMesh = new THREE.Mesh(textGeometry, material);

          textMesh.position.copy(position);
          textMesh.rotation.copy(rotation);

          cube.add(textMesh);
          textMeshes.current.push(textMesh);

          // Fade in animation
          let opacity = 0;
          const fadeInInterval = setInterval(() => {
            opacity += 0.1; // Adjust the increment value as needed
            if (opacity >= 1) {
              clearInterval(fadeInInterval);
            }
            textMesh.material.transparent = true;
            textMesh.material.opacity = opacity;
          }, 5); // Adjust the interval as needed
        } else {
          console.error("Invalid font or missing generateShapes method.");
        }
      });
    };

    const addLogoToFace = (modelPath, position, rotation) => {
      const loader = new GLTFLoader();

      loader.load(modelPath, function (gltf) {
        const logo = gltf.scene;

        // Set initial position, rotation, and scale
        logo.position.copy(position);
        logo.rotation.copy(rotation);
        logo.scale.set(3, 3, 3); // Adjust scale as needed

        // Set transparent material for the entire model scene
        logo.traverse((child) => {
          if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 0; // Start with opacity 0 to fade in
          }
        });

        cube.add(logo);
        textMeshes.current.push(logo);

        // Fade in animation for the entire model scene
        let opacity = 0;
        const fadeInInterval = setInterval(() => {
          opacity += 0.1; // Adjust the increment value as needed
          if (opacity >= 1) {
            clearInterval(fadeInInterval);
          }
          logo.traverse((child) => {
            if (child.isMesh) {
              child.material.opacity = opacity;
            }
          });
        }, 5); // Adjust the interval as needed
      });
    };

    // Add text to each face
    if (startAnimation) {
      addLogoToFace(
        "/zig3.glb",
        new THREE.Vector3(0, 0.5, 0.2),
        new THREE.Euler(-Math.PI / 2, 0, 0)
      );

      addLogoToFace(
        "/3.glb",
        new THREE.Vector3(0.35, -0.3, 0),
        new THREE.Euler(0, Math.PI / 2, 0)
      );
      addLogoToFace(
        "/g.glb",
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

export default function Viewer({ startAnimation }) {
  return (
    <Canvas camera={{ position: [5, 2, 0], fov: 55 }}>
      <Suspense>
        <group position={[0, 0.5, 0]}>
          {/* <ambientLight intensity={1} />
          <hemisphereLight intensity={0.1} groundColor="black" />
          <spotLight position={[-20, 50, 10]} intensity={10} />
          <pointLight intensity={1} /> */}
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
