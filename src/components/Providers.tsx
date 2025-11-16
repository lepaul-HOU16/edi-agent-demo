// import { NextUIProvider } from '@nextui-org/react';
// Authenticator removed;
import { UserAttributesProvider } from '@/components/UserAttributesProvider';
// Set up internationalization
import { I18nProvider } from '@cloudscape-design/components/i18n';
// Import all locales
import allMessages from '@cloudscape-design/components/i18n/messages/all.all';
// Or only import specific locales
// import enMessages from '@cloudscape-design/components/i18n/messages/all.en';

/** @see https://nextui.org/docs/frameworks/nextjs#setup-provider */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      <UserAttributesProvider>
        <I18nProvider messages={[allMessages]} locale="en">
          {children}
        </I18nProvider>
      </UserAttributesProvider>
    </Authenticator.Provider>
  )
}
