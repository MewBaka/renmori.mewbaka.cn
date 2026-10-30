import { HomeLayout as BaseHomeLayout } from '@rspress/core/theme-original';
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

export { HomeLayout };
export * from '@rspress/core/theme-original';
