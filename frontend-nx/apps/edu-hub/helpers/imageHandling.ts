import { getPublicImageUrl } from "./filehandling";

export const getBackgroundImage = (filePath: string | null): Promise<string> => {

    // Predefined image sizes
    const sizes = [460, 640, 768, 1024, 1280, 1536];

    // Get screen width
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1024; // Fallback to 1024 if SSR

    // Find the most suitable image size
    let optimalSize = sizes[0];
    if (typeof window !== "undefined") {
      for (const size of sizes) {
        if (screenWidth <= size) {
          optimalSize = size;
          break;
        }
      }
    }
  
    // Construct the optimal image URL
    const optimalImageLink = getPublicImageUrl(filePath, optimalSize);

    // Construct the optimal image URL
    const oldOptimalImageLink = filePath
      ? `${filePath.split('.').slice(0, -1).join('.')}-${optimalSize}.${filePath.split('.').pop()}`
      : '';
  
    // Fallback to the original image if the optimal one is not available or to random image if none is provided
    return new Promise((resolve) => {
      const img = new Image();
      img.src = optimalImageLink || oldOptimalImageLink;

      img.onload = () => {
        resolve(optimalImageLink);
      };

      img.onerror = () => {
        resolve(filePath || 'https://picsum.photos/1280/620');
      };
    });
  };


  export const getTileImage = (filePath: string | null): Promise<string> => {

    // Set tile image size
    const tileImageSize = 460;

    // Construct the optimal image URL
    const optimalImageLink = getPublicImageUrl(filePath, tileImageSize);

    // Construct the old form of optimal image URL for backwards compatibility
    // (it is not using the new standard format webp)
    const oldOptimalImageLink = filePath
      ? `${filePath.split('.').slice(0, -1).join('.')}-${tileImageSize}.${filePath.split('.').pop()}`
      : '';
  
    // Fallback to the original image if the optimal one is not available or to random image if none is provided
    return new Promise((resolve) => {
      const img = new Image();
      img.src = optimalImageLink || oldOptimalImageLink;

      img.onload = () => {
        resolve(optimalImageLink);
      };

      img.onerror = () => {
        resolve(filePath || 'https://picsum.photos/240/144');
      };
    });
  };
