import { HomeLayout as BaseHomeLayout } from '@rspress/core/theme-original';
import { InstallTabs } from './components/InstallTabs';

function HomeLayout() {
  return <BaseHomeLayout afterHeroActions={<InstallTabs />} />;
}

export { HomeLayout };
export * from '@rspress/core/theme-original';
