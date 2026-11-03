<script lang="ts">
  let { seed = 0 }: { seed?: number } = $props();
  const uid = $props.id();
  const hue = $derived([210, 268, 168, 32][Math.abs(seed) % 4] ?? 210);
</script>

<!-- Original decorative traveler illustration, not an official character portrait. -->
<svg viewBox="0 0 160 192" fill="none" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="160" y2="192" gradientUnits="userSpaceOnUse">
      <stop stop-color={`hsl(${hue} 35% 34%)`} /><stop offset="1" stop-color="#172237" />
    </linearGradient>
    <linearGradient id={`${uid}-hair`} x1="45" y1="30" x2="110" y2="140" gradientUnits="userSpaceOnUse">
      <stop stop-color="#e5d7b9" /><stop offset="1" stop-color="#968b82" />
    </linearGradient>
  </defs>
  <rect width="160" height="192" rx="12" fill={`url(#${uid}-sky)`} />
  <circle cx="80" cy="83" r="58" stroke="#e0c48b" stroke-opacity=".32" />
  <path d="m80 10 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10ZM137 46l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#e0c48b" opacity=".8" />
  <path d="M23 192c2-32 19-50 39-57h36c23 9 38 29 39 57" fill="#24374f" />
  <path d="m61 137 19 24 20-24 18 20-38 33-38-33 19-20Z" fill="#e7ddc9" />
  <path d="m66 121-4 17 18 16 19-17-5-16" fill="#d9ac98" />
  <path d="M43 72c0-30 15-47 39-47 25 0 39 18 39 47v53l-19 17-45-7-18-15 4-48Z" fill={`url(#${uid}-hair)`} />
  <path d="M53 73c0-22 11-37 28-37s29 15 29 37v21c0 22-15 37-29 37S53 116 53 94V73Z" fill="#f3ceba" />
  <path d="M46 83c-1-37 14-55 37-55 24 0 38 20 36 55l-14-18-6-20-16 30-9-17-19 30-9-5Z" fill={`url(#${uid}-hair)`} />
  <path d="m60 94 10-2m23 0 10 2" stroke="#4a3d43" stroke-width="3" stroke-linecap="round" />
  <path d="m77 113 9 0" stroke="#ae7b72" stroke-width="2" stroke-linecap="round" />
  <path d="m43 80-6 47 18 14 5-29m51-33 12 53-17 9-5-29" fill={`url(#${uid}-hair)`} />
  <path d="m43 68 10-8 7 8-10 8-7-8Z" fill="#e0c48b" />
  <path d="m80 159 8 11-8 13-8-13 8-11Z" fill="#c7a766" />
  <path d="m32 178 25-13m72 13-25-13" stroke="#e0c48b" stroke-width="2" />
</svg>
