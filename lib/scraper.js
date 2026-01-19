const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v1.samehadaku.how';

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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

  $('.animepost').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score').text().trim();
    const type = $element.find('.type').text().trim();
    const status = $element.find('.status').text().trim();
    const link = $element.find('a').attr('href');
    
    const genres = [];
    $element.find('.genres a').each((i, el) => {
      genres.push($(el).text().trim());
    });

    animeList.push({
      id: index + 1,
      title,
      thumbnail,
      rating: parseFloat(rating) || 0,
      type,
      status,
      genres,
      link: link ? link.replace(BASE_URL, '') : null
    });
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

  $('.animposx').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score').text().trim();
    const type = $element.find('.type').text().trim();
    const episode = $element.find('.epx').text().trim();
    const link = $element.find('a').attr('href');
    
    results.push({
      id: index + 1,
      title,
      thumbnail,
      rating: parseFloat(rating) || 0,
      type,
      episode,
      link: link ? link.replace(BASE_URL, '') : null
    });
  });

  return {
    success: true,
    query,
    results,
    total: results.length
  };
}

// Scraper untuk anime terbaru
async function getLatestAnime() {
  const html = await fetchHTML(BASE_URL + '/anime-terbaru/');
  if (!html) return { error: 'Failed to fetch data' };

  const $ = cheerio.load(html);
  const latestAnime = [];

  $('.animepost').each((index, element) => {
    const $element = $(element);
    
    const title = $element.find('.tt').text().trim();
    const thumbnail = $element.find('img').attr('src');
    const rating = $element.find('.score').text().trim();
    const episode = $element.find('.epx').text().trim();
    const date = $element.find('.date').text().trim();
    const link = $element.find('a').attr('href');
    
    latestAnime.push({
      id: index + 1,
      title,
      thumbnail,
      rating: parseFloat(rating) || 0,
      episode,
      date,
      link: link ? link.replace(BASE_URL, '') : null
    });
  });

  return {
    success: true,
    data: latestAnime,
    total: latestAnime.length
  };
}

// Scraper untuk jadwal rilis
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

  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  
  days.forEach(day => {
    $(`.${day} .schedule-list`).each((index, element) => {
      const $element = $(element);
      
      const title = $element.find('.title-sch').text().trim();
      const time = $element.find('.time').text().trim();
      const episode = $element.find('.episode-sch').text().trim();
      const thumbnail = $element.find('img').attr('src');
      const link = $element.find('a').attr('href');
      
      schedule[day].push({
        id: index + 1,
        title,
        time,
        episode,
        thumbnail,
        link: link ? link.replace(BASE_URL, '') : null
      });
    });
  });

  return {
    success: true,
    schedule,
    updated: new Date().toISOString()
  };
}

// Scraper untuk detail anime
async function getAnimeDetail(slug) {
  const html = await fetchHTML(`${BASE_URL}/anime/${slug}/`);
  if (!html) return { error: 'Anime not found' };

  const $ = cheerio.load(html);
  
  // Informasi utama
  const title = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Judul');
  }).next().text().trim();

  const japaneseTitle = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Japanese');
  }).next().text().trim();

  const score = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Skor');
  }).next().text().trim();

  const producer = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Produser');
  }).next().text().trim();

  const type = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Tipe');
  }).next().text().trim();

  const status = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Status');
  }).next().text().trim();

  const totalEpisode = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Total Episode');
  }).next().text().trim();

  const duration = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Durasi');
  }).next().text().trim();

  const releaseDate = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Tanggal Rilis');
  }).next().text().trim();

  const studio = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Studio');
  }).next().text().trim();

  const genre = $('.infozingle p strong').filter(function() {
    return $(this).text().includes('Genre');
  }).next().text().trim();

  const thumbnail = $('.thumb img').attr('src');
  const synopsis = $('.sinopc').text().trim();

  // List episode
  const episodes = [];
  $('#epslist li').each((index, element) => {
    const $element = $(element);
    
    const episodeTitle = $element.find('.lchx a').text().trim();
    const episodeLink = $element.find('.lchx a').attr('href');
    const episodeDate = $element.find('.datex').text().trim();
    
    episodes.push({
      episode: index + 1,
      title: episodeTitle,
      date: episodeDate,
      link: episodeLink ? episodeLink.replace(BASE_URL, '') : null
    });
  });

  return {
    success: true,
    data: {
      title,
      japaneseTitle,
      score: parseFloat(score) || 0,
      producer,
      type,
      status,
      totalEpisode,
      duration,
      releaseDate,
      studio,
      genre: genre.split(',').map(g => g.trim()),
      thumbnail,
      synopsis,
      episodes: episodes.reverse() // Reverse agar episode terbaru di atas
    }
  };
}

// Scraper untuk detail episode (termasuk link video)
async function getEpisodeDetail(slug) {
  const html = await fetchHTML(`${BASE_URL}/${slug}/`);
  if (!html) return { error: 'Episode not found' };

  const $ = cheerio.load(html);
  
  // Judul episode
  const title = $('.posttl').text().trim();
  
  // Thumbnail
  const thumbnail = $('.thumb img').attr('src');
  
  // Link download
  const downloadLinks = [];
  $('#linkdl tr').each((index, element) => {
    const $element = $(element);
    if (index === 0) return; // Skip header
    
    const resolution = $element.find('td:first-child strong').text().trim();
    const links = [];
    
    $element.find('a').each((i, linkEl) => {
      const provider = $(linkEl).text().trim();
      const url = $(linkEl).attr('href');
      links.push({ provider, url });
    });
    
    downloadLinks.push({
      resolution,
      links
    });
  });

  // Link streaming/mirror
  const streamingLinks = [];
  $('.mirrorstream a').each((index, element) => {
    streamingLinks.push({
      provider: $(element).text().trim(),
      url: $(element).attr('href')
    });
  });

  // Info anime
  const animeInfo = {
    title: $('.infox .thumb a').attr('title'),
    link: $('.infox .thumb a').attr('href')
  };

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
