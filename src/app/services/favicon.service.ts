import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FaviconService {
  private faviconElement: HTMLLinkElement;

  // Ánh xạ tuyến đường đến favicon
  private faviconMap: { [key: string]: string } = {
    'issue': 'assets/favicons/issue-favicon.svg',
    'wallet': 'assets/favicons/wallet-favicon.svg',
    'wallet-calendar': 'assets/favicons/calendar-favicon.svg',
    'game-tim-so': 'assets/favicons/game-favicon.svg',
    'dog-whistle': 'assets/favicons/whistle-favicon.svg',
    'movie-manage': 'assets/favicons/movie-favicon.svg',
    'default': 'assets/favicon.svg'
  };

  constructor() {
    this.faviconElement = this.getFaviconElement();
  }

  /**
   * Lấy hoặc tạo phần tử link favicon
   */
  private getFaviconElement(): HTMLLinkElement {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    
    // Nếu không có favicon, tạo mới
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      document.head.appendChild(favicon);
    }
    
    return favicon;
  }

  /**
   * Cập nhật favicon dựa trên trang hiện tại
   * @param route - Tuyến đường hiện tại
   */
  setFaviconByRoute(route: string): void {
    // Trích xuất route chính (ví dụ: '/wallet' -> 'wallet')
    const mainRoute = route.split('/').filter(r => r)[0];
    const faviconUrl = this.faviconMap[mainRoute] || this.faviconMap['default'];
    
    this.setFavicon(faviconUrl);
  }

  /**
   * Cập nhật favicon với URL cụ thể
   * @param url - URL của favicon
   */
  setFavicon(url: string): void {
    this.faviconElement.href = url;
  }

  /**
   * Lấy danh sách tất cả các favicon có sẵn
   */
  getFaviconMap(): { [key: string]: string } {
    return { ...this.faviconMap };
  }

  /**
   * Thêm hoặc cập nhật ánh xạ favicon
   * @param route - Tuyến đường
   * @param iconUrl - URL của icon
   */
  addFaviconMapping(route: string, iconUrl: string): void {
    this.faviconMap[route] = iconUrl;
  }

  /**
   * Đặt lại favicon về mặc định
   */
  resetFavicon(): void {
    this.setFavicon(this.faviconMap['default']);
  }
}
