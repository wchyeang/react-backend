import { useTextRainTrail } from './hook';
import styles from './TextRainTrail.module.scss';

function TextRainTrail() {
  const { canvasRef } = useTextRainTrail();
  return <canvas ref={canvasRef} className={styles.textRainTrailCanvas} />;
}

export default TextRainTrail;
