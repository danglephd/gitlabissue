const ytdl = require('ytdl-core');

async function getYoutubeSongInfo(url) {
  // Validate input
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a valid string');
  }

  try {
    const info = await ytdl.getBasicInfo(url);
    const videoDetails = info?.videoDetails;

    if (!videoDetails) {
      throw new Error('Failed to extract video details');
    }

    return {
      title: videoDetails.title || '',
      author: videoDetails.author?.name || 'Unknown',
      lengthSeconds: videoDetails.lengthSeconds || 0,
      viewCount: videoDetails.viewCount || 0,
      thumbnails: videoDetails.thumbnails || [],
      publishDate: videoDetails.publishDate || null,
      videoId: videoDetails.videoId || '',
      description: videoDetails.description || ''
    };
  } catch (err) {
    console.error('Error fetching YouTube info:', err.message);
    throw err; // Re-throw để caller xử lý
  }
}

module.exports = { getYoutubeSongInfo };