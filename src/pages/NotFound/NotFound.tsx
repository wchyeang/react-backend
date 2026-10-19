import { Button, Result } from 'antd';
import { use404 } from './hook';
import styles from './NotFound.module.scss';

function NotFound() {
  const { title, description, backLabel, handleBack } = use404();

  return (
    <div className={styles.notFound}>
      <Result
        status="404"
        title={title}
        subTitle={description}
        extra={
          <Button type="primary" onClick={handleBack}>
            {backLabel}
          </Button>
        }
      />
    </div>
  );
}

export default NotFound;
