import { resolve, extname, basename } from 'node:path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

const tempFolder = resolve(__dirname, '.temp');
fs.ensureDirSync(tempFolder);
fs.emptydirSync(tempFolder);

const DIR_PATH = resolve(__dirname, './archives');
const books = fs.readdirSync(DIR_PATH);
const zipFiles = books.reduce((res, book) => {
  const folderPath = resolve(DIR_PATH, book);
  const files = fs.readdirSync(folderPath)
    .filter(file => extname(file) === '.zip')
    .map(file => resolve(folderPath, file));
  res.push(...files);
  return res;
}, [] as string[]);

function processZipFile(file: string) {
  const zip = new AdmZip(file);
  const newZip = new AdmZip();

  zip.getEntries().map(entry => {
    if (['.jpg', '.png'].includes(extname(entry.name)) && entry.name.match(/\d/)) {
      // const data = entry.getData();
      // console.log(entry.getData());
      newZip.addFile(entry.name, entry.getData());
    }
  });

  newZip.writeZip(resolve(__dirname, 'result', basename(file)));
}

// processZipFile(zipFiles[0]);

for (const file of zipFiles) {
  processZipFile(file);
}
