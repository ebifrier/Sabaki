const {renameSync, existsSync} = require('fs')
const rimraf = require('rimraf')
const {version} = require('../package.json')

let [from, to] = [2, 3]
  .map(i => process.argv[i])
  .map(x => x.replace(/x\.x\.x/g, version))

if (existsSync(to)) rimraf.sync(to)
renameSync(from, to)
