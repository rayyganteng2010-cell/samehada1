const { getLatestAnime } = require('../lib/scraper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Fetching latest anime...');
    const data = await getLatestAnime();
    
    if (data.error) {
      return res.status(404).json({ 
        success: false, 
        error: data.error 
      });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in latest.js:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
