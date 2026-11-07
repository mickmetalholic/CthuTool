#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const node=process.execPath;
if(process.versions.node.split('.')[0]!=='24')throw new Error('Packaged dotfiles smoke requires Node 24');
const npm=[join(dirname(node),'../lib/node_modules/npm/bin/npm-cli.js'),join(dirname(node),'node_modules/npm/bin/npm-cli.js')].find(existsSync);
if(!npm)throw new Error('Complete Node/npm distribution required for package smoke');
const work=realpathSync(mkdtempSync(join(tmpdir(),'cthu-packaged-dotfiles-')));
const home=join(work,'home');mkdirSync(home);
const env={...process.env,HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:join(home,'.config'),XDG_DATA_HOME:join(home,'.local/share'),npm_config_cache:join(work,'cache'),npm_config_offline:'true',npm_config_audit:'false',npm_config_fund:'false',npm_config_update_notifier:'false',NOTION_TOKEN:''};
try{
  const packed=JSON.parse(execFileSync(node,[npm,'pack','--json','--ignore-scripts','--pack-destination',work],{cwd:root,env,encoding:'utf8'}))[0].filename;
  const prefix=join(work,'prefix');execFileSync(node,[npm,'install','--global','--prefix',prefix,'--ignore-scripts',join(work,packed)],{env,stdio:'pipe'});
  const installed=realpathSync(join(prefix,process.platform==='win32'?'node_modules':'lib/node_modules','cthutool'));
  if(existsSync(join(installed,'node_modules')))throw new Error('Standalone smoke unexpectedly has runtime/development node_modules');
  const entry=join(installed,'apps/cli/bin/chc.mjs');const preload=join(work,'offline.mjs');
  writeFileSync(preload,"if(process.env.FIXTURE_OS)Object.defineProperty(process,'platform',{value:process.env.FIXTURE_OS});globalThis.fetch=async()=>{throw new Error('Unexpected network in offline package smoke')};");
  function invoke(args,extra={}){return execFileSync(node,['--import',preload,entry,...args],{cwd:work,env:{...env,PATH:join(work,'empty-bin'),...extra},encoding:'utf8',timeout:15000});}
  for(const args of [['dotfiles'],['dotfiles','env'],['dotfiles','config'],['dotfiles','notion'],['dotfiles','notion','validate','--json'],['dotfiles','env','doctor','--json']])invoke(args);
  // Simulated platform metadata exercises all published plans; it is not native OS acceptance.
  for(const [host,os] of [['windows-desktop','win32'],['darwin-macbook-pro','darwin'],['darwin-mac-mini','darwin'],['linux-wsl','linux'],['linux-ubuntu-server','linux']]){
    const result=JSON.parse(invoke(['dotfiles','env','setup','--host',host,'--dry-run','--json'],{FIXTURE_OS:os,WSL_DISTRO_NAME:host==='linux-wsl'?'fixture':''}));
    if(!result.ok||!result.result.dryRun||result.result.source!==installed)throw new Error(`Packaged source resolution failed for ${host}`);
  }
  console.log(`Node ${process.version} standalone package: help, offline validation, missing-command doctor and five simulated host dry-runs passed.`);
}finally{rmSync(work,{recursive:true,force:true});}
