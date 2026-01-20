const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const contentScriptGroup = [
  'Common/Common.js',
  'Common/ServerAPI.js',
  'Contents/ContentIdentifier.js',
  'Contents/ContentGetter.js',
  'Contents/ContentManager.js',
  'Contents/Communication.js',
  'Contents/StorageManager.js',
  'Start.js'
];

const configGroup = [
  'Common/ServerAPI.js',
  'Config/Config.js'
];

const backgroundScript = 'Background.js';

const fileMap = {
  'Start.js': 's.js',
  'Background.js': 'b.js',
  'Common/Common.js': 'Common/c.js',
  'Common/ServerAPI.js': 'Common/a.js',
  'Config/Config.js': 'Config/f.js',
  'Contents/Communication.js': 'Contents/m.js',
  'Contents/ContentGetter.js': 'Contents/g.js',
  'Contents/ContentIdentifier.js': 'Contents/i.js',
  'Contents/ContentManager.js': 'Contents/n.js',
  'Contents/StorageManager.js': 'Contents/t.js'
};

async function minifyGroup(files, enableMangle) {
  let combined = files.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
  
  const result = await minify(combined, {
    compress: {
      dead_code: true,
      drop_console: false,
      drop_debugger: true,
      keep_classnames: false,
      keep_fargs: false,
      keep_fnames: false,
      keep_infinity: false
    },
    mangle: enableMangle ? {
      toplevel: true,
      keep_classnames: false,
      keep_fnames: false
    } : false,
    format: {
      comments: false
    }
  });
  
  if (result.error) {
    console.error('Error:', result.error);
    return null;
  }
  
  return result.code;
}

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        try {
          fs.unlinkSync(curPath);
        } catch (e) {
          console.log(`Skipped locked file: ${curPath}`);
        }
      }
    });
    try {
      fs.rmdirSync(folderPath);
    } catch (e) {}
  }
}

function deleteFilesByExtension(dir, extensions) {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      deleteFilesByExtension(filePath, extensions);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted ${filePath}`);
      }
    }
  });
}

async function minifyFiles() {
  deleteFolder(path.join(__dirname, 'Tests'));
  console.log('✓ Deleted Tests folder');
  
  deleteFolder(path.join(__dirname, 'Web API'));
  console.log('✓ Deleted Web API folder');
  
  deleteFilesByExtension(__dirname, ['.md', '.txt', '.psd']);
  
  const configCode = await minifyGroup(configGroup, true);
  if (configCode) {
    fs.writeFileSync(path.join(__dirname, 'Common/a2.js'), configCode, 'utf8');
    console.log(`✓ Config group → Common/a2.js`);
  }
  
  const contentScriptCode = await minifyGroup(contentScriptGroup, true);
  if (contentScriptCode) {
    let first = true;
    for (const file of contentScriptGroup) {
      const newPath = path.join(__dirname, fileMap[file]);
      const oldPath = path.join(__dirname, file);
      fs.writeFileSync(newPath, first ? contentScriptCode : '', 'utf8');
      if (oldPath !== newPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`✓ ${file} → ${fileMap[file]} (deleted original)`);
      } else {
        console.log(`✓ ${file} → ${fileMap[file]}`);
      }
      first = false;
    }
  }
  
  const bgCode = await minifyGroup([backgroundScript], true);
  if (bgCode) {
    const newPath = path.join(__dirname, fileMap[backgroundScript]);
    const oldPath = path.join(__dirname, backgroundScript);
    fs.writeFileSync(newPath, bgCode, 'utf8');
    if (oldPath !== newPath && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`✓ ${backgroundScript} → ${fileMap[backgroundScript]} (deleted original)`);
    } else {
      console.log(`✓ ${backgroundScript} → ${fileMap[backgroundScript]}`);
    }
  }
  
  const oldConfigPath = path.join(__dirname, 'Config/Config.js');
  if (fs.existsSync(oldConfigPath)) {
    fs.unlinkSync(oldConfigPath);
    console.log('✓ Deleted Config/Config.js');
  }
  fs.writeFileSync(path.join(__dirname, 'Config/f.js'), '', 'utf8');
  
  updateManifest();
  updateHTML();
  console.log('\nAll files minified and renamed!');
}

function updateManifest() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  manifest = manifest
    .replace(/"Tests\/ContentManagerTests\.js",\s*/g, '')
    .replace('Background.js', 'b.js')
    .replace('Common/Common.js', 'Common/c.js')
    .replace('Common/ServerAPI.js', 'Common/a.js')
    .replace('Contents/ContentIdentifier.js', 'Contents/i.js')
    .replace('Contents/ContentGetter.js', 'Contents/g.js')
    .replace('Contents/ContentManager.js', 'Contents/n.js')
    .replace('Contents/Communication.js', 'Contents/m.js')
    .replace('Contents/StorageManager.js', 'Contents/t.js')
    .replace('Start.js', 's.js');
  
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✓ Updated manifest.json');
}

function updateHTML() {
  const indexPath = path.join(__dirname, 'Config/Index.html');
  let index = fs.readFileSync(indexPath, 'utf8');
  index = index.replace('../Common/ServerAPI.js', '../Common/a2.js').replace('Config.js', 'f.js');
  fs.writeFileSync(indexPath, index, 'utf8');
  
  const planPath = path.join(__dirname, 'Config/Plan.html');
  let plan = fs.readFileSync(planPath, 'utf8');
  plan = plan.replace('../Common/ServerAPI.js', '../Common/a2.js').replace('Config.js', 'f.js');
  fs.writeFileSync(planPath, plan, 'utf8');
  
  console.log('✓ Updated HTML files');
}

minifyFiles().catch(console.error);
