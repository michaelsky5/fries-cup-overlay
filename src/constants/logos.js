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
  // 🚀 过滤掉名为 TBD 和 OW 的扫描结果，防止重复
  ...scannedLogos.filter(logo => 
    logo.name.toUpperCase() !== 'TBD' && 
    logo.name.toUpperCase() !== 'OW'
  )
];