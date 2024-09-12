import { useContext, useEffect, useMemo, Suspense } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { useAspect, useVideoTexture } from "@react-three/drei";
import { TextureLoader } from "three";
import { SliderContext } from "@/context/slider-context";
import customVideoShader from "@/helpers/shaders";
import transparentPixelSrc from "../../assets/transparent-pixel.png";
import FallbackMaterial from "../FallbackMaterial/FallbackMaterial";
import slides from "@/helpers/slides";
import suspenseImg from "../../assets/suspense.png";

const Mesh = () => {
  const { viewportSize, materialRef, transitionRef } = useContext(SliderContext);
  const viewport = useThree((state) => state.viewport);

  const size = useAspect(viewportSize.width, viewportSize.height);

  const texture1 = useVideoTexture(slides[0].src);
  const texture2 = useVideoTexture(slides[1].src);
  const texture3 = useVideoTexture(slides[2].src);

  const textures = useMemo(() => [texture1, texture2, texture3], [texture1, texture2, texture3]);

  const transparentPixelTexture = useLoader(TextureLoader, transparentPixelSrc.src);

  const uniforms = useMemo(
    () => ({
      uTexture1: { value: transparentPixelTexture },
      uTexture2: { value: textures[0] },
      uOffsetAmount: { value: 2.25 },
      uColumnsCount: { value: 3 },
      uTransitionProgress: { value: 1 },
      uInputResolution: { value: [16, 9] },
      uOutputResolution: { value: size.slice(0, 2) },
      uAngle: { value: (45 * Math.PI) / 180 },
      uScale: { value: 3 },
    }),
    [transparentPixelTexture, textures, size]
  );

  useEffect(() => {
    console.log("Initial transition called");
    if (transitionRef.current) {
      transitionRef.current("first");
    } else {
      console.log("Transition ref is not set");
    }
  }, [transitionRef]);

  return (
    <mesh scale={size}>
      <planeGeometry />
      <Suspense fallback={<FallbackMaterial url={suspenseImg} />}>
        <shaderMaterial ref={materialRef} attach='material' args={[customVideoShader]} uniforms={uniforms} toneMapped={false} />
      </Suspense>
    </mesh>
  );
};

export default Mesh;
