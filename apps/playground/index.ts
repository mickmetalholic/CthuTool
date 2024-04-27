// import { resolve } from 'path';
// import { download } from './src/mahuagui';
import fs from 'fs-extra';
import { basename, extname, resolve } from 'path';

// download({
//   id: '4465',
//   title: '走马灯株式会社',
//   folderPath: resolve('download'),
//   chapterBlackList: [
//     '62991',
//     '60888',
//     '61040',
//     '61041',
//     '61262',
//     '61532'
//   ],
// });

const SRC = [
  'download/走马灯株式会社/第65话',
  'download/走马灯株式会社/第66话',
  'download/走马灯株式会社/第67话',
  'download/走马灯株式会社/第68话',
  'download/走马灯株式会社/第69话',
  'download/走马灯株式会社/第70话',
  'download/走马灯株式会社/第71话'
];
const DIST = 'download/走马灯株式会社/第08卷';

for (const src of SRC) {
  const base = fs.readdirSync(DIST).length;
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const op = resolve(src, file);

    const en = extname(file);
    const bn = basename(file, en);
    const nn = `${Number(bn) + base}${en}`;

    const np = resolve(DIST, nn);

    if (fs.existsSync(np)) {
      console.log(`${np} already exists.`);
      process.exit(0);
    }

    fs.moveSync(op, np);
  });
}
