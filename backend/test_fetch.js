const axios = require('axios');
axios.post('https://www.growtopia1.com/growtopia/server_data.php', 'version=4.35&platform=0&protocol=189', {
  headers: { 'User-Agent': 'UbiServices_SDK_2019.Release.27_PC64_unicode_static' }
}).then(r => console.log(r.data)).catch(e => console.error(e.message));
