import { useSite } from '@rspress/core/runtime';
import {
  HomeLayout as BaseHomeLayout,
  Layout as BaseLayout,
} from '@rspress/core/theme-original';
import { HomeData } from './components/HomeData';
import { InstallTabs } from './components/InstallTabs';

function HomeLayout() {
  return (
    <BaseHomeLayout
      afterHeroActions={<InstallTabs />}
      afterFeatures={<HomeData />}
    />
  );
}

// The built-in footer only renders on the home page; show the same message on doc pages
function SiteFooter() {
  const { site } = useSite();
  const message = site.themeConfig.footer?.message;
  if (!message) return null;
  // The message comes from our own config and carries markup (line break, license link)
  return <footer className="rm-doc-footer" dangerouslySetInnerHTML={{ __html: message }} />;
}

function Layout() {
  return <BaseLayout afterDocFooter={<SiteFooter />} />;
}

export { HomeLayout, Layout };
export * from '@rspress/core/theme-original';
