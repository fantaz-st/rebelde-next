import { useTexture } from "@react-three/drei";

const FallbackMaterial = ({ url }) => {
  const texture = useTexture(url);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
};

export default FallbackMaterial;
