import {
  PackageManagerTabs,
  type PackageManagerTabProps,
} from '@rspress/core/theme-original';

// PackageManagerTabs only types the JS package managers, but at runtime it
// renders whatever keys `command` has and looks icons up in `additionalTabs`
const command = {
  pip: 'pip install renmori',
  uv: 'uv tool install renmori',
  pipx: 'pipx install renmori',
} as unknown as Exclude<PackageManagerTabProps['command'], string>;

function Pip() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 256 256" aria-hidden="true">
      <path
        fill="#3775a9"
        d="M126 16c-56 0-53 24-53 24v25h54v8H52S16 69 16 126s31 55 31 55h19v-27s-1-31 31-31h53s30 1 30-29V45s5-29-54-29Zm-30 17a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"
      />
      <path
        fill="#ffd43b"
        d="M130 240c56 0 53-24 53-24v-25h-54v-8h75s36 4 36-53-31-55-31-55h-19v27s1 31-31 31h-53s-30-1-30 29v49s-5 29 54 29Zm30-17a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"
      />
    </svg>
  );
}

function Uv() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 256 256" aria-hidden="true">
      <rect width="256" height="256" rx="48" fill="#de5fe9" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M54 84v52a34 34 0 0 0 68 0V84M140 84l31 88 31-88"
      />
    </svg>
  );
}

function Pipx() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 256 256" aria-hidden="true">
      <rect width="256" height="256" rx="48" fill="#3a2013" />
      <path
        fill="none"
        stroke="#f3c24e"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M60 84l48 44-48 44M128 180h68"
      />
    </svg>
  );
}

export function InstallTabs() {
  return (
    <div className="rm-install-tabs">
      <PackageManagerTabs
        command={command}
        additionalTabs={[
          { tool: 'pip', icon: <Pip /> },
          { tool: 'uv', icon: <Uv /> },
          { tool: 'pipx', icon: <Pipx /> },
        ]}
      />
    </div>
  );
}
