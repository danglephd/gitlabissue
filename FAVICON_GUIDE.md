# 🎨 Hướng dẫn Favicon Động

## 📖 Tổng quan

Hệ thống favicon động này tự động thay đổi favicon (biểu tượng trình duyệt) dựa trên trang hiện tại mà người dùng đang xem. Khi chuyển sang một trang khác, favicon cũng thay đổi theo.

## 🏗️ Kiến trúc

### Các thành phần chính:

1. **FaviconService** (`src/app/services/favicon.service.ts`)
   - Quản lý việc cập nhật favicon
   - Ánh xạ các tuyến đường (route) đến các biểu tượng
   - Cung cấp các phương thức để làm việc với favicon

2. **AppComponent** (`src/app/app.component.ts`)
   - Lắng nghe các sự kiện điều hướng
   - Gọi FaviconService để cập nhật favicon khi người dùng chuyển trang

3. **Favicon Assets** (`src/assets/favicons/`)
   - Các file SVG cho từng trang

## 📁 Cấu trúc tập tin

```
src/
├── app/
│   ├── services/
│   │   └── favicon.service.ts    ← Dịch vụ favicon
│   └── app.component.ts           ← Component chính (đã cập nhật)
├── assets/
│   ├── favicon.svg                ← Favicon mặc định
│   └── favicons/
│       ├── issue-favicon.svg      ← Icon cho Issues
│       ├── wallet-favicon.svg     ← Icon cho Wallet
│       ├── calendar-favicon.svg   ← Icon cho Calendar
│       ├── game-favicon.svg       ← Icon cho Game
│       ├── whistle-favicon.svg    ← Icon cho Dog Whistle
│       └── movie-favicon.svg      ← Icon cho Movie Manage
└── index.html                     ← Tập tin HTML chính
```

## 🚀 Cách hoạt động

### Workflow:

```
1. Ứng dụng khởi động
   ↓
2. AppComponent.ngOnInit() chạy
   ↓
3. FaviconService thiết lập favicon ban đầu dựa trên URL hiện tại
   ↓
4. Người dùng nhấp vào liên kết điều hướng
   ↓
5. Router.events phát ra NavigationEnd event
   ↓
6. AppComponent lắng nghe sự kiện này
   ↓
7. FaviconService.setFaviconByRoute() được gọi
   ↓
8. Favicon được cập nhật trong DOM
```

## 🛠️ Sử dụng FaviconService

### Đặt favicon dựa trên tuyến đường:
```typescript
this.faviconService.setFaviconByRoute('/wallet');
```

### Đặt favicon trực tiếp:
```typescript
this.faviconService.setFavicon('assets/favicons/custom-icon.svg');
```

### Thêm ánh xạ favicon mới:
```typescript
this.faviconService.addFaviconMapping('new-page', 'assets/favicons/new-icon.svg');
```

### Đặt lại favicon mặc định:
```typescript
this.faviconService.resetFavicon();
```

## 🎯 Ánh xạ Tuyến đường → Favicon

| Tuyến đường | Favicon | Mô tả |
|-------------|---------|-------|
| `/issue` | 🔴 issue-favicon.svg | Icon vé/báo cáo lỗi (đỏ) |
| `/wallet` | 🔵 wallet-favicon.svg | Icon ví tiền (xanh) |
| `/wallet-calendar` | 💚 calendar-favicon.svg | Icon lịch (xanh nhạt) |
| `/game-tim-so` | 🔶 game-favicon.svg | Icon tay cầm (cam) |
| `/dog-whistle` | 💜 whistle-favicon.svg | Icon còi (tím) |
| `/movie-manage` | 🟠 movie-favicon.svg | Icon phim (vàng cam) |

## 💻 Thêm Tuyến đường và Favicon Mới

Nếu bạn thêm tuyến đường mới, làm theo các bước:

### 1. Tạo biểu tượng SVG
Tạo file mới tại: `src/assets/favicons/your-page-favicon.svg`

### 2. Cập nhật FaviconService
Chỉnh sửa `src/app/services/favicon.service.ts`:

```typescript
private faviconMap: { [key: string]: string } = {
  // ... tuyến đường hiện tại ...
  'your-page': 'assets/favicons/your-page-favicon.svg'
};
```

### 3. Cập nhật AppRoutingModule
Thêm tuyến đường mới vào routing.

## 🎨 Tùy chỉnh Favicon

### Sử dụng ảnh PNG thay vì SVG:
Tạo file PNG icon (32x32 hoặc 64x64 pixels) và cập nhật ánh xạ:

```typescript
'my-page': 'assets/favicons/my-page-favicon.png'
```

### Tạo favicon từ Unicode Emoji:
```typescript
// Cách tiếp cận thay thế - sử dụng HTML Canvas
private setFaviconFromEmoji(emoji: string): void {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  
  const ctx = canvas.getContext('2d');
  ctx.font = '24px Arial';
  ctx.fillText(emoji, 4, 26);
  
  const dataUrl = canvas.toDataURL();
  this.setFavicon(dataUrl);
}
```

## 🔧 Cấu hình nâng cao

### Đổi màu hoặc kiểu dáng SVG:
Chỉnh sửa các tệp SVG trong thư mục `favicons/`. Ví dụ, để thay đổi màu nền trong `issue-favicon.svg`:

```xml
<style>
  .issue-bg { fill: #FF6B6B; }  ← Thay đổi mã màu này
</style>
```

### Thêm hiệu ứng chuyển động:
Bạn có thể thêm CSS animations vào SVG:

```xml
<defs>
  <style>
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .rotating {
      animation: rotate 4s linear infinite;
      transform-origin: center;
    }
  </style>
</defs>
```

## 🧪 Kiểm thử

### Kiểm thử thủ công:
1. Chạy ứng dụng: `ng serve`
2. Mở DevTools (F12) → Console
3. Chuyển qua các trang khác nhau
4. Quan sát favicon thay đổi trong tab trình duyệt

### Kiểm thử lập trình:
```typescript
// Kiểm thử FaviconService
it('should set favicon by route', () => {
  service.setFaviconByRoute('/wallet');
  const favicon = document.querySelector("link[rel='icon']");
  expect(favicon.getAttribute('href')).toContain('wallet-favicon');
});
```

## 📱 Hỗ trợ trình duyệt

Favicon động được hỗ trợ bởi tất cả các trình duyệt hiện đại:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 💡 Mẹo và Thương lượng

### Tính năng:
- ✅ Đơn giản và nhẹ
- ✅ Không phụ thuộc thư viện bên ngoài
- ✅ Dễ mở rộng
- ✅ Hoạt động với SSR (Server-Side Rendering)

### Hạn chế:
- Một số trình duyệt cũ có thể không hỗ trợ cập nhật favicon động
- Favicon được lưu trong bộ nhớ cache trình duyệt - có thể cần Ctrl+F5 để xem thay đổi

## 🐛 Khắc phục sự cố

### Favicon không thay đổi:
1. Xóa bộ nhớ cache trình duyệt (Ctrl+Shift+Delete)
2. Làm mới trang (Ctrl+F5)
3. Kiểm tra console để xem lỗi
4. Đảm bảo các file SVG của tệp tồn tại

### Favicon bị sai:
1. Kiểm tra đường dẫn tệp trong `faviconMap`
2. Đảm bảo các file SVG hợp lệ
3. Kiểm tra DevTools → Elements → `<head>` để xem href hiện tại

## 📚 Tài liệu bổ sung

- [MDN: Favicon](https://developer.mozilla.org/en-US/docs/Glossary/Favicon)
- [SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [Angular Router Events](https://angular.io/api/router/Router#events)

## 🎓 Các ý tưởng mở rộng

1. **Favicon Thông báo**: Hiển thị số lượng thông báo trên favicon
2. **Favicon Status**: Thay đổi favicon dựa trên trạng thái ứng dụng
3. **Favicon Tối**: Tạo biến thể tương thích với chế độ tối
4. **Favicon Hoạt hình**: Sử dụng ảnh GIF cho các biểu tượng động
5. **Favicon Quốc tế hóa**: Các biểu tượng khác nhau cho các ngôn ngữ khác nhau

---

📝 **Ghi chú**: Nếu bạn thêm/sửa đổi các tuyến đường hoặc tạo favicon mới, hãy nhớ cập nhật `faviconMap` trong dịch vụ.
