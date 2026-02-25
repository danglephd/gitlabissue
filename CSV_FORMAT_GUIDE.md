# WizTree CSV Format - Quick Reference

## Định Dạng File

Hệ thống Movie Manage hỗ trợ định dạng CSV từ **WizTree** - công cụ phân tích kích thước disk.

### Cấu Trúc Cột (Tab-separated)

| Cột | Tên | Kiểu | Mô Tả |
|-----|-----|------|-------|
| 1 | File Name | String | Đường dẫn đầy đủ hoặc tên thư mục |
| 2 | Size | Number | Kích thước file/thư mục (bytes) |
| 3 | Allocated | Number | Dung lượng phân bổ trên disk (bytes) |
| 4 | Modified | DateTime | Ngày chỉnh sửa lần cuối |
| 5 | Attributes | Number | Thuộc tính file (Windows) |
| 6 | Files | Number | Số file trong thư mục |
| 7 | Folders | Number | Số thư mục con |

### Ví Dụ

```
File Name	Size	Allocated	Modified	Attributes	Files	Folders
D:\document\mov\	27408928579	27409072128	1/15/2026 10:42	0	31	10
D:\document\mov\Kung Fu Panda 4 (2024)\	5446297236	5446320128	12/12/2025 8:46	0	3	0
D:\document\mov\Kung Fu Panda 4 (2024)\Kung Fu Panda 4 (2024).mkv	5446153931	5446172672	11/26/2025 10:42	545	0	0
D:\document\mov\Her (2013)\	4442718786	4442750976	1/15/2026 10:42	0	1	0
D:\document\mov\Her (2013)\Her (2013).mkv	4442718786	4442750976	1/15/2026 10:42	545	0	0
```

## Cách Tạo File CSV từ WizTree

### Bước 1: Mở WizTree
- Tải từ: https://www.diskanalyzer.com/
- Chạy ứng dụng

### Bước 2: Quét Thư Mục
- Chọn thư mục gốc (ví dụ: D:\document\mov\)
- Chờ quét hoàn tất

### Bước 3: Export CSV
1. Nhấn menu hoặc File
2. Chọn "Export to CSV"
3. Lưu file với tên có ý nghĩa (ví dụ: movies.csv)

## Lưu Ý Quan Trọng

### ✅ Hỗ trợ

- **Format**: Tab-separated (TSV)
- **Encoding**: UTF-8 hoặc ASCII
- **Cấu trúc**: Phải có header row
- **Ít nhất 7 cột**: Tất cả cột bắt buộc
- **Year extraction**: Tự động từ format `(YYYY)` trong tên

### ❌ Không hỗ trợ

- Comma-separated (CSV thông thường) - phải là Tab-separated
- Thiếu cột
- Thiếu header row
- File rỗng

## Ví Dụ: Chuyển Đổi Format

### Nếu có file CSV thông thường (comma-separated)

**Trước:**
```csv
"File Name","Size","Allocated","Modified","Attributes","Files","Folders"
"D:\movie\Film (2024)","5446297236","5446320128","12/12/2025 8:46","0","3","0"
```

**Sau (Tab-separated):**
```
File Name	Size	Allocated	Modified	Attributes	Files	Folders
D:\movie\Film (2024)	5446297236	5446320128	12/12/2025 8:46	0	3	0
```

## Trích Xuất Năm Sản Xuất

Hệ thống tự động trích xuất năm từ tên file:

| Format | Năm |
|--------|-----|
| `Film (2024)` | 2024 ✅ |
| `2024 Film` | Không |
| `Film - 2024` | Không |
| `Film.2024` | Không |

**→ Năm phải ở trong dấu ngoặc `(YYYY)`**

## Kích Thước File

- **Nhỏ** (< 1 MB): Import < 1 giây ⚡
- **Trung bình** (1-10 MB): Import 1-5 giây ⏱️
- **Lớn** (> 10 MB): Import > 5 giây 🐌

## Kiểm Tra File Trước Import

### Dùng Notepad (Windows)
1. Chuột phải file → Open with → Notepad
2. Kiểm tra:
   - Dòng đầu có header?
   - Các cột cách nhau bằng tab?
   - Có dữ liệu không?

### Dùng Excel
1. Mở file bằng Excel
2. Kiểm tra:
   - Có 7 cột?
   - Dữ liệu hiển thị đúng?
   - Ngày/giờ hợp lệ?

## Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| "Không tìm thấy phim nào" | File rỗng hoặc định dạng sai | Kiểm tra file, đảm bảo tab-separated |
| "Tất cả phim đều trùng lặp" | Tất cả phim đã tồn tại | Bình thường, không có phim mới |
| Chỉ 1-2 phim được import | Hệ thống loại bỏ directory summary rows | Bình thường, chỉ import files/folders thực tế |
| Năm không được trích xuất | Format tên không đúng | Đảm bảo format: `Film (YYYY)` |

## Mẹo

🔹 **Kích thước file được ghi sai**?
- Hệ thống chỉ import những dòng có path bắt đầu bằng `D:\` (hoặc ổ đĩa khác)
- Loại bỏ summary rows tự động

🔹 **Muốn import từ ổ đĩa khác?**
- WizTree sẽ tạo CSV với path từ ổ đó
- Hệ thống hỗ trợ tất cả ổ đĩa

🔹 **Muốn lọc trước khi import?**
- Chỉnh sửa CSV bằng Excel
- Xóa những dòng không cần
- Lưu lại

---

**Tham khảo**: [WizTree Official](https://www.diskanalyzer.com/)
