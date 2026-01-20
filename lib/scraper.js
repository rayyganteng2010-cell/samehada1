const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v1.samehadaku.how';

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    return data;
  } catch (error) {
    console.error('Error fetching:', error.message);
    return null;
  }
}

// Scraper untuk halaman utama
async function getHomePage() {
  const html = await fetchHTML(BASE_URL);
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const animeList = [];

  // Ambil dari berbagai section
  $('.animepost, article, .post').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt, h2, h3').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score, .rating').text().trim();
    const type = $element.find('.type, .tipe').text().trim();
    const link = $element.find('a').attr('href');
    
    if (title && thumbnail && link && title.length > 2) {
      const slug = link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '');
      
      animeList.push({
        id: index + 1,
        title,
        thumbnail,
        rating: parseFloat(rating) || 0,
        type,
        link: `/${slug}`
      });
    }
  });

  return {
    success: true,
    data: animeList,
    total: animeList.length
  };
}

// Scraper untuk pencarian
async function searchAnime(query) {
  const html = await fetchHTML(`${BASE_URL}/?s=${encodeURIComponent(query)}`);
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const results = [];

  $('.animposx, .animepost, article').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt, h2, .title').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score').text().trim();
    const type = $element.find('.type').text().trim();
    const episode = $element.find('.epx').text().trim();
    const link = $element.find('a').attr('href');
    
    if (title && thumbnail) {
      const slug = link ? link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '') : '';
      
      results.push({
        id: index + 1,
        title,
        thumbnail,
        rating: parseFloat(rating) || 0,
        type,
        episode,
        link: `/${slug}`
      });
    }
  });

  return {
    success: true,
    query,
    results,
    total: results.length
  };
}

// Scraper untuk anime terbaru - DIPERBAIKI
async function getLatestAnime() {
  const html = await fetchHTML(BASE_URL + '/anime-terbaru/');
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const latestAnime = [];

  // Ambil dari daftar anime terbaru
  $('.animepost, .daftar, .post, article').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt, h2, h3').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const episode = $element.find('.epx').text().trim() || 'Episode 1';
    const date = $element.find('.date').text().trim() || new Date().toLocaleDateString('id-ID');
    const link = $element.find('a').attr('href');
    
    if (title && thumbnail) {
      const slug = link ? link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '') : '';
      
      latestAnime.push({
        id: index + 1,
        title,
        thumbnail,
        episode,
        date,
        link: `/${slug}`
      });
    }
  });

  // Fallback: cari semua post dengan gambar
  if (latestAnime.length === 0) {
    $('article').each((index, element) => {
      const $element = $(element);
      const title = $element.find('.entry-title, h2').text().trim();
      const thumbnail = $element.find('.wp-post-image, img').attr('src');
      const link = $element.find('a').attr('href');
      
      if (title && thumbnail) {
        const slug = link ? link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '') : '';
        
        latestAnime.push({
          id: index + 1,
          title,
          thumbnail,
          episode: 'Latest',
          date: 'Today',
          link: `/${slug}`
        });
      }
    });
  }

  return {
    success: true,
    data: latestAnime,
    total: latestAnime.length
  };
}

// Scraper untuk jadwal rilis - DIPERBAIKI
async function getSchedule() {
  const html = await fetchHTML(BASE_URL + '/jadwal-rilis/');
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const schedule = {
    senin: [],
    selasa: [],
    rabu: [],
    kamis: [],
    jumat: [],
    sabtu: [],
    minggu: []
  };

  console.log('Parsing schedule page...');

  // Cari section jadwal berdasarkan hari
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  
  days.forEach(day => {
    // Cari element yang mengandung nama hari
    $(`div:contains("${day}"), .${day}, #${day}`).each((index, element) => {
      const $section = $(element);
      
      // Cari semua anime di section ini
      $section.find('a').each((i, animeEl) => {
        const $anime = $(animeEl);
        const title = $anime.text().trim();
        const link = $anime.attr('href');
        
        if (title && title.length > 2 && !title.toLowerCase().includes(day)) {
          const slug = link ? link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '') : '';
          
          schedule[day].push({
            id: i + 1,
            title,
            time: 'Unknown',
            episode: 'Latest',
            link: `/${slug}`
          });
        }
      });
    });
  });

  // Alternative method: parse table atau list
  if (Object.values(schedule).flat().length === 0) {
    // Coba parse berdasarkan struktur umum
    $('ul, ol').each((index, list) => {
      const $list = $(list);
      const listText = $list.text().toLowerCase();
      
      days.forEach(day => {
        if (listText.includes(day)) {
          $list.find('li').each((i, li) => {
            const $li = $(li);
            const title = $li.find('a').text().trim();
            const link = $li.find('a').attr('href');
            
            if (title) {
              const slug = link ? link.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '') : '';
              
              schedule[day].push({
                id: i + 1,
                title,
                time: 'Unknown',
                episode: 'Latest',
                link: `/${slug}`
              });
            }
          });
        }
      });
    });
  }

  return {
    success: true,
    schedule,
    updated: new Date().toISOString()
  };
}

// Scraper untuk detail anime
async function getAnimeDetail(slug) {
  const url = `${BASE_URL}/anime/${slug}/`;
  const html = await fetchHTML(url);
  if (!html) return { error: 'Anime not found' };

  const $ = cheerio.load(html);
  
  // Informasi utama
  const title = $('h1.entry-title').text().trim() || $('h1').text().trim();
  const thumbnail = $('.thumb img, .wp-post-image').attr('src');
  const synopsis = $('.entry-content p').first().text().trim() || 
                   $('.sinopc').text().trim() ||
                   $('p').filter(function() {
                     return $(this).text().length > 100;
                   }).first().text().trim();

  // Parse info dari teks
  const info = {};
  const infoText = $('.infozingle, .entry-content').text();
  
  const infoPatterns = {
    'Judul': 'title',
    'Japanese': 'japaneseTitle',
    'Skor': 'score',
    'Produser': 'producer',
    'Tipe': 'type',
    'Status': 'status',
    'Total Episode': 'totalEpisode',
    'Durasi': 'duration',
    'Tanggal Rilis': 'releaseDate',
    'Studio': 'studio',
    'Genre': 'genre'
  };

  Object.keys(infoPatterns).forEach(key => {
    const regex = new RegExp(`${key}\\s*[:：]\\s*([^\\n]+)`, 'i');
    const match = infoText.match(regex);
    if (match) {
      info[infoPatterns[key]] = match[1].trim();
    }
  });

  // List episode
  const episodes = [];
  $('#epslist li, .eplist li, ul li').each((index, element) => {
    const $element = $(element);
    const episodeLink = $element.find('a').attr('href');
    const episodeText = $element.find('a').text().trim();
    
    if (episodeLink && episodeText.toLowerCase().includes('episode')) {
      const epMatch = episodeText.match(/episode\s*(\d+)/i);
      const epNum = epMatch ? parseInt(epMatch[1]) : index + 1;
      
      const slug = episodeLink.replace(BASE_URL, '').replace(/^\//, '').replace(/\/$/, '');
      
      episodes.push({
        episode: epNum,
        title: episodeText,
        link: `/${slug}`
      });
    }
  });

  return {
    success: true,
    data: {
      title: info.title || title,
      japaneseTitle: info.japaneseTitle || '',
      score: parseFloat(info.score) || 0,
      producer: info.producer || 'Unknown',
      type: info.type || 'TV',
      status: info.status || 'Ongoing',
      totalEpisode: info.totalEpisode || episodes.length.toString(),
      duration: info.duration || '24 min',
      releaseDate: info.releaseDate || 'Unknown',
      studio: info.studio || 'Unknown',
      genre: info.genre ? info.genre.split(',').map(g => g.trim()) : ['Unknown'],
      thumbnail,
      synopsis: synopsis.substring(0, 500),
      episodes: episodes.reverse()
    }
  };
}

// Scraper untuk detail episode dengan VIDEO STREAMING - DIPERBAIKI
async function getEpisodeDetail(slug) {
  const url = `${BASE_URL}/${slug}/`;
  console.log('Fetching episode from:', url);
  
  const html = await fetchHTML(url);
  if (!html) return { error: 'Episode not found' };

  const $ = cheerio.load(html);
  
  // Judul episode
  const title = $('h1.entry-title').text().trim();
  
  // Thumbnail
  const thumbnail = $('.thumb img, .wp-post-image').attr('src');
  
  // Cari video streaming embed
  const streamingLinks = [];
  
  // Cari semua iframe video
  $('iframe').each((index, element) => {
    const src = $(element).attr('src');
    if (src && (src.includes('youtube') || src.includes('drive.google') || src.includes('stream'))) {
      streamingLinks.push({
        provider: `Stream ${index + 1}`,
        url: src
      });
    }
  });

  // Cari video embed dalam script
  $('script').each((index, element) => {
    const scriptContent = $(element).html();
    if (scriptContent) {
      // Cari URL video di script
      const videoUrls = scriptContent.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8|mpd)[^\s"']*)/gi);
      if (videoUrls) {
        videoUrls.forEach(url => {
          streamingLinks.push({
            provider: 'Direct Stream',
            url: url
          });
        });
      }
      
      // Cari embed URL
      const embedUrls = scriptContent.match(/(https?:\/\/[^\s"']+(?:youtube|drive\.google|stream)[^\s"']*)/gi);
      if (embedUrls) {
        embedUrls.forEach(url => {
          if (!streamingLinks.some(link => link.url === url)) {
            streamingLinks.push({
              provider: 'Embed Stream',
              url: url
            });
          }
        });
      }
    }
  });

  // Cari link download (kalau ada)
  const downloadLinks = [];
  $('a').each((index, element) => {
    const $link = $(element);
    const href = $link.attr('href');
    const text = $link.text().trim().toLowerCase();
    
    if (href && (href.includes('download') || 
                 href.includes('.mp4') || 
                 href.includes('.mkv') ||
                 href.includes('mega.nz') ||
                 href.includes('drive.google.com/file'))) {
      downloadLinks.push({
        resolution: 'HD',
        links: [{
          provider: text || 'Download',
          url: href
        }]
      });
    }
  });

  return {
    success: true,
    data: {
      episodeTitle: title,
      thumbnail,
      streamingLinks,
      downloadLinks,
      totalStreamingLinks: streamingLinks.length,
      totalDownloadLinks: downloadLinks.length
    }
  };
}

module.exports = {
  getHomePage,
  searchAnime,
  getLatestAnime,
  getSchedule,
  getAnimeDetail,
  getEpisodeDetail,
  BASE_URL
};
