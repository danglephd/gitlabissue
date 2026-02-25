# Movie Manage Feature

## Giới Thiệu

Movie Manage là một trang quản lý thư viện phim cho phép bạn:
- ✅ Nhập danh sách phim từ file CSV
- ✅ Lưu trữ thông tin phim vào database chính (Firebase)
- ✅ Kiểm tra và loại bỏ bản sao trùng lặp
- ✅ Theo dõi trạng thái xử lý phim
- ✅ Tìm kiếm và lọc danh sách phim

---

## Cấu Trúc Tệp

### Models
- **[src/app/shared/models/movie.model.ts](../shared/models/movie.model.ts)** - Định nghĩa interface Movie và enum

### Services
- **[src/app/services/csv-parser.service.ts](../services/csv-parser.service.ts)** - Dịch vụ phân tích CSV
- **[src/app/services/movie.realtimedb.service.ts](../services/movie.realtimedb.service.ts)** - Dịch vụ Firebase Realtime Database

### Components
- **[src/app/movie-manage/movie-manage.component.ts](./movie-manage.component.ts)** - Logic chính
- **[src/app/movie-manage/movie-manage.component.html](./movie-manage.component.html)** - Template
- **[src/app/movie-manage/movie-manage.component.css](./movie-manage.component.css)** - Styling

---

## Chức Năng Chi Tiết

### 1. Nhập Từ File CSV

**Định dạng CSV hỗ trợ (WizTree format):**
```
File Name	Size	Allocated	Modified	Attributes	Files	Folders
D:\document\mov\Kung Fu Panda 4 (2024)	5446297236	5446320128	12/12/2025 8:46	0	3	0
D:\document\mov\Her (2013)	4442718786	4442750976	1/15/2026 10:42	0	1	0
```

**Quy trình nhập:**
1. Chọn file CSV từ máy
2. Nhấn "Nhập Dữ Liệu"
3. Hệ thống sẽ:
   - Phân tích nội dung file
   - Trích xuất thông tin phim (tên, đường dẫn, năm sản xuất, kích thước, v.v.)
   - Kiểm tra bản sao trong file
   - Kiểm tra bản sao với dữ liệu hiện có
   - Lưu các phim mới vào database

### 2. Kiểm Tra Trùng Lặp

Hệ thống sẽ tự động phát hiện và cảnh báo:
- **Bản sao trong file**: Các phim có đường dẫn giống nhau trong cùng một file
- **Bản sao với database**: Các phim đã tồn tại trong cơ sở dữ liệu

Khi có bản sao, giao diện sẽ hiển thị cảnh báo với danh sách chi tiết.

### 3. Lưu Trữ Dữ Liệu

Mỗi phim được lưu với các thông tin:
```typescript
interface Movie {
  id: string;              // ID duy nhất
  fileName: string;        // Tên file/thư mục
  path: string;           // Đường dẫn đầy đủ
  size: number;           // Kích thước (bytes)
  allocated: number;      // Dung lượng phân bổ (bytes)
  modified: Date;         // Ngày chỉnh sửa cuối cùng
  attributes: number;     // Thuộc tính file
  files: number;          // Số file trong thư mục
  folders: number;        // Số thư mục con
  year?: number;          // Năm sản xuất (được trích xuất)
  createdAt: Date;        // Ngày thêm vào hệ thống
  isProcessed: boolean;   // Đã xử lý hay chưa
  tags?: string[];        // Thẻ tuỳ chọn
}
```

### 4. Quản Lý Phim

**Thống kê:**
- Tổng số phim
- Số phim đã xử lý
- Số phim chưa xử lý

**Tìm kiếm và lọc:**
- Tìm kiếm theo tên, đường dẫn, năm sản xuất
- Lọc theo trạng thái: Tất cả / Đã Xử Lý / Chưa Xử Lý

**Hành động:**
- ✓ Đánh dấu phim là đã xử lý
- ✗ Xóa phim khỏi database

---

## Cách Sử Dụng

### Bước 1: Truy Cập Trang Movie Manage
Từ menu điều hướng, chọn "Movie Manage" hoặc truy cập `/movie-manage`

### Bước 2: Nhập File CSV
1. Nhấn "Chọn file CSV..." để chọn file từ máy
2. Chọn file CSV có định dạng WizTree
3. Nhấn "Nhập Dữ Liệu"

### Bước 3: Xử Lý Cảnh Báo Trùng Lặp
Nếu có phim trùng lặp:
- Xem danh sách phim trùng lặp
- Nhấn "Bỏ Qua" để tiếp tục nhập các phim mới

### Bước 4: Quản Lý Danh Sách
- Sử dụng thanh tìm kiếm để tìm phim
- Dùng các nút lọc để xem các nhóm phim khác nhau
- Đánh dấu phim là đã xử lý khi cần
- Xóa phim nếu không cần

---

## Thông Tin Kỹ Thuật

### Dependencies
- **Angular Material**: Cho UI components (Card, Button, Form, Icon, v.v.)
- **Firebase**: Cho Realtime Database
- **RxJS**: Cho reactive programming

### Service Methods

#### CsvParserService
```typescript
parseMovieCsv(csvContent: string): Movie[]
removeDuplicates(movies: Movie[]): Movie[]
findDuplicates(movies: Movie[]): { duplicates: Movie[], unique: Movie[] }
```

#### MovieRealtimedbService
```typescript
getMovies(): Observable<Movie[]>
getCurrentMovies(): Movie[]
addMovie(movie: Movie): Promise<void>
addMovies(movies: Movie[]): Promise<any>
updateMovie(movie: Movie): Promise<void>
deleteMovie(movieId: string): Promise<void>
deleteMovies(movieIds: string[]): Promise<any>
searchMovies(query: string): Movie[]
getMoviesByYear(year: number): Movie[]
findDuplicatesInDb(): Movie[]
getMovieCount(): number
```

---

## Lưu Ý Quan Trọng

1. **Định dạng CSV**: File CSV phải có định dạng WizTree (tab-separated)
2. **Cột bắt buộc**: File phải chứa ít nhất 7 cột: File Name, Size, Allocated, Modified, Attributes, Files, Folders
3. **Trích xuất Năm**: Hệ thống tự động trích xuất năm từ tên file (ví dụ: "Film (2024)")
4. **Cơ sở dữ liệu**: Dữ liệu được lưu trong Firebase Realtime Database tại path `movies`

---

## Ví Dụ

### Ví dụ File CSV
```
File Name	Size	Allocated	Modified	Attributes	Files	Folders
D:\document\mov\	27408928579	27409072128	1/15/2026 10:42	0	31	10
D:\document\mov\Kung Fu Panda 4 (2024)\	5446297236	5446320128	12/12/2025 8:46	0	3	0
D:\document\mov\Kung Fu Panda 4 (2024)\Kung Fu Panda 4 (2024).mkv	5446153931	5446172672	11/26/2025 10:42	545	0	0
D:\document\mov\Her (2013)\	4442718786	4442750976	1/15/2026 10:42	0	1	0
```

### Kết Quả Nhập
Các phim sẽ được lưu với thông tin:
- **Kung Fu Panda 4** - Năm: 2024, Kích thước: 5.4 GB, Đường dẫn: D:\document\mov\Kung Fu Panda 4...
- **Her** - Năm: 2013, Kích thước: 4.4 GB, Đường dẫn: D:\document\mov\Her...

---

## Mở Rộng Trong Tương Lai

Các tính năng có thể thêm:
- 🔄 Import từ nhiều nguồn khác (folder direct, API, v.v.)
- 🏷️ Hệ thống tagging và categorization
- 📊 Dashboard thống kê chi tiết
- 🎬 Tích hợp thông tin phim từ TMDB/IMDB
- 📁 Quản lý folder phim
- 🎯 Recommend phim dựa trên lịch sử xem
