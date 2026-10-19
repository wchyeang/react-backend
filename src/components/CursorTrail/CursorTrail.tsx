import { useCursorTrail } from './hook';
import styles from './CursorTrail.module.scss';

function CursorTrail() {
  const { canvasRef } = useCursorTrail();
  return <canvas ref={canvasRef} className={styles.cursorTrailCanvas} />;
}

export default CursorTrail;
