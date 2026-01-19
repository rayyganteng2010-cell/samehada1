const { getLatestAnime } = require('../lib/scraper');

module.exports = async (req, res) => {
  try {
    const data = await getLatestAnime();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
