import { writeFileSync } from 'fs';
import pngToIco from 'png-to-ico';

pngToIco('assets/blue/icon.png')
  .then(buf => {
    writeFileSync('assets/blue/icon.ico', buf);
    console.log('Icon successfully created!');
  })
  .catch(console.error);