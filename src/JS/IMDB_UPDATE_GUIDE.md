# Hướng Dẫn Cập Nhật IMDB Links

## Giới Thiệu
Script `update-imdb-links.js` giúp tự động cập nhật IMDB links cho tất cả phim từ OMDb API.

## Chuẩn Bị

### Bước 1: Lấy OMDb API Key
1. Truy cập: http://www.omdbapi.com/apikey.aspx
2. Điền email và chọn bản miễn phí
3. Kiểm tra email để xác nhận
4. Lấy API key từ email hoặc dashboard

### Bước 2: Cấu Hình API Key
Mở file `update-imdb-links.js` và tìm dòng:
```javascript
const OMDB_API_KEY = 'YOUR_OMDB_API_KEY_HERE';
```

Thay thế `YOUR_OMDB_API_KEY_HERE` bằng API key của bạn:
```javascript
const OMDB_API_KEY = 'k8b5c2f1'; // Ví dụ
```

## Sử Dụng

### Chạy Script
```bash
node update-imdb-links.js
```

### Output Ví Dụ
```
📚 Đang đọc file JSON...

🎬 Tìm thấy 300 phim

[1/300] Slumberland (2022)... ✅ Slumberland (2022) -> https://www.imdb.com/title/tt13320662/
[2/300] Good Luck Chuck (2007)... ✅ Good Luck Chuck (2007) -> https://www.imdb.com/title/tt0869735/
[3/300] Dragon Ball - (1986)... ⚠️  Không tìm thấy: Dragon Ball - (1986)
...
✅ Cập nhật 298 phim, bỏ qua 0 phim

💾 Đang lưu file JSON...
✅ Hoàn tất!
```

## Tính Năng

✅ **Tự Động Tìm Kiếm**
- Tìm IMDB ID dựa trên tên phim và năm sản xuất
- Tự động làm sạch tên phim (loại bỏ kỹ hiệu, năm, v.v.)

✅ **Xử Lý Lỗi**
- Nếu không tìm thấy phim, để trống IMDBlink
- Nếu API lỗi, tiếp tục với phim kế tiếp

✅ **Rate Limiting**
- Chờ 100ms giữa các request để tránh bị block

✅ **Thông Minh**
- Bỏ qua các phim đã có IMDB link
- Hiển thị tiến trình real-time

## Lưu Ý Quan Trọng

⚠️ **Giới Hạn API Miễn Phí**
- OMDb API miễn phí giới hạn 1000 request/ngày
- Nếu có quá 1000 phim, chạy script nhiều lần trong các ngày khác nhau

⚠️ **Chất Lượng Tìm Kiếm**
- Các phim nhỏ, phim quốc tế có thể không tìm thấy
- Có thể cập nhật IMDBlink thủ công cho các phim này

⚠️ **Tên Phim**
- Script dựa trên tên phim trong fileName
- Nếu tên quá dài hoặc có ký tự đặc biệt, có thể không tìm được

## Khắc Phục Sự Cố

### Lỗi: "OMDb API key chưa được cấu hình!"
→ Cập nhật `OMDB_API_KEY` trong file `update-imdb-links.js`

### Lỗi: "Không tìm thấy" cho các phim phổ biến
→ Có thể API key hết hạn hoặc tên phim quá khác biệt
→ Thử cập nhật thủ công hoặc chỉnh sửa tên phim

### Script chạy rất chậm
→ Đây là bình thường vì chờ rate limiting
→ Mỗi phim mất ~100ms, 300 phim = ~30 giây

## File Liên Quan
- `update-imdb-links.js` - Script cập nhật
- `src/assets/data/projp21-17b04-default-rtdb-movies-export.json` - File dữ liệu

## Liên Hệ OMDb API
- Website: http://www.omdbapi.com/
- Tài liệu: http://www.omdbapi.com/
