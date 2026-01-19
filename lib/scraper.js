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

// Scraper untuk halaman utama (rekomendasi anime)
async function getHomePage() {
  const html = await fetchHTML(BASE_URL + '/daftar-anime-2/');
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const animeList = [];

  // Coba berbagai selector kemungkinan
  $('.animepost, .animposx, .listanime, .list-item, .post').each((index, element) => {
    const $element = $(element);
    
    // Cari thumbnail
    let thumbnail = $element.find('img').attr('src') || 
                    $element.find('img').attr('data-src') || 
                    $element.find('.thumb img').attr('src');
    
    // Cari judul
    let title = $element.find('.tt, .title, h2, h3, a').first().text().trim();
    
    // Cari rating
    let ratingText = $element.find('.score, .rating, .rate').text().trim();
    let rating = parseFloat(ratingText) || 0;
    
    // Cari tipe
    let type = $element.find('.type, .tipe, .eps, .episode').text().trim();
    
    // Cari link
    let link = $element.find('a').attr('href');
    if (link && !link.includes(BASE_URL)) {
      link = link.startsWith('/') ? BASE_URL + link : link;
    }

    if (thumbnail && title) {
      animeList.push({
        id: index + 1,
        title,
        thumbnail,
        rating,
        type,
        link: link ? link.replace(BASE_URL, '') : null
      });
    }
  });

  // Fallback jika tidak ada yang ditemukan
  if (animeList.length === 0) {
    $('.post').each((index, element) => {
      const $element = $(element);
      const title = $element.find('h2').text().trim();
      const thumbnail = $element.find('img').attr('src');
      const link = $element.find('a').attr('href');
      
      if (title && thumbnail) {
        animeList.push({
          id: index + 1,
          title,
          thumbnail,
          rating: 0,
          type: 'Anime',
          link: link ? link.replace(BASE_URL, '') : null
        });
      }
    });
  }

  return {
    success: true,
    data: animeList,
    total: animeList.length
  };
}

// Scraper untuk pencarian - DIPERBAIKI
async function searchAnime(query) {
  const html = await fetchHTML(`${BASE_URL}/?s=${encodeURIComponent(query)}`);
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const results = [];

  console.log('Search HTML length:', html.length); // Debug

  // Coba berbagai selector
  $('.animepost, .animposx, .post, article, .item').each((index, element) => {
    const $element = $(element);
    
    // Debug element
    console.log(`Element ${index}:`, $element.html().substring(0, 100));
    
    let title = $element.find('.tt, h2, h3, .title, a').text().trim();
    let thumbnail = $element.find('img').attr('src') || 
                    $element.find('img').attr('data-src');
    let ratingText = $element.find('.score, .rating').text().trim();
    let type = $element.find('.type, .tipe').text().trim();
    let episode = $element.find('.epx, .episode, .eps').text().trim();
    let link = $element.find('a').attr('href');

    // Clean up link
    if (link && !link.includes(BASE_URL) && link.startsWith('/')) {
      link = BASE_URL + link;
    }

    if (title && thumbnail) {
      results.push({
        id: index + 1,
        title,
        thumbnail,
        rating: parseFloat(ratingText) || 0,
        type,
        episode: episode || 'Unknown',
        link: link ? link.replace(BASE_URL, '') : null
      });
    }
  });

  // Fallback method jika tidak ada hasil
  if (results.length === 0) {
    $('h2').each((index, element) => {
      const $title = $(element);
      const title = $title.text().trim();
      const $parent = $title.parent().parent();
      const thumbnail = $parent.find('img').attr('src');
      const link = $title.find('a').attr('href');

      if (title && thumbnail && !title.includes('Search Results')) {
        results.push({
          id: index + 1,
          title,
          thumbnail,
          rating: 0,
          type: 'Anime',
          episode: 'Unknown',
          link: link ? link.replace(BASE_URL, '') : null
        });
      }
    });
  }

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

  console.log('Latest anime page loaded'); // Debug

  // Coba selector yang lebih umum
  $('article, .post, .animepost, .item').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('h2, h3, .tt, .title').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score, .rating').text().trim();
    const episode = $element.find('.epx, .episode, .eps').text().trim();
    const date = $element.find('.date, time').text().trim();
    let link = $element.find('a').attr('href');

    if (link && !link.includes(BASE_URL) && link.startsWith('/')) {
      link = BASE_URL + link;
    }

    if (title && thumbnail) {
      latestAnime.push({
        id: index + 1,
        title,
        thumbnail,
        rating: parseFloat(rating) || 0,
        episode: episode || 'Unknown',
        date: date || 'Unknown',
        link: link ? link.replace(BASE_URL, '') : null
      });
    }
  });

  // Alternative selector
  if (latestAnime.length === 0) {
    $('.post').each((index, element) => {
      const $element = $(element);
      const title = $element.find('.entry-title').text().trim();
      const thumbnail = $element.find('.wp-post-image').attr('src');
      const link = $element.find('a').attr('href');
      
      if (title && thumbnail) {
        latestAnime.push({
          id: index + 1,
          title,
          thumbnail,
          rating: 0,
          episode: 'Latest',
          date: 'Today',
          link: link ? link.replace(BASE_URL, '') : null
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

  console.log('Schedule page loaded'); // Debug

  // Cari semua hari
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  
  days.forEach(day => {
    // Coba berbagai selector untuk setiap hari
    $(`.${day}, #${day}, [class*="${day}"], .schedule-${day}`).each((index, element) => {
      const $element = $(element);
      
      // Cari elemen anime dalam schedule
      $element.find('li, .item, .anime-item, .schedule-item').each((i, animeEl) => {
        const $anime = $(animeEl);
        
        const title = $anime.find('.title-sch, .title, a').text().trim();
        const time = $anime.find('.time, .jam').text().trim();
        const episode = $anime.find('.episode-sch, .episode, .eps').text().trim();
        const thumbnail = $anime.find('img').attr('src');
        let link = $anime.find('a').attr('href');

        if (link && !link.includes(BASE_URL) && link.startsWith('/')) {
          link = BASE_URL + link;
        }

        if (title) {
          schedule[day].push({
            id: i + 1,
            title,
            time: time || 'Unknown',
            episode: episode || 'Unknown',
            thumbnail: thumbnail || '',
            link: link ? link.replace(BASE_URL, '') : null
          });
        }
      });
    });
  });

  // Fallback: cari berdasarkan teks hari
  if (Object.values(schedule).flat().length === 0) {
    const daySections = $('h2, h3, h4').filter(function() {
      const text = $(this).text().toLowerCase();
      return days.some(day => text.includes(day));
    });

    daySections.each((i, section) => {
      const $section = $(section);
      const sectionText = $section.text().toLowerCase();
      const matchedDay = days.find(day => sectionText.includes(day));
      
      if (matchedDay) {
        const $next = $section.next();
        $next.find('li, a').each((j, animeEl) => {
          const $anime = $(animeEl);
          const title = $anime.text().trim();
          if (title && title.length > 2) {
            schedule[matchedDay].push({
              id: j + 1,
              title,
              time: 'Unknown',
              episode: 'Unknown',
              thumbnail: '',
              link: null
            });
          }
        });
      }
    });
  }

  return {
    success: true,
    schedule,
    updated: new Date().toISOString()
  };
}

// Scraper untuk detail anime - DIPERBAIKI
async function getAnimeDetail(slug) {
  const url = `${BASE_URL}/anime/${slug}/`;
  console.log('Fetching anime detail from:', url);
  
  const html = await fetchHTML(url);
  if (!html) return { error: 'Anime not found' };

  const $ = cheerio.load(html);
  
  // Debug: lihat struktur HTML
  console.log('Page title:', $('title').text());
  
  // Informasi utama - coba berbagai selector
  const title = $('.entry-title, h1, .title, .judul').text().trim();
  const thumbnail = $('.thumb img, .wp-post-image, img.size-full').attr('src');
  const synopsis = $('.sinopc, .synopsis, .entry-content, .content').text().trim().substring(0, 500);

  // Cari informasi dari tabel atau list
  const info = {};
  $('p, .info, .infox').each((index, element) => {
    const $element = $(element);
    const text = $element.text();
    
    // Cari berbagai field info
    const mappings = {
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

    Object.keys(mappings).forEach(key => {
      if (text.includes(key + ':')) {
        const value = text.split(key + ':')[1]?.split('\n')[0]?.trim();
        if (value) {
          info[mappings[key]] = value;
        }
      }
    });
  });

  // Alternative: cari di seluruh page
  if (!info.score) {
    const scoreText = $('.score, .rating').text().trim();
    info.score = parseFloat(scoreText) || 0;
  }

  // List episode
  const episodes = [];
  
  // Coba berbagai selector untuk episode list
  $('#epslist li, .episode-list li, .lstone li, .eplist li').each((index, element) => {
    const $element = $(element);
    
    const episodeTitle = $element.find('.lchx a, a').text().trim();
    const episodeLink = $element.find('a').attr('href');
    const episodeDate = $element.find('.datex, .date').text().trim();
    
    if (episodeTitle) {
      episodes.push({
        episode: index + 1,
        title: episodeTitle,
        date: episodeDate || 'Unknown',
        link: episodeLink ? episodeLink.replace(BASE_URL, '') : null
      });
    }
  });

  // Fallback untuk episode
  if (episodes.length === 0) {
    $('a').each((index, element) => {
      const $element = $(element);
      const href = $element.attr('href');
      const text = $element.text().trim();
      
      if (href && href.includes('episode') && text.toLowerCase().includes('episode')) {
        episodes.push({
          episode: index + 1,
          title: text,
          date: 'Unknown',
          link: href.replace(BASE_URL, '')
        });
      }
    });
  }

  return {
    success: true,
    data: {
      title: info.title || title,
      japaneseTitle: info.japaneseTitle || '',
      score: info.score || 0,
      producer: info.producer || 'Unknown',
      type: info.type || 'TV',
      status: info.status || 'Ongoing',
      totalEpisode: info.totalEpisode || episodes.length.toString(),
      duration: info.duration || '24 min',
      releaseDate: info.releaseDate || 'Unknown',
      studio: info.studio || 'Unknown',
      genre: info.genre ? info.genre.split(',').map(g => g.trim()) : ['Unknown'],
      thumbnail: thumbnail || '',
      synopsis: synopsis || 'No synopsis available',
      episodes: episodes.reverse()
    }
  };
}

// Scraper untuk detail episode (termasuk link video) - DIPERBAIKI
async function getEpisodeDetail(slug) {
  const url = `${BASE_URL}/${slug}/`;
  console.log('Fetching episode from:', url);
  
  const html = await fetchHTML(url);
  if (!html) return { error: 'Episode not found' };

  const $ = cheerio.load(html);
  
  // Judul episode
  const title = $('.entry-title, h1, .posttl').text().trim();
  
  // Thumbnail
  const thumbnail = $('.thumb img, .wp-post-image, img.size-full').attr('src');
  
  // Info anime terkait
  const animeInfo = {
    title: $('.infox .thumb a').attr('title') || 
           $('.anime-title a').text().trim() ||
           $('a[href*="/anime/"]').first().text().trim(),
    link: $('.infox .thumb a').attr('href') || 
          $('.anime-title a').attr('href')
  };

  // Link download
  const downloadLinks = [];
  
  // Coba berbagai selector untuk tabel download
  $('#linkdl tr, table tr, .download-table tr').each((index, element) => {
    const $element = $(element);
    if (index === 0) return; // Skip header
    
    const cells = $element.find('td');
    if (cells.length >= 2) {
      const resolution = $(cells[0]).text().trim();
      const links = [];
      
      $(cells[1]).find('a').each((i, linkEl) => {
        const provider = $(linkEl).text().trim();
        const url = $(linkEl).attr('href');
        if (url) {
          links.push({ provider, url });
        }
      });
      
      if (resolution && links.length > 0) {
        downloadLinks.push({
          resolution,
          links
        });
      }
    }
  });

  // Link streaming/mirror
  const streamingLinks = [];
  $('.mirrorstream a, .streaming a, .watch a, a[href*="stream"]').each((index, element) => {
    const url = $(element).attr('href');
    const provider = $(element).text().trim() || `Stream ${index + 1}`;
    
    if (url && url.includes('http')) {
      streamingLinks.push({
        provider,
        url
      });
    }
  });

  // Fallback: cari semua link yang mungkin
  if (downloadLinks.length === 0 && streamingLinks.length === 0) {
    $('a').each((index, element) => {
      const $element = $(element);
      const url = $element.attr('href');
      const text = $element.text().trim().toLowerCase();
      
      if (url && (url.includes('download') || 
                  url.includes('drive') || 
                  url.includes('mega') || 
                  url.includes('zippyshare') ||
                  url.includes('google'))) {
        downloadLinks.push({
          resolution: 'Unknown',
          links: [{
            provider: text || 'Download',
            url: url
          }]
        });
      }
      
      if (url && (url.includes('stream') || 
                  url.includes('watch') || 
                  url.includes('video'))) {
        streamingLinks.push({
          provider: text || 'Stream',
          url: url
        });
      }
    });
  }

  return {
    success: true,
    data: {
      episodeTitle: title,
      thumbnail,
      animeInfo,
      downloadLinks,
      streamingLinks,
      totalDownloadLinks: downloadLinks.length,
      totalStreamingLinks: streamingLinks.length
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
