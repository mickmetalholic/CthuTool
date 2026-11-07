#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const inventory=JSON.parse(readFileSync(join(root,'dotfiles/asset-inventory.json'),'utf8'));
if(inventory.version!==1)throw new Error('Unsupported asset inventory');
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(path,e.name)):[relative(root,join(path,e.name)).replaceAll('\\','/')]);}
const actual=['.chezmoiroot','.chezmoiversion',...files(join(root,'dotfiles')).filter(p=>p!=='dotfiles/asset-inventory.json')].sort();
if(JSON.stringify(actual)!==JSON.stringify([...inventory.files].sort()))throw new Error('Dotfiles asset inventory mismatch; review the added/missing paths.');
for(const path of actual)readFileSync(join(root,path));
const npm=spawnSync('npm',['pack','--dry-run','--json','--ignore-scripts'],{cwd:root,encoding:'utf8',shell:process.platform==='win32'});
if(npm.status!==0)throw new Error('Unable to inspect installable package inventory');
const packed=new Set(JSON.parse(npm.stdout)[0].files.map(f=>f.path));
for(const p of [...actual,'dotfiles/asset-inventory.json'])if(!packed.has(p))throw new Error(`Required packaged dotfiles asset missing: ${p}`);
const validate=spawnSync(process.execPath,[join(root,'apps/cli/bin/chc.mjs'),'dotfiles','notion','validate','--source',root,'--json','--no-interactive'],{cwd:dirname(root),encoding:'utf8',env:{...process.env,NOTION_TOKEN:''}});
if(validate.status!==0)throw new Error(`Offline snapshot validation failed: ${validate.stdout}${validate.stderr}`);
const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).volta.node;
const rows=readFileSync(join(root,'scripts/bootstrap-node-runtime.tsv'),'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('\t'));
if(rows.length!==6||rows.some(([v,target,url,hash])=>v!==version||!/^https:\/\/nodejs.org\/dist\/v24\./.test(url)||!/[a-f0-9]{64}/.test(hash)||!['darwin-x64','darwin-arm64','linux-x64','linux-arm64','win-x64','win-arm64'].includes(target)))throw new Error('Invalid complete Node/npm runtime lock');
console.log(`Dotfiles snapshot valid; ${actual.length} required assets present in npm package; six Node/npm targets verified.`);
