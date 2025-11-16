/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14
  
  // En développement, désactiver le cache pour éviter les problèmes
  ...(process.env.NODE_ENV === "development" && {
    onDemandEntries: {
      // Garder les pages en mémoire pendant 60 secondes
      maxInactiveAge: 60 * 1000,
      // Nombre de pages à garder simultanément
      pagesBufferLength: 5,
    },
  }),
};

module.exports = nextConfig;

