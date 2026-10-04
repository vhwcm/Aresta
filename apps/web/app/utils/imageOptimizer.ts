/**
 * Utilitário de otimização de imagens locais para o Aresta.
 * Redimensiona imagens muito grandes (ex: fotos de alta resolução de 10MB-40MB)
 * para dimensões web razoáveis (máx 1920px), evitando estouro de IndexedDB
 * e travamento do editor ProseMirror/Canvas.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}

export const MAX_IMAGE_DIMENSION = 1920;
export const COMPRESSION_QUALITY = 0.85;

/**
 * Otimiza um arquivo de imagem local antes de converter para Data URL.
 * Arquivos SVG são mantidos como vetores puros sem rasterização.
 * Em ambientes sem canvas/DOM (ex: testes headless/SSR), retorna a leitura direta com segurança.
 */
export async function optimizeImageFile(
  file: File,
  maxDimension = MAX_IMAGE_DIMENSION,
  quality = COMPRESSION_QUALITY
): Promise<OptimizedImageResult> {
  const originalSize = file.size;

  // 1. Arquivos SVG são vetoriais puros: lê diretamente sem rasterizar
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          dataUrl,
          width: 800,
          height: 600,
          originalSize,
          optimizedSize: dataUrl.length,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 2. Lê imagem original como Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 3. Fallback se executado fora do DOM do navegador (ex: SSR ou ambiente de teste restrito)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      dataUrl,
      width: 800,
      height: 600,
      originalSize,
      optimizedSize: dataUrl.length,
    };
  }

  // 4. Carrega a imagem para inspecionar dimensões e otimizar se necessário
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: width, naturalHeight: height } = img;

      // Se a imagem não possui dimensões legíveis (ex: headless ou dados corrompidos)
      if (!width || !height || width <= 0 || height <= 0) {
        return resolve({
          dataUrl,
          width: 800,
          height: 600,
          originalSize,
          optimizedSize: dataUrl.length,
        });
      }

      // Se a imagem já estiver dentro dos limites razoáveis (< 1MB e <= 1920px), mantém o original intacto
      if (file.size <= 1024 * 1024 && width <= maxDimension && height <= maxDimension) {
        return resolve({
          dataUrl,
          width,
          height,
          originalSize,
          optimizedSize: dataUrl.length,
        });
      }

      // Calcula novas dimensões preservando proporção
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ dataUrl, width, height, originalSize, optimizedSize: dataUrl.length });
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedUrl = canvas.toDataURL(outputType, quality);

        // Se a versão processada for menor ou teve redimensionamento, utiliza a versão otimizada
        if (optimizedUrl.length < dataUrl.length || width !== img.naturalWidth) {
          resolve({
            dataUrl: optimizedUrl,
            width,
            height,
            originalSize,
            optimizedSize: optimizedUrl.length,
          });
        } else {
          resolve({
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            originalSize,
            optimizedSize: dataUrl.length,
          });
        }
      } catch {
        resolve({ dataUrl, width, height, originalSize, optimizedSize: dataUrl.length });
      }
    };

    img.onerror = () => {
      resolve({ dataUrl, width: 300, height: 200, originalSize, optimizedSize: dataUrl.length });
    };

    img.src = dataUrl;
  });
}
