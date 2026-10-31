import { normalizeImagePath, useFrontmatter } from '@rspress/core/runtime';
import { Button, Link, renderHtmlOrText } from '@rspress/core/theme-original';
import { Fragment, type ReactNode } from 'react';
// The built-in HomeHero imports its own styles; replacing it drops them from the bundle
import '@rspress/core/dist/theme/components/HomeHero/index.css';

interface HeroAction {
  text: string;
  link: string;
  theme?: 'brand' | 'alt';
}

interface Hero {
  badge?: string | { text: string; link?: string };
  name?: string;
  text?: string;
  tagline?: string;
  actions?: HeroAction[];
  image?: { src: string | { light: string; dark: string }; alt?: string };
}

/**
 * Same markup as the built-in HomeHero, except the brand name and hero text are
 * wrapped in one <h1> so the home page has a heading search engines can read.
 * The built-in version renders them as <div>/<span> and leaves the page without an h1.
 */
export function HomeHero({
  beforeHeroActions,
  afterHeroActions,
}: {
  beforeHeroActions?: ReactNode;
  afterHeroActions?: ReactNode;
}) {
  const { frontmatter } = useFrontmatter();
  const hero: Hero = (frontmatter?.hero as Hero) ?? {};
  const lines = hero.text ? hero.text.toString().split('\n').filter((line) => line !== '') : [];
  const imageSrc =
    typeof hero.image?.src === 'string'
      ? { light: hero.image.src, dark: hero.image.src }
      : hero.image?.src;
  const badge = typeof hero.badge === 'string' ? { text: hero.badge } : hero.badge;

  return (
    <div className={`rp-home-hero${hero.image ? '' : ' rp-home-hero--no-image'}`}>
      <div className="rp-home-hero__container">
        {badge?.text &&
          (badge.link ? (
            <Link href={badge.link} className="rp-home-hero__badge">
              {badge.text}
            </Link>
          ) : (
            <div className="rp-home-hero__badge">{badge.text}</div>
          ))}
        {/* The container is a flex column, so the spans lay out as blocks like the original divs;
            the spaces keep the words apart in the heading text that crawlers extract */}
        <h1 className="rp-home-hero__content rm-home-hero__heading">
          <span className="rp-home-hero__title">
            <span className="rp-home-hero__title-brand" {...renderHtmlOrText(hero.name)} />
          </span>
          {lines.map((line) => (
            <Fragment key={line}>
              {' '}
              <span className="rp-home-hero__subtitle" {...renderHtmlOrText(line)} />
            </Fragment>
          ))}
        </h1>
        <p className="rp-home-hero__tagline" {...renderHtmlOrText(hero.tagline)} />
        {beforeHeroActions}
        <div className="rp-home-hero__actions">
          {hero.actions?.map((action) => (
            <Button
              key={action.link}
              type="a"
              href={action.link}
              theme={action.theme}
              className="rp-home-hero__action"
              {...renderHtmlOrText(action.text)}
            />
          ))}
        </div>
        {afterHeroActions}
      </div>
      {imageSrc && (
        <div className="rp-home-hero__image">
          <img
            src={normalizeImagePath(imageSrc.light)}
            alt={hero.image?.alt}
            width={375}
            height={375}
            className="rp-home-hero__image-img rp-home-hero__image-img--light"
          />
          <img
            src={normalizeImagePath(imageSrc.dark)}
            alt={hero.image?.alt}
            width={375}
            height={375}
            className="rp-home-hero__image-img rp-home-hero__image-img--dark"
          />
        </div>
      )}
    </div>
  );
}
