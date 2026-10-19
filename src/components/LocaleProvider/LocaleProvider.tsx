import { type PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { useLocaleProvider } from './hook';

function LocaleProvider({ children }: PropsWithChildren) {
  const { locale, localeMessages } = useLocaleProvider();

  return (
    <IntlProvider locale={locale} messages={localeMessages}>
      {children}
    </IntlProvider>
  );
}

export default LocaleProvider;
