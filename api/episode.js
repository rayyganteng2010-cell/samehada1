const { getEpisodeDetail } = require('../lib/scraper');

module.exports = async (req, res) => {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: 'Query parameter "slug" is required' });
    }
    
    const data = await getEpisodeDetail(slug);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
