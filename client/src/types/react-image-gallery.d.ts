declare module 'react-image-gallery' {
  import * as React from 'react';

  export interface ReactImageGalleryItem {
    original: string;
    thumbnail?: string;
    originalAlt?: string;
    thumbnailAlt?: string;
    description?: string;
    originalClass?: string;
    thumbnailClass?: string;
    renderItem?: () => React.ReactNode;
    renderThumbInner?: () => React.ReactNode;
  }

  export interface ReactImageGalleryProps {
    items: ReactImageGalleryItem[];
    showThumbnails?: boolean;
    showFullscreenButton?: boolean;
    showPlayButton?: boolean;
    showNav?: boolean;
    lazyLoad?: boolean;
    onSlide?: (index: number) => void;
    additionalClass?: string;
  }

  export default class ReactImageGallery extends React.Component<ReactImageGalleryProps> {}
}


