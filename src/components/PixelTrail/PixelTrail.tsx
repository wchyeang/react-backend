import { usePixelTrail } from './hook';
import styles from './PixelTrail.module.scss';

function PixelTrail() {
  const { canvasRef } = usePixelTrail();
  return <canvas ref={canvasRef} className={styles.pixelTrailCanvas} />;
}

export default PixelTrail;
