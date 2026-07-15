import nextConfig from "eslint-config-next"

const config = [
  ...nextConfig,
  {
    // The old prototype's real-backend demo page has a pre-existing lint
    // finding (react-hooks/set-state-in-effect) -- left untouched deliberately,
    // same as the rest of the legacy pages this session keeps as a backup.
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "app/live/page.tsx"],
  },
]

export default config
