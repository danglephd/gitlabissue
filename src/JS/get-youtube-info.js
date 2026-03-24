/**
 * YouTube Video Info Fetcher (Node.js script)
 * Usage: node get-youtube-info.js <VIDEO_URL_OR_ID> <API_KEY>
 */

/**
 * Parse ISO 8601 duration to seconds
 * e.g., "PT4M11S" -> 251
 */
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract video ID from YouTube URL or return as-is if already ID
 */
function extractVideoId(url) {
  try {
    // If it's already a video ID (no URL characters)
    if (!url.includes('/') && !url.includes('?')) {
      return url;
    }

    const urlObj = new URL(url);

    // Handle youtube.com
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v') || '';
    }

    // Handle youtu.be
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1);
    }

    return '';
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
}

/**
 * Fetch YouTube video information with all details
 * @param {string} urlOrVideoId - Full YouTube URL or video ID
 * @param {string} apiKey - YouTube Data API v3 key
 * @returns {Promise<Object>} Complete video information
 */
async function getYoutubeInfo(urlOrVideoId, apiKey) {
  try {
    // Validate inputs
    if (!urlOrVideoId || typeof urlOrVideoId !== 'string') {
      throw new Error('Invalid URL or video ID parameter');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required');
    }

    // Extract video ID
    const videoId = extractVideoId(urlOrVideoId);
    if (!videoId) {
      throw new Error('Could not extract valid video ID from URL');
    }

    // Construct API URL with all required parts
    const api = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;

    const response = await fetch(api);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;
    const statistics = item.statistics;

    // Parse duration to seconds
    const durationSeconds = contentDetails?.duration
      ? parseDuration(contentDetails.duration)
      : 0;

    return {
      // Basic info
      videoId: item.id,
      title: snippet.title,
      description: snippet.description,
      channel: snippet.channelTitle,
      channelId: snippet.channelId,

      // Date and category
      publishedAt: snippet.publishedAt,
      categoryId: snippet.categoryId,

      // Languages
      defaultLanguage: snippet.defaultLanguage,
      defaultAudioLanguage: snippet.defaultAudioLanguage,

      // Thumbnails (all resolutions)
      thumbnails: snippet.thumbnails,
      largestThumbnail: snippet.thumbnails.maxres?.url
        || snippet.thumbnails.standard?.url
        || snippet.thumbnails.high?.url
        || snippet.thumbnails.medium?.url
        || snippet.thumbnails.default?.url,

      // Duration
      duration: contentDetails?.duration || '',
      durationSeconds: durationSeconds,

      // Video quality
      dimension: contentDetails?.dimension,
      definition: contentDetails?.definition,

      // Statistics
      viewCount: parseInt(statistics?.viewCount || '0', 10),
      likeCount: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : null,
      commentCount: statistics?.commentCount ? parseInt(statistics.commentCount, 10) : null,

      // Live status
      liveBroadcastContent: snippet.liveBroadcastContent
    };
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}

// Support both import and require
module.exports = { getYoutubeInfo, parseDuration, extractVideoId };

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node get-youtube-info.js <VIDEO_URL_OR_ID> <API_KEY>');
    console.error('Example: node get-youtube-info.js https://www.youtube.com/watch?v=8cFMytiCh74 YOUR_API_KEY');
    process.exit(1);
  }

  const [urlOrId, apiKey] = args;
  getYoutubeInfo(urlOrId, apiKey)
    .then(info => {
      console.log('✅ YouTube Video Info:');
      console.log(JSON.stringify(info, null, 2));
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}
