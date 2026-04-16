#!/bin/bash
cd /home/ubuntu/backend/storesgo-backend-clean/storesgo-backend-clean
node -e "const { runAutoblogOnce } = require('./dist/jobs/autoblog.js'); runAutoblogOnce().then(r => console.log(new Date().toISOString(), r)).catch(e => console.error(e));" >> /home/ubuntu/autoblog.log 2>&1
