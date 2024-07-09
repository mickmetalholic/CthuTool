import { resolve, extname } from 'node:path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

const DIR_PATH = resolve(__dirname, './archives');
const serieses = fs.readdirSync(DIR_PATH);
serieses.forEach((series) => {
  const books = fs.readdirSync(resolve(DIR_PATH, series));
  books.forEach((book) => {
    const folderPath = resolve(DIR_PATH, series, book);
    const files = fs.readdirSync(folderPath)
      .filter(file => extname(file) === '.zip')
      .map(file => resolve(folderPath, file));
    const file = files[0];
    if (file) {
      fs.ensureDirSync(resolve(__dirname, 'result', series));
      processZipFile(file, series, `${book}.zip`);
    }
  });
  fs.removeSync(resolve(DIR_PATH, series));
});

function processZipFile(file: string, series: string, book: string) {
  const zip = new AdmZip(file);
  const newZip = new AdmZip();

  zip.getEntries().map(entry => {
    if (['.jpg', '.jpeg', '.png'].includes(extname(entry.name)) && entry.name.match(/\d/)) {
      // const data = entry.getData();
      // console.log(entry.getData());
      newZip.addFile(entry.name, entry.getData());
    }
  });

  newZip.writeZip(resolve(__dirname, 'result', series, book));
}
