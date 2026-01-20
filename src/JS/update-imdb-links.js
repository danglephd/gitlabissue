#!/usr/bin/env node
// TO RUN: node src/JS/update-imdb-links.js

const fs = require('fs');
const https = require('https');
const path = require('path');

// OMDb API Key - Thay đổi với API key của bạn
// Lấy từ: http://www.omdbapi.com/apikey.aspx
const OMDB_API_KEY = '25b60885';

// Đường dẫn file JSON
const JSON_FILE = path.join(__dirname, 'src/assets/data/projp21-17b04-default-rtdb-movies-export.json');

/**
 * Gọi OMDb API để tìm IMDB ID
 */
function getIMDBLink(movieName, year) {
  return new Promise((resolve) => {
    // Nếu không có API key, trả về empty
    if (OMDB_API_KEY === 'YOUR_OMDB_API_KEY_HERE') {
      console.warn('⚠️  OMDb API key chưa được cấu hình. Bỏ qua.');
      resolve('');
      return;
    }

    // Làm sạch tên phim
    const cleanName = movieName
      .replace(/\s*\(\d{4}\).*$/, '') // Loại bỏ năm và phần sau
      .replace(/[-_]/g, ' ')
      .trim();

    const queryParams = new URLSearchParams({
      apikey: OMDB_API_KEY,
      t: cleanName,
      type: 'movie',
      y: year || ''
    });

    const url = `https://www.omdbapi.com/?${queryParams}`;
    //ghi log url
    console.log('Calling OMDb API:', url);


    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.Response === 'True' && result.imdbID) {
            const imdbLink = `https://www.imdb.com/title/${result.imdbID}/`;
            console.log(`✅ ${movieName} -> ${imdbLink}`);
            resolve(imdbLink);
          } else {
            console.log(`⚠️  Không tìm thấy: ${movieName}`);
            resolve('');
            return;
          }
        } catch (error) {
          console.error(`❌ Lỗi parse JSON cho ${movieName}:`, error.message);
          resolve('');
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Lỗi API call cho ${movieName}:`, error.message);
      resolve('');
    });
  });
}

/**
 * Chờ một khoảng thời gian
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cập nhật IMDB links cho tất cả phim
 */
async function updateIMDBLinks() {
  try {
    console.log('📚 Đang đọc file JSON...');
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

    const movies = Object.values(jsonData);
    console.log(`\n🎬 Tìm thấy ${movies.length} phim\n`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      // Nếu đã có IMDB link, bỏ qua
      if (movie.IMDBlink && movie.IMDBlink.trim()) {
        skipped++;
        continue;
      }

      process.stdout.write(`[${i + 1}/${movies.length}] ${movie.fileName.substring(0, 50)}... `);

      const imdbLink = await getIMDBLink(movie.fileName, movie.year);
      
      if (imdbLink) {
        movie.IMDBlink = imdbLink;
        updated++;
      }

      // Tránh rate limiting - chờ 100ms giữa các request
      await delay(100);
    }

    console.log(`\n✅ Cập nhật ${updated} phim, bỏ qua ${skipped} phim`);

    console.log('\n💾 Đang lưu file JSON...');
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log('✅ Hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Kiểm tra API key
if (OMDB_API_KEY === 'YOUR_OMDB_API_KEY_HERE') {
  console.error('❌ Lỗi: OMDb API key chưa được cấu hình!');
  console.error('\nHướng dẫn:');
  console.error('1. Truy cập: http://www.omdbapi.com/apikey.aspx');
  console.error('2. Lấy API key miễn phí');
  console.error('3. Cập nhật biến OMDB_API_KEY trong file này');
  console.error('4. Chạy lại: node update-imdb-links.js');
  process.exit(1);
}

// Chạy
updateIMDBLinks();
