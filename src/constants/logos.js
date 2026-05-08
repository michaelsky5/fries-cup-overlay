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

const findLogoByName = name => {
  const target = String(name || '').trim().toUpperCase();
  return scannedLogos.find(logo => String(logo.name || '').trim().toUpperCase() === target);
};

const defaultLogo = findLogoByName('OW') || scannedLogos[0] || {
  name: 'OW',
  path: '/assets/logos/OW.png'
};

export const LOGO_LIST = [
  {
    name: 'TBD',
    path: defaultLogo.path
  },
  ...scannedLogos.filter(logo => {
    const name = String(logo.name || '').trim().toUpperCase();
    return name !== 'TBD' && name !== 'OW';
  })
];