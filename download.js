import fs from 'fs';
import https from 'https';

const urls = [
  "https://storage.googleapis.com/mpx-node/snaps/image/7526/img_0_1742822716_9239.jpg",
  "https://storage.googleapis.com/mpx-node/snaps/image/7526/img_1_1742822716_9239.jpg",
  "https://storage.googleapis.com/mpx-node/snaps/image/7526/img_2_1742822716_9239.jpg"
];

urls.forEach((url, i) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${url}: ${res.statusCode}`);
      return;
    }
    const file = fs.createWriteStream(`public/ad${i+1}.jpg`);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ad${i+1}.jpg`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${url}:`, err.message);
  });
});
