import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';

export function use404() {
  const navigate = useNavigate();
  const intl = useIntl();

  return {
    title: intl.formatMessage({ id: 'notFound.title' }),
    description: intl.formatMessage({ id: 'notFound.subtitle' }),
    backLabel: intl.formatMessage({ id: 'notFound.backHome' }),
    handleBack: () => navigate('/'),
  };
}
