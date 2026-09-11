// Dati del catalogo hardware AI.
// Fonti: siti ufficiali e stampa specializzata (verificate a settembre 2026).
// I valori non confermati da fonte ufficiale sono marcati "da verificare".
// price_eur è null quando il prezzo non è verificabile: meglio niente che un numero falso.
export const CATEGORIES = {
  APPLE: 'Apple',
  MINI_PC: 'Mini PC',
  MINI_PC_WIN: 'Mini PC Windows',
  WORKSTATION: 'Workstation',
  DEV_BOARD: 'Schede sviluppo',
};

export const PRODUCTS = [
  {
    slug: 'mac-mini-m4',
    image_urls: [
      'https://www.apple.com/v/mac-mini/ab/images/meta/mac-mini__dvce2jrm11w2_og.jpg',
    ],
    name: 'Mac mini M4',
    brand: 'Apple',
    category: CATEGORIES.APPLE,
    price_eur: 729,
    price_note: 'Prezzo di listino Apple Italia (ottobre 2024)',
    description:
      'Il desktop Apple più compatto (12,7 × 12,7 cm). Con il chip M4 esegue bene modelli locali via MLX/llama.cpp e Ollama. Ottimo rapporto prezzo/prestazioni per iniziare con l’AI locale; i 16GB di memoria unificata limitano i modelli a ~7-8B parametri quantizzati.',
    specs: {
      cpu: 'Apple M4, CPU 10-core (4P + 6E)',
      ram: '16GB memoria unificata (conf. 24/32GB), 120 GB/s',
      gpu_npu: 'GPU 10-core + Neural Engine 16-core',
      tops_ai: '38 TOPS (Neural Engine, dato Apple — da verificare)',
      storage: 'SSD 256GB (conf. fino a 2TB)',
      power_w: 'Max 155W (alimentatore), consumo tipico molto inferiore',
      os: 'macOS',
    },
    buy_links: [{ label: 'Apple Store', url: 'https://www.apple.com/it/shop/buy-mac/mac-mini' }],
  },
  {
    slug: 'mac-mini-m4-pro',
    image_urls: [
      'https://www.apple.com/v/mac-mini/ab/images/meta/mac-mini__dvce2jrm11w2_og.jpg',
    ],
    name: 'Mac mini M4 Pro',
    brand: 'Apple',
    category: CATEGORIES.APPLE,
    price_eur: 1679,
    price_note: 'Prezzo di listino Apple Italia (ottobre 2024)',
    description:
      'La variante Pro aggiunge CPU 12-core, GPU 16-core, banda di memoria da 273 GB/s e Thunderbolt 5. La banda elevata lo rende uno dei migliori mini PC per inferenza LLM locale: con 48-64GB di memoria unificata si gestiscono modelli fino a ~70B quantizzati.',
    specs: {
      cpu: 'Apple M4 Pro, CPU 12-core (8P + 4E), conf. 14-core',
      ram: '24GB memoria unificata (conf. 48/64GB), 273 GB/s',
      gpu_npu: 'GPU 16-core (conf. 20-core) + Neural Engine 16-core',
      tops_ai: '38 TOPS (Neural Engine — da verificare)',
      storage: 'SSD 512GB (conf. fino a 8TB)',
      power_w: 'Max 155W (alimentatore)',
      os: 'macOS',
    },
    buy_links: [{ label: 'Apple Store', url: 'https://www.apple.com/it/shop/buy-mac/mac-mini' }],
  },
  {
    slug: 'macbook-pro-14-m4',
    image_urls: [
      'https://www.apple.com/v/macbook-pro/ax/images/meta/macbook-pro__difvbgz1plsi_og.png',
    ],
    name: 'MacBook Pro 14" M4',
    brand: 'Apple',
    category: CATEGORIES.APPLE,
    price_eur: 1949,
    price_note: 'Prezzo di listino Apple Italia al lancio (ottobre 2024)',
    description:
      'Portatile professionale con chip M4, display Liquid Retina XDR e ottima autonomia. Per l’AI locale vale lo stesso discorso del Mac mini M4, con il vantaggio della mobilità. Disponibile anche con M4 Pro e M4 Max (fino a 128GB di memoria unificata).',
    specs: {
      cpu: 'Apple M4, CPU 10-core',
      ram: '16GB memoria unificata (conf. 24/32GB)',
      gpu_npu: 'GPU 10-core + Neural Engine 16-core',
      tops_ai: '38 TOPS (Neural Engine — da verificare)',
      storage: 'SSD 512GB',
      power_w: 'Batteria 72,4Wh, alimentatore 70W (da verificare)',
      os: 'macOS',
    },
    buy_links: [
      { label: 'Apple Store', url: 'https://www.apple.com/it/shop/buy-mac/macbook-pro/14-pollici' },
    ],
  },
  {
    slug: 'macbook-air-m4-13',
    image_urls: [
      'https://www.apple.com/v/macbook-air/z/images/meta/macbook_air_mx__ez5y0k5yy7au_og.png',
    ],
    name: 'MacBook Air 13" M4',
    brand: 'Apple',
    category: CATEGORIES.APPLE,
    price_eur: 1249,
    price_note: 'Prezzo di listino Apple Italia al lancio (marzo 2025); street price spesso sotto i €1.000',
    description:
      'Ultraportatile fanless con chip M4 e 16GB di memoria unificata di base. Silenzioso ed efficiente, è il Mac più economico per sperimentare con AI locale (Ollama, LM Studio). Senza ventole, i carichi AI prolungati vanno in thermal throttling.',
    specs: {
      cpu: 'Apple M4, CPU 10-core',
      ram: '16GB memoria unificata (conf. 24/32GB)',
      gpu_npu: 'GPU 8-core (conf. 10-core) + Neural Engine 16-core',
      tops_ai: '38 TOPS (Neural Engine — da verificare)',
      storage: 'SSD 256GB (conf. fino a 2TB)',
      power_w: 'Batteria 53,8Wh, alimentatore 30W',
      os: 'macOS',
    },
    buy_links: [
      { label: 'Apple Store', url: 'https://www.apple.com/it/shop/buy-mac/macbook-air/13-pollici' },
    ],
  },
  {
    slug: 'nvidia-dgx-spark',
    image_urls: [
      'https://d2vfia6k6wrouk.cloudfront.net/productimages/ef15a000-baca-4109-a81e-b2f9010d00f9/images/spark-3qtr-right.png',
      'https://d2vfia6k6wrouk.cloudfront.net/productimages/ef15a000-baca-4109-a81e-b2f9010d00f9/images/spark-3qtr-top-left.png',
      'https://d2vfia6k6wrouk.cloudfront.net/productimages/ef15a000-baca-4109-a81e-b2f9010d00f9/images/spark-back.png',
    ],
    name: 'NVIDIA DGX Spark',
    brand: 'NVIDIA',
    category: CATEGORIES.WORKSTATION,
    price_eur: null,
    price_note: 'Da verificare — listino USA $4.699 (Founders Edition 4TB, 2026); prezzo italiano non ufficiale',
    description:
      'Il “supercomputer AI da scrivania” di NVIDIA: superchip GB10 Grace Blackwell, 128GB di memoria unificata LPDDR5x e stack software NVIDIA AI preinstallato (DGX OS, basato su Ubuntu). Esegue in locale inferenza su modelli fino a ~200B parametri e fine-tuning fino a ~70B.',
    specs: {
      cpu: '20-core Arm (10× Cortex-X925 + 10× Cortex-A725)',
      ram: '128GB LPDDR5x unificata, 273 GB/s',
      gpu_npu: 'GPU NVIDIA Blackwell, Tensor Core 5ª gen.',
      tops_ai: '1.000 TOPS / 1 PFLOP FP4 sparse (dato NVIDIA)',
      storage: '4TB NVMe M.2 self-encrypting',
      power_w: 'Alimentatore 240W (TDP GB10 140W)',
      os: 'NVIDIA DGX OS (Ubuntu)',
    },
    buy_links: [
      { label: 'NVIDIA', url: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/' },
    ],
  },
  {
    slug: 'nvidia-jetson-orin-nano-super',
    image_urls: [
      'https://www.nvidia.com/content/dam/en-zz/Solutions/autonomous-machines/embedded-systems/nano-super-developer-kit/jetson-orin-nano-super-developer-kit-og.jpg',
    ],
    name: 'Jetson Orin Nano Super Developer Kit',
    brand: 'NVIDIA',
    category: CATEGORIES.DEV_BOARD,
    price_eur: null,
    price_note: 'Da verificare — listino USA $249 al lancio, aumentato a $399 nel 2026; in Europa €270-290 presso i rivenditori',
    description:
      'La scheda di sviluppo edge AI più diffusa: 67 TOPS INT8, CUDA e stack JetPack completo (TensorRT, Isaac ROS). Ideale per robotica, computer vision e piccoli LLM (fino a ~3-4B parametri). Attenzione: uscita video solo DisplayPort e storage NVMe esterno.',
    specs: {
      cpu: '6-core Arm Cortex-A78AE @ 1,7GHz',
      ram: '8GB LPDDR5, 102 GB/s',
      gpu_npu: 'GPU Ampere 1024 CUDA + 32 Tensor Core',
      tops_ai: '67 TOPS INT8 (dato NVIDIA)',
      storage: 'microSD + NVMe esterno (slot sulla carrier board — da verificare)',
      power_w: '7-25W',
      os: 'JetPack (Ubuntu 22.04 LTS)',
    },
    buy_links: [
      {
        label: 'NVIDIA',
        url: 'https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/',
      },
    ],
  },
  {
    slug: 'asus-nuc-14-pro-plus',
    image_urls: [
      'https://dlcdnwebimgs.asus.com/gain/fc30da7c-376f-453a-9ba0-b528bc3c62ae/',
    ],
    name: 'ASUS NUC 14 Pro+',
    brand: 'ASUS (linea Intel NUC)',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: null,
    price_note: 'Da verificare — barebone Core Ultra 9 ~$740-880 USA; sistema completo ~€1.250-1.500 in Europa',
    description:
      'Mini PC premium in alluminio anodizzato con Core Ultra 9 185H e NPU Intel AI Boost: certificato Copilot+ per workload AI locali leggeri. RAM e storage espandibili (2× SO-DIMM, 2× M.2), cosa rara in questa fascia. Prezzo alto rispetto ai rivali cinesi.',
    specs: {
      cpu: 'Intel Core Ultra 9 185H (16C/22T, fino a 5,1GHz)',
      ram: '2× SO-DIMM DDR5-5600, fino a 96GB',
      gpu_npu: 'Intel Arc iGPU 8-core + NPU Intel AI Boost',
      tops_ai: '~34 TOPS piattaforma (11 TOPS NPU — da verificare)',
      storage: 'M.2 2280 PCIe 4.0 + M.2 2242',
      power_w: 'Alimentatore 150W, TDP CPU fino a 65W',
      os: 'Windows 11 / Linux',
    },
    buy_links: [
      { label: 'ASUS', url: 'https://www.asus.com/displays-desktops/nucs/nuc-mini-pcs/asus-nuc-14-pro-plus/' },
    ],
  },
  {
    slug: 'minisforum-ai-x1-pro',
    image_urls: [
      'https://cdn.shopify.com/s/files/1/0585/0588/7927/files/minisforum-ai-x1-pro-470-ai-mini-pc-1_278f23e8-69a1-4d09-8e80-d30e1eec20bf.png',
      'https://cdn.shopify.com/s/files/1/0585/0588/7927/files/minisforum-ai-x1-pro-470-ai-mini-pc-9_818ad681-cd8c-4898-8bc1-68555a040689.png',
    ],
    name: 'Minisforum AI X1 Pro-370',
    brand: 'Minisforum',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: 739,
    price_note: 'Prezzo barebone store UE Minisforum (da €739, fine 2025) — da verificare per configurazioni con RAM/SSD',
    description:
      'Mini PC Copilot+ con Ryzen AI 9 HX 370 e NPU da 50 TOPS. Tre slot M.2, doppia USB4, porta OCuLink per eGPU: ottima base per una workstation AI locale economica. RAM fino a 96GB su SO-DIMM (a differenza di Beelink SER9 Pro, qui non è saldata).',
    specs: {
      cpu: 'AMD Ryzen AI 9 HX 370 (12C/24T, fino a 5,1GHz)',
      ram: '2× SO-DIMM DDR5, fino a 96GB',
      gpu_npu: 'Radeon 890M (16 CU) + NPU XDNA 2',
      tops_ai: '50 TOPS NPU / 80 TOPS totali (dato AMD)',
      storage: '3× M.2 2280 PCIe 4.0',
      power_w: 'Alimentatore 120W (19V/6,32A)',
      os: 'Windows 11 Pro / Linux',
    },
    buy_links: [{ label: 'Minisforum EU', url: 'https://minisforumpc.eu/' }],
  },
  {
    slug: 'beelink-ser9-pro',
    image_urls: [
      'https://cdn.shopify.com/s/files/1/0505/1360/8884/files/SER9-255__01_49e04289-4995-4d9a-b5a5-a1e9fe380d50.jpg',
      'https://cdn.shopify.com/s/files/1/0505/1360/8884/files/SER9-Pro__02_1b39d376-1ab5-469b-8d32-a2930f107e16.jpg',
    ],
    name: 'Beelink SER9 Pro (HX 370)',
    brand: 'Beelink',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: null,
    price_note: 'Da verificare — listino USA da $999 (32GB/1TB); in Europa tipicamente €900-1.100',
    description:
      'Mini PC compatto e silenzioso (MSC 2.0, ~32dB) con Ryzen AI 9 HX 370, microfono e speaker integrati. Attenzione: RAM LPDDR5X saldata (32 o 64GB alla scelta, non espandibile). Buona macchina per inferenza locale leggera e sviluppo.',
    specs: {
      cpu: 'AMD Ryzen AI 9 HX 370 (12C/24T, 5,1GHz, 65W)',
      ram: '32/64GB LPDDR5X saldata',
      gpu_npu: 'Radeon 890M (16 CU) + NPU XDNA 2',
      tops_ai: '50 TOPS NPU / 80 TOPS totali (dato AMD)',
      storage: '2× M.2 2280 PCIe 4.0 (max 8TB)',
      power_w: 'TDP 65W, alimentatore 19V/5,26A (~100W)',
      os: 'Windows 11 Pro / Ubuntu',
    },
    buy_links: [{ label: 'Beelink', url: 'https://www.bee-link.com/' }],
  },
  {
    slug: 'gmktec-evo-x2',
    image_urls: [
      'https://cdn.shopify.com/s/files/1/0715/1314/5498/files/3236633c9c3cf624fc617d8ceea1246c_28049231-bded-49ff-915d-3fd6ae59ddef.png',
    ],
    name: 'GMKtec EVO-X2',
    brand: 'GMKtec',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: 1959.99,
    price_note: 'Store GMKtec Germania (€1.959,99, 64GB) — prezzi variabili per configurazione, da verificare',
    description:
      'Tra i mini PC AI più potenti in commercio: Ryzen AI Max+ 395 “Strix Halo” con Radeon 8060S (40 CU RDNA 3.5) e fino a 128GB LPDDR5X a 256 GB/s. Con 96-128GB di memoria unificata esegue LLM grandi (fino a ~70-120B quantizzati) senza GPU dedicata. RAM saldata.',
    specs: {
      cpu: 'AMD Ryzen AI Max+ 395 (16C/32T Zen 5, fino a 5,1GHz)',
      ram: '64/96/128GB LPDDR5X-8000 saldata',
      gpu_npu: 'Radeon 8060S (40 CU RDNA 3.5) + NPU XDNA 2',
      tops_ai: '50 TOPS NPU / 126 TOPS totali (dato AMD)',
      storage: 'M.2 2280 PCIe 4.0, 2 slot (fino a 8TB)',
      power_w: 'Alimentatore 230W, TDP fino a 140W',
      os: 'Windows 11 Pro / Linux',
    },
    buy_links: [{ label: 'GMKtec', url: 'https://www.gmktec.com/' }],
  },
  {
    slug: 'minisforum-ms-s1-max',
    image_urls: [
      'https://cdn.shopify.com/s/files/1/0585/0588/7927/files/minisforum-ms-s1-max-mini-pc-1.png',
      'https://cdn.shopify.com/s/files/1/0585/0588/7927/files/minisforum-ms-s1-max-mini-pc-2.png',
    ],
    name: 'Minisforum MS-S1 MAX',
    brand: 'Minisforum',
    category: CATEGORIES.WORKSTATION,
    price_eur: 3279,
    price_note: 'Store UE Minisforum (€3.279, 128GB, fine 2025) — da verificare',
    description:
      'Workstation compatta con Ryzen AI Max+ 395 e 128GB di memoria unificata: alternativa “x86” al DGX Spark per chi vuole restare su Windows/Linux x86 con ROCm. Pensata per inferenza LLM locale su modelli di grandi dimensioni.',
    specs: {
      cpu: 'AMD Ryzen AI Max+ 395 (16C/32T)',
      ram: '128GB LPDDR5X unificata',
      gpu_npu: 'Radeon 8060S (40 CU) + NPU XDNA 2',
      tops_ai: '126 TOPS totali (dato AMD — da verificare)',
      storage: 'M.2 NVMe (configurazioni multiple — da verificare)',
      power_w: 'Da verificare',
      os: 'Windows 11 Pro / Linux',
    },
    buy_links: [{ label: 'Minisforum EU', url: 'https://minisforumpc.eu/' }],
  },
  {
    slug: 'raspberry-pi-5-ai-hat-plus',
    image_urls: [
      'https://assets.raspberrypi.com/static/5c6df05d1ea0c51f89423d744a18033f/25682/hat.webp',
      'https://assets.raspberrypi.com/static/c671804c05a51efc4e3c2a1bdcbafbcf/e8238/raspberry-pi-5.webp',
    ],
    name: 'Raspberry Pi 5 + AI HAT+ (26 TOPS)',
    brand: 'Raspberry Pi',
    category: CATEGORIES.DEV_BOARD,
    price_eur: null,
    price_note: 'Da verificare — AI HAT+ 26 TOPS $110 (13 TOPS $70) + Pi 5 8GB ~€85; kit completo ~€200',
    description:
      'Il modo più economico per fare AI edge “vera”: l’AI HAT+ aggiunge un acceleratore Hailo-8 da 26 TOPS al Pi 5 via PCIe Gen 3. Perfetto per computer vision (object detection, segmentation) con la camera stack di Raspberry Pi OS; non adatto agli LLM (serve l’AI HAT+ 2 da 40 TOPS).',
    specs: {
      cpu: 'Broadcom BCM2712, 4-core Cortex-A76 @ 2,4GHz',
      ram: '8GB LPDDR4X (Pi 5)',
      gpu_npu: 'VideoCore VII + acceleratore Hailo-8',
      tops_ai: '26 TOPS INT8 (Hailo-8; variante 13 TOPS con Hailo-8L)',
      storage: 'microSD',
      power_w: '~25W totale con carico AI (da verificare)',
      os: 'Raspberry Pi OS (Debian)',
    },
    buy_links: [
      { label: 'Raspberry Pi', url: 'https://www.raspberrypi.com/products/ai-hat/' },
      { label: 'Raspberry Pi 5', url: 'https://www.raspberrypi.com/products/raspberry-pi-5/' },
    ],
  },
  {
    slug: 'geekom-gt1-mega',
    image_urls: [
      'https://img.geekom.it/geekomit/2026/07/GT1-Mega-new.webp',
    ],
    name: 'Geekom GT1 Mega',
    brand: 'Geekom',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: 1149,
    price_note: 'Listino Amazon UE (€1.149, 32GB/2TB) — da verificare, prezzi molto variabili',
    description:
      'Mini PC Windows con Core Ultra 9 185H e NPU AI Boost, tra i modelli cinesi “premium” più venduti su Amazon. Buona connettività (2× USB4, 2,5GbE) e chassis in metallo; la NPU da 11 TOPS è sufficiente solo per le funzioni AI di Windows, non per LLM locali seri.',
    specs: {
      cpu: 'Intel Core Ultra 9 185H (16C/22T)',
      ram: '32GB DDR5 (espandibile — da verificare)',
      gpu_npu: 'Intel Arc iGPU + NPU AI Boost',
      tops_ai: '~34 TOPS piattaforma (11 TOPS NPU — da verificare)',
      storage: 'SSD 2TB PCIe 4.0',
      power_w: 'Da verificare (~120W alimentatore)',
      os: 'Windows 11 Pro',
    },
    buy_links: [{ label: 'Geekom', url: 'https://www.geekom.it/' }],
  },
  {
    slug: 'bosgame-m5-ai-max-395',
    image_urls: [
      'https://img-va.myshopline.com/image/store/1673232660007/M5--3.png',
      'https://img-va.myshopline.com/image/store/1673232660007/M5-Ryzen-AI-Max-395-01-0.jpeg',
      'https://img-va.myshopline.com/image/store/1673232660007/M5-Ryzen-AI-Max-395-02.jpeg',
    ],
    name: 'Bosgame M5 AI Mini Desktop (Ryzen AI Max+ 395)',
    brand: 'Bosgame',
    category: CATEGORIES.MINI_PC_WIN,
    price_eur: 2583.95,
    price_note: 'Store Bosgame EU, configurazione 128GB + 2TB (settembre 2026); la 96GB parte da ~€2.067',
    description:
      'Mini PC “Strix Halo” con Ryzen AI Max+ 395 (16C/32T Zen 5) e Radeon 8060S (40 CU RDNA 3.5). Fino a 128GB LPDDR5X-8000 saldata, di cui fino a 96GB allocabili alla GPU: esegue in locale LLM grandi (~70-120B quantizzati) senza scheda dedicata. Due slot M.2, doppia USB4, SD 4.0 e LAN 2.5G. Spedito da magazzino tedesco per l’UE.',
    specs: {
      cpu: 'AMD Ryzen AI Max+ 395 (16C/32T Zen 5, fino a 5,1GHz)',
      ram: '96 o 128GB LPDDR5X-8000 saldata (fino a 96GB allocabili alla GPU)',
      gpu_npu: 'Radeon 8060S (40 CU RDNA 3.5, 2,9GHz) + NPU XDNA 2',
      tops_ai: '50 TOPS NPU / 126 TOPS totali (dato AMD)',
      storage: 'SSD 2TB M.2 2280 PCIe 4.0 x4, 2 slot',
      ports: '2× USB4 Type-C, 3× USB 3.2 Gen2, 2× USB 2.0, SD 4.0, LAN 2.5G, HDMI',
      power_w: 'Tre profili di potenza (Quiet/Balanced/Performance), TDP fino a ~140W — da verificare',
      os: 'Windows 11',
    },
    buy_links: [
      {
        label: 'Bosgame Store',
        url: 'https://www.bosgamepc.com/products/bosgame-m5-ai-mini-desktop-ryzen-ai-max-395',
      },
    ],
  },
];
