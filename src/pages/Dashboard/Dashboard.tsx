import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Row, Col, Card, Table, Tag, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDashboard, usePerformanceMonitor, type OrderRecord } from './hook';
import styles from './Dashboard.module.scss';

const statIcons: Record<number, string> = {
  0: '👥',
  1: '📦',
  2: '💰',
  3: '📈',
};

function Dashboard() {
  const intl = useIntl();
  const { stats, orders } = useDashboard();
  const perf = usePerformanceMonitor();

  const columns: ColumnsType<OrderRecord> = useMemo(
    () => [
      { title: intl.formatMessage({ id: 'home.orderId' }), dataIndex: 'id', key: 'id' },
      {
        title: intl.formatMessage({ id: 'home.customer' }),
        dataIndex: 'customer',
        key: 'customer',
      },
      { title: intl.formatMessage({ id: 'home.product' }), dataIndex: 'product', key: 'product' },
      {
        title: intl.formatMessage({ id: 'home.amount' }),
        dataIndex: 'amount',
        key: 'amount',
        render: (text: number) => `$${text}`,
      },
      {
        title: intl.formatMessage({ id: 'home.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (text: string) => {
          const colors: Record<string, string> = {
            completed: 'green',
            pending: 'orange',
            processing: 'blue',
          };
          return (
            <Tag color={colors[text] || 'default'}>
              {intl.formatMessage({ id: `home.${text}` })}
            </Tag>
          );
        },
      },
    ],
    [intl],
  );

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col key={stat.title} xs={24} sm={12} lg={6}>
            <Card hoverable>
              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <span className={styles.statTitle}>{stat.title}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span
                    className={styles.statGrowth}
                    style={{ color: stat.growth > 0 ? '#52c41a' : '#ff4d4f' }}
                  >
                    {stat.growth > 0 ? '▲' : '▼'} {Math.abs(stat.growth)}%
                  </span>
                </div>
                <div
                  className={styles.statIcon}
                  style={{ backgroundColor: stat.iconBg, color: stat.color }}
                >
                  {statIcons[index] || '📊'}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={intl.formatMessage({ id: 'home.recentOrders' })}>
            <Table
              columns={columns}
              dataSource={orders}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={intl.formatMessage({ id: 'home.performance' })}>
            <div className={styles.performanceList}>
              <div className={styles.performanceItem}>
                <div className={styles.perfHeader}>
                  <span>{intl.formatMessage({ id: 'home.cpuUsage' })}</span>
                  <span className={styles.perfValue}>{perf.fps} fps</span>
                </div>
                <Progress
                  percent={perf.fpsPercent}
                  strokeColor={{ from: '#108ee9', to: '#87d068' }}
                />
              </div>
              <div className={styles.performanceItem}>
                <div className={styles.perfHeader}>
                  <span>{intl.formatMessage({ id: 'home.memoryUsage' })}</span>
                  <span className={styles.perfValue}>{perf.memoryUsed} MB</span>
                </div>
                <Progress percent={perf.memoryPercent} status="active" />
              </div>
              <div className={styles.performanceItem}>
                <div className={styles.perfHeader}>
                  <span>{intl.formatMessage({ id: 'home.domNodes' })}</span>
                  <Tag color={perf.domStatusColor}>{perf.domNodes}</Tag>
                </div>
              </div>
              <div className={styles.performanceItem}>
                <div className={styles.perfHeader}>
                  <span>{intl.formatMessage({ id: 'home.pageLoadTime' })}</span>
                  <Tag color={perf.pageLoadColor}>{perf.pageLoadTime} ms</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
