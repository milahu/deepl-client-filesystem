#!/usr/bin/env node

const getPath = require('platform-folders').default;
const glob = require('fast-glob');
const fs = require('fs');
const express = require('express');
const path = require('path');

let isVerbose = false;
const backendConfig = require("./config.json");
const cacheDir = getPath('cache') + '/deepl-client-filesystem';
if (fs.existsSync(cacheDir) == false) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const argv = process.argv.slice(1);
var args = argv.slice(1);

if (args[0] == '--verbose') {
  isVerbose = true;
  args.shift();
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route handlers

app.get('/api/sourceText', (req, res) => {
  // get next sourceText

  const timeKey = 'mtime';
  const sourceTextFileList = (
    glob.sync(`${cacheDir}/*/*/*`)
    .map(p => ({ p, t: fs.statSync(p)[timeKey].getTime() }))
    .sort((a, b) => (a.t - b.t)) // ascending
    .map(f => f.p)
  );
  //console.dir({ sourceTextFileList });
  const sourceTextFile = sourceTextFileList[0];
  console.log(`sourceTextFile = ${sourceTextFile}`);

  if (!sourceTextFile) {
    res.json({
      ok: 0,
      why: `
<p>no sourceText files</p>
<p>please copy your sourceText files to ${cacheDir}</p>
<p>sample:</p>
<pre>
mkdir -p ${cacheDir}/en/de
echo hello world > ${cacheDir}/en/de/just-a-test.txt
</pre>
`
    });
    return;
  }

  const sourceTextFileRelative = path.relative(cacheDir, sourceTextFile);
  console.log(`sourceTextFileRelative = ${sourceTextFileRelative}`);
  const [sourceLang, targetLang] = sourceTextFileRelative.split('/');
  const sourceText = fs.readFileSync(sourceTextFile, 'utf8');
  res.json({ ok: 1, sourceLang, targetLang, sourceText });
});

// fallback route (catch all)
app.get(/.*/, (req, res) => {
  res.status(404).send();
});

// start server
const backendUrl = `${backendConfig.protocol}://${backendConfig.host}:${backendConfig.port}`;
app.listen(backendConfig.port, backendConfig.host, (error) => {
  if (error) console.dir({ express_error: error });
  console.log(`server listening on ${backendUrl}`);
});
