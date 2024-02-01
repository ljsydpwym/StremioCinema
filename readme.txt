Deploy is done automatically into Vercel after each commit into master.
https://stremio-cinema.vercel.app/

Urls:
https://stremio-cinema.vercel.app/1/*TOKEN*/manifest.json

To test locally:
brew install npm
npm i
npm start -- --launch

add this addon: http://127.0.0.1:7001/1/*TOKEN*/manifest.json

to see logs - comment out if in logger.js