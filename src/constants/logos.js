const logoModules = import.meta.glob('/src/assets/logos/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default'
});

const scannedLogos = Object.entries(logoModules)
  .map(([file, path]) => {
    const filename = file.split('/').pop().replace(/\.[^.]+$/, '');
    return { name: filename, path };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const LOGO_LIST = [
  { name: 'TBD', path: '/src/assets/logos/OW.png' },
  ...scannedLogos.filter(logo => logo.name.toUpperCase() !== 'TBD')
];